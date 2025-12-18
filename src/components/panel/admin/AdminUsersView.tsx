import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile, UserRole, AppRole } from '@/types/panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Plus, User, Mail, Shield, Trash2, Eye } from 'lucide-react';
import AdminEmployeeDetailView from './AdminEmployeeDetailView';
import { userCreationSchema, validateWithSchema } from '@/lib/validation';

type UserStatus = 'online' | 'away' | 'busy' | 'offline';

interface UserWithRole extends Profile {
  role: AppRole;
  status?: UserStatus;
}

const statusColors: Record<UserStatus, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-400'
};

const statusLabels: Record<UserStatus, string> = {
  online: 'Online',
  away: 'Abwesend',
  busy: 'Beschäftigt',
  offline: 'Offline'
};

export default function AdminUsersView() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<UserWithRole | null>(null);
  const { toast } = useToast();

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'employee' as AppRole
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: roles } = await supabase.from('user_roles').select('*');

    if (profiles && roles) {
      const usersWithRoles = profiles.map(profile => {
        const userRole = roles.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          role: (userRole?.role || 'employee') as AppRole
        } as UserWithRole;
      });
      setUsers(usersWithRoles);
    }
  };

  const handleCreateUser = async () => {
    // Use zod schema for comprehensive validation
    const validation = validateWithSchema(userCreationSchema, {
      email: newUser.email.trim(),
      password: newUser.password,
      first_name: newUser.first_name.trim(),
      last_name: newUser.last_name.trim(),
      role: newUser.role
    });

    if (!validation.success) {
      toast({ title: 'Fehler', description: (validation as { success: false; error: string }).error, variant: 'destructive' });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: 'Fehler', description: 'Nicht angemeldet.', variant: 'destructive' });
      return;
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        email: newUser.email.trim().toLowerCase(),
        password: newUser.password,
        first_name: newUser.first_name.trim(),
        last_name: newUser.last_name.trim(),
        role: newUser.role
      })
    });

    const result = await response.json();

    if (!response.ok) {
      toast({ title: 'Fehler', description: result.error || 'Benutzer konnte nicht erstellt werden.', variant: 'destructive' });
      return;
    }

    toast({ title: 'Erfolg', description: 'Benutzer wurde erstellt.' });
    setIsDialogOpen(false);
    setNewUser({ email: '', password: '', first_name: '', last_name: '', role: 'employee' });
    fetchUsers();
  };

  const handleDeleteUser = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from('profiles').delete().eq('user_id', userId);
    
    if (error) {
      toast({ title: 'Fehler', description: 'Benutzer konnte nicht gelöscht werden.', variant: 'destructive' });
    } else {
      toast({ title: 'Erfolg', description: 'Benutzer wurde gelöscht.' });
      fetchUsers();
    }
  };

  // Show employee detail view if selected
  if (selectedEmployee) {
    return (
      <AdminEmployeeDetailView 
        employee={selectedEmployee} 
        onBack={() => setSelectedEmployee(null)} 
      />
    );
  }

  const employees = users.filter(u => u.role === 'employee');
  const admins = users.filter(u => u.role === 'admin');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Benutzerverwaltung</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Neuer Benutzer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Benutzer erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vorname *</Label>
                  <Input 
                    value={newUser.first_name} 
                    onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })} 
                    placeholder="Max" 
                    maxLength={100}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nachname *</Label>
                  <Input 
                    value={newUser.last_name} 
                    onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })} 
                    placeholder="Mustermann" 
                    maxLength={100}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>E-Mail *</Label>
                <Input 
                  type="email" 
                  value={newUser.email} 
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} 
                  placeholder="email@beispiel.de" 
                  maxLength={255}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Passwort * (mind. 8 Zeichen)</Label>
                <Input 
                  type="password" 
                  value={newUser.password} 
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} 
                  placeholder="Mindestens 8 Zeichen" 
                  maxLength={72}
                  minLength={8}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Rolle</Label>
                <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as AppRole })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Mitarbeiter</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateUser} className="w-full">Benutzer erstellen</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Employees Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Mitarbeiter ({employees.length})
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {employees.map((user) => (
            <Card 
              key={user.id} 
              className="glass-card cursor-pointer hover:shadow-glow transition-all border-2 hover:border-primary/50"
              onClick={() => setSelectedEmployee(user)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        {user.avatar_url ? (
                          <AvatarImage 
                            src={supabase.storage.from('avatars').getPublicUrl(user.avatar_url).data.publicUrl} 
                            alt={`${user.first_name} ${user.last_name}`} 
                          />
                        ) : null}
                        <AvatarFallback className="bg-blue-500/20 text-blue-700 dark:text-blue-400">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span 
                        className={`absolute -bottom-0.5 -left-0.5 h-3.5 w-3.5 rounded-full border-2 border-card ${statusColors[user.status || 'offline']}`}
                        title={statusLabels[user.status || 'offline']}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{user.first_name} {user.last_name}</CardTitle>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-400">
                    <Shield className="h-3 w-3 mr-1" />
                    Mitarbeiter
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary"
                      onClick={(e) => { e.stopPropagation(); setSelectedEmployee(user); }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => handleDeleteUser(user.user_id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Admins Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Administratoren ({admins.length})
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {admins.map((user) => (
            <Card key={user.id} className="glass-card">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      {user.avatar_url ? (
                        <AvatarImage 
                          src={supabase.storage.from('avatars').getPublicUrl(user.avatar_url).data.publicUrl} 
                          alt={`${user.first_name} ${user.last_name}`} 
                        />
                      ) : null}
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{user.first_name} {user.last_name}</CardTitle>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Badge className="bg-primary/20 text-primary">
                  <Shield className="h-3 w-3 mr-1" />
                  Administrator
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
