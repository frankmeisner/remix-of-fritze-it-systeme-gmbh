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
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="tasks" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Aufträge</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Mitarbeiter</span>
          </TabsTrigger>
          <TabsTrigger value="sms" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">SMS-Codes</span>
          </TabsTrigger>
          <TabsTrigger value="vacation" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Anträge</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Statistik</span>
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
