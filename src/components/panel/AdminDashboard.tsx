import { useState } from 'react';
import PanelLayout from './PanelLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminTasksView from './admin/AdminTasksView';
import AdminUsersView from './admin/AdminUsersView';
import AdminSmsView from './admin/AdminSmsView';
import AdminVacationView from './admin/AdminVacationView';
import AdminStatsView from './admin/AdminStatsView';
import { ClipboardList, Users, MessageSquare, Calendar, BarChart3 } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('tasks');

  const handleLogoClick = () => {
    setActiveTab('tasks');
  };

  return (
    <PanelLayout title="Admin-Panel" onLogoClick={handleLogoClick}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="glass-panel grid w-full grid-cols-5 lg:w-auto lg:inline-flex p-1.5 gap-1">
          <TabsTrigger value="tasks" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Aufträge</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Mitarbeiter</span>
          </TabsTrigger>
          <TabsTrigger value="sms" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">SMS-Codes</span>
          </TabsTrigger>
          <TabsTrigger value="vacation" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Anträge</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Statistik</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <AdminTasksView />
        </TabsContent>
        <TabsContent value="users">
          <AdminUsersView />
        </TabsContent>
        <TabsContent value="sms">
          <AdminSmsView />
        </TabsContent>
        <TabsContent value="vacation">
          <AdminVacationView />
        </TabsContent>
        <TabsContent value="stats">
          <AdminStatsView />
        </TabsContent>
      </Tabs>
    </PanelLayout>
  );
}
