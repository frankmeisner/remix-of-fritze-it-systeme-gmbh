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
    let profileDeletionChannel: ReturnType<typeof supabase.channel> | null = null;

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

          // Listen for profile deletion to auto-logout immediately
          if (profileDeletionChannel) {
            supabase.removeChannel(profileDeletionChannel);
          }
          profileDeletionChannel = supabase
            .channel('profile-deletion-listener')
            .on('postgres_changes', {
              event: 'DELETE',
              schema: 'public',
              table: 'profiles'
            }, (payload) => {
              // Check if this deletion is for the current user
              const deletedUserId = (payload.old as any)?.user_id;
              if (deletedUserId === session.user.id) {
                console.log('Profile deleted, forcing immediate logout');
                // Clear local state immediately
                setUser(null);
                setSession(null);
                setProfile(null);
                setRole(null);
                // Sign out from Supabase
                supabase.auth.signOut();
                // Redirect to login
                window.location.href = '/panel/login';
              }
            })
            .subscribe();
        } else {
          setProfile(null);
          setRole(null);
          setLoading(false);
          
          // Clean up profile deletion listener
          if (profileDeletionChannel) {
            supabase.removeChannel(profileDeletionChannel);
            profileDeletionChannel = null;
          }
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('getSession error:', error);

        // Common in dev when storage is stale; avoid endless refresh loops
        const anyErr = error as any;
        const isRefreshTokenInvalid =
          anyErr?.code === 'refresh_token_not_found' ||
          /refresh token/i.test(anyErr?.message || '');

        if (isRefreshTokenInvalid) {
          try {
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const key = localStorage.key(i);
              if (key && /^sb-.*-auth-token$/.test(key)) {
                localStorage.removeItem(key);
              }
            }
          } catch {
            // ignore
          }

          supabase.auth.signOut();
        }

        setSession(null);
        setUser(null);
        setProfile(null);
        setRole(null);
        setLoading(false);
        return;
      }

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

    return () => {
      subscription.unsubscribe();
      if (profileDeletionChannel) {
        supabase.removeChannel(profileDeletionChannel);
      }
    };
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
        // If the profile row is gone, the account was removed -> force logout immediately
        console.warn('Profile missing (account removed). Forcing logout.');
        setProfile(null);
        setRole(null);
        setSession(null);
        setUser(null);
        try {
          await supabase.auth.signOut();
        } finally {
          window.location.href = '/panel/login';
        }
        return;
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
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    // Clear rate limit and log login on success
    if (!error && data.user) {
      clearAttempts(rateLimitKey);
      // Log login activity for admin visibility (fire and forget)
      supabase.from('activity_logs').insert({
        user_id: data.user.id,
        activity_type: 'login',
        metadata: { email: email.toLowerCase() }
      }).then(() => {});
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
