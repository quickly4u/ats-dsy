import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useToast } from './hooks/useToast';
import AuthProvider from './components/auth/AuthProvider';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import AcceptInvitation from './components/auth/AcceptInvitation';
import LandingPage from './components/landing/LandingPage';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/dashboard/Dashboard';
import JobsList from './components/jobs/JobsList';
import CandidatesList from './components/candidates/CandidatesList';
import CandidateProfilePage from './components/candidates/CandidateProfilePage';
import ApplicationsList from './components/applications/ApplicationsList';
import ApplicationProfilePage from './components/applications/ApplicationProfilePage';
import InterviewsList from './components/interviews/InterviewsList';
import ReportsList from './components/reports/ReportsList';
import TeamList from './components/team/TeamList';
import CompanySettings from './components/settings/CompanySettings';
import SystemSettings from './components/settings/SystemSettings';
import ClientsList from './components/clients/ClientsList';
import ClientProfilePage from './components/clients/ClientProfilePage';
import SPOCManagement from './components/clients/SPOCManagement';
import JobProfilePage from './components/jobs/JobProfilePage';
import ErrorBoundary from './components/common/ErrorBoundary';
import ToastContainer from './components/common/ToastContainer';

const AppContent: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const { toasts, removeToast } = useToast();
  const location = useLocation();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

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

  // Allow accept-invitation route for both authenticated and unauthenticated users
  if (location.pathname === '/accept-invitation') {
    return (
      <Routes>
        <Route path="/accept-invitation" element={<AcceptInvitation />} />
      </Routes>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route 
          path="/" 
          element={
            showLogin ? (
              <LoginForm onSwitchToSignup={() => { setShowLogin(false); setShowSignup(true); }} />
            ) : showSignup ? (
              <SignupForm onSwitchToLogin={() => { setShowSignup(false); setShowLogin(true); }} />
            ) : (
              <LandingPage 
                onLogin={() => setShowLogin(true)} 
                onSignup={() => setShowSignup(true)} 
              />
            )
          } 
        />
        <Route 
          path="/login" 
          element={<LoginForm onSwitchToSignup={() => { setShowLogin(false); setShowSignup(true); }} />} 
        />
        <Route 
          path="/signup" 
          element={<SignupForm onSwitchToLogin={() => { setShowSignup(false); setShowLogin(true); }} />} 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  const getActiveSection = () => {
    const path = location.pathname;
    // Use the first path segment for active section to support nested routes like /candidates/:id
    const first = path.split('/')[1] || 'dashboard';
    if (first === '' || first === 'dashboard') return 'dashboard';
    return first;
  };

  const getSectionTitle = () => {
    const activeSection = getActiveSection();
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
    const activeSection = getActiveSection();
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
    <ErrorBoundary>
      <div className="h-screen flex bg-gray-50">
        {/* Sidebar */}
        <Sidebar 
          activeSection={getActiveSection()} 
        />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header 
            title={getSectionTitle()}
            subtitle={getSectionSubtitle()}
            showSearch={false}
          />
          
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clients" element={<ClientsList />} />
              <Route path="/clients/:id" element={<ClientProfilePage />} />
              <Route path="/spocs" element={<SPOCManagement />} />
              <Route path="/jobs" element={<JobsList />} />
              <Route path="/jobs/:id" element={<JobProfilePage />} />
              <Route path="/candidates" element={<CandidatesList />} />
              <Route path="/candidates/:id" element={<CandidateProfilePage />} />
              <Route path="/applications" element={<ApplicationsList />} />
              <Route path="/applications/:id" element={<ApplicationProfilePage />} />
              <Route path="/interviews" element={<InterviewsList />} />
              <Route path="/reports" element={<ReportsList />} />
              <Route path="/team" element={<TeamList />} />
              <Route path="/company" element={<CompanySettings />} />
              <Route path="/settings" element={<SystemSettings />} />
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
              <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
        
        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      </div>
    </ErrorBoundary>
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