import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import AuthProvider from './components/auth/AuthProvider';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/dashboard/Dashboard';
import JobsList from './components/jobs/JobsList';
import CandidatesList from './components/candidates/CandidatesList';
import ApplicationsList from './components/applications/ApplicationsList';
import InterviewsList from './components/interviews/InterviewsList';
import ReportsList from './components/reports/ReportsList';
import TeamList from './components/team/TeamList';
import CompanySettings from './components/settings/CompanySettings';
import SystemSettings from './components/settings/SystemSettings';
import ClientsList from './components/clients/ClientsList';
import SPOCManagement from './components/clients/SPOCManagement';

const AppContent: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ATS Pro...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return authMode === 'login' ? (
      <LoginForm onSwitchToSignup={() => setAuthMode('signup')} />
    ) : (
      <SignupForm onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  const renderMainContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'clients':
        return <ClientsList />;
      case 'spocs':
        return <SPOCManagement />;
      case 'jobs':
        return <JobsList />;
      case 'candidates':
        return <CandidatesList />;
      case 'applications':
        return <ApplicationsList />;
      case 'interviews':
        return <InterviewsList />;
      case 'reports':
        return <ReportsList />;
      case 'team':
        return <TeamList />;
      case 'company':
        return <CompanySettings />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <Dashboard />;
    }
  };

  const getSectionTitle = () => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      clients: 'Client Management',
      spocs: 'SPOC Management',
      jobs: 'Job Management',
      candidates: 'Talent Pool',
      applications: 'Applications',
      interviews: 'Interviews',
      reports: 'Reports & Analytics',
      team: 'Team Management',
      company: 'Company Settings',
      settings: 'System Settings',
    };
    return titles[activeSection] || 'Dashboard';
  };

  const getSectionSubtitle = () => {
    const subtitles: Record<string, string> = {
      dashboard: 'Overview of your recruitment activities and key metrics',
      clients: 'Manage client relationships and external partnerships',
      spocs: 'Manage external and internal points of contact',
      jobs: 'Create, manage, and track job openings',
      candidates: 'Build and manage your talent database',
      applications: 'Track candidates through your hiring pipeline',
      interviews: 'Schedule and manage interview processes',
      reports: 'Analyze recruitment performance and trends',
      team: 'Manage users, roles, and permissions',
      company: 'Configure company settings and preferences',
      settings: 'System configuration and integrations',
    };
    return subtitles[activeSection];
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          title={getSectionTitle()}
          subtitle={getSectionSubtitle()}
          showSearch={['jobs', 'candidates', 'applications'].includes(activeSection)}
        />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;