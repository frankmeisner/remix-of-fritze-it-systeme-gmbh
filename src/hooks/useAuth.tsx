import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, Profile } from '@/types/panel';
import { checkRateLimit, recordAttempt, clearAttempts, formatRetryTime } from '@/lib/rate-limiter';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Ensure Realtime uses the latest JWT (fixes missing postgres_changes events)
        try {
          supabase.realtime.setAuth(session?.access_token ?? '');
        } catch (e) {
          console.warn('Could not set realtime auth token:', e);
        }

        if (session?.user) {
          // Ensure dashboards never render with half-loaded auth state
          setLoading(true);
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Ensure Realtime uses the latest JWT (fixes missing postgres_changes events)
      try {
        supabase.realtime.setAuth(session?.access_token ?? '');
      } catch (e) {
        console.warn('Could not set realtime auth token:', e);
      }

      if (session?.user) {
        setLoading(true);
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const [profileRes, roleRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
      ]);

      if (profileRes.error) {
        console.error('Error fetching profile:', profileRes.error);
      }
      if (roleRes.error) {
        console.error('Error fetching role:', roleRes.error);
      }

      if (profileRes.data) {
        setProfile(profileRes.data as Profile);
      } else {
        setProfile(null);
      }

      // Role fallback: avoid blank panels if RLS prevents selecting user_roles
      if (roleRes.data?.role) {
        setRole(roleRes.data.role as AppRole);
      } else {
        const { data: isAdmin, error: roleCheckError } = await supabase.rpc('has_role', {
          _user_id: userId,
          _role: 'admin',
        });

        if (roleCheckError) {
          console.error('Error checking role via has_role:', roleCheckError);
          setRole(null);
        } else {
          setRole((isAdmin ? 'admin' : 'employee') as AppRole);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setProfile(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    // Rate limit check before attempting login
    const rateLimitKey = `login:${email.toLowerCase()}`;
    const { allowed, retryAfterMs } = checkRateLimit(rateLimitKey, 'login');
    
    if (!allowed) {
      const retryTime = formatRetryTime(retryAfterMs);
      return { 
        error: new Error(`Zu viele Anmeldeversuche. Bitte versuche es in ${retryTime} erneut.`) 
      };
    }
    
    // Record the attempt before making the request
    recordAttempt(rateLimitKey);
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    // Clear rate limit on successful login
    if (!error) {
      clearAttempts(rateLimitKey);
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();

    try {
      supabase.realtime.setAuth('');
    } catch {
      // ignore
    }

    setProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
