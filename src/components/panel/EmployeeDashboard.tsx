import { useState, createContext, useContext } from 'react';
import PanelLayout from './PanelLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmployeeTasksView from './employee/EmployeeTasksView';
import EmployeeTimeView from './employee/EmployeeTimeView';
import EmployeeDocumentsView from './employee/EmployeeDocumentsView';
import EmployeeVacationView from './employee/EmployeeVacationView';
import EmployeeProfileView from './employee/EmployeeProfileView';
import EmployeeChatView from './employee/EmployeeChatView';
import { ClipboardList, Clock, FileText, Calendar, User, MessageCircle } from 'lucide-react';

// Context to share tab navigation
export const TabContext = createContext<{ setActiveTab: (tab: string) => void } | null>(null);
export const useTabContext = () => useContext(TabContext);

export default function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState('tasks');

  const handleLogoClick = () => {
    setActiveTab('tasks');
  };

  return (
    <PanelLayout title="Mitarbeiter-Panel" onLogoClick={handleLogoClick}>
      <TabContext.Provider value={{ setActiveTab }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-flex h-auto p-1">
            <TabsTrigger value="tasks" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Aufträge</span>
            </TabsTrigger>
            <TabsTrigger value="time" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Zeit</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Dokumente</span>
            </TabsTrigger>
            <TabsTrigger value="vacation" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Urlaub</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profil</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-6">
            <EmployeeTasksView />
          </TabsContent>
          <TabsContent value="time" className="mt-6">
            <EmployeeTimeView />
          </TabsContent>
          <TabsContent value="documents" className="mt-6">
            <EmployeeDocumentsView />
          </TabsContent>
          <TabsContent value="vacation" className="mt-6">
            <EmployeeVacationView />
          </TabsContent>
          <TabsContent value="chat" className="mt-6">
            <EmployeeChatView />
          </TabsContent>
          <TabsContent value="profile" className="mt-6">
            <EmployeeProfileView />
          </TabsContent>
        </Tabs>
      </TabContext.Provider>
    </PanelLayout>
  );
}
