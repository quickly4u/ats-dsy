import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import AuthProvider from './components/auth/AuthProvider';
import LoginForm from './components/auth/LoginForm';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/dashboard/Dashboard';
import JobsList from './components/jobs/JobsList';
import CandidatesList from './components/candidates/CandidatesList';
import ApplicationsList from './components/applications/ApplicationsList';
import InterviewsList from './components/interviews/InterviewsList';
import ReportsList from './components/reports/ReportsList';

const AppContent: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

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
    return <LoginForm />;
  }

  const renderMainContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
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
      case 'communications':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Communications</h1>
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-600">Communication hub coming soon...</p>
            </div>
          </div>
        );
      case 'team':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Team Management</h1>
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-600">Team management features coming soon...</p>
            </div>
          </div>
        );
      case 'company':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Company Settings</h1>
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-600">Company configuration coming soon...</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">System Settings</h1>
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-600">System settings coming soon...</p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  const getSectionTitle = () => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      jobs: 'Job Management',
      candidates: 'Talent Pool',
      applications: 'Applications',
      interviews: 'Interviews',
      reports: 'Reports & Analytics',
      communications: 'Communications',
      team: 'Team Management',
      company: 'Company Settings',
      settings: 'System Settings',
    };
    return titles[activeSection] || 'Dashboard';
  };

  const getSectionSubtitle = () => {
    const subtitles: Record<string, string> = {
      dashboard: 'Overview of your recruitment activities and key metrics',
      jobs: 'Create, manage, and track job openings',
      candidates: 'Build and manage your talent database',
      applications: 'Track candidates through your hiring pipeline',
      interviews: 'Schedule and manage interview processes',
      reports: 'Analyze recruitment performance and trends',
      communications: 'Manage candidate communications and templates',
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