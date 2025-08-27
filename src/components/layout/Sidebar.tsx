import React from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Calendar, 
  FileText, 
  BarChart3, 
  Settings, 
  Bell,
  Building,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  activeSection: string;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'clients', label: 'Clients', icon: Building, path: '/clients' },
  { id: 'spocs', label: 'SPOCs', icon: UserCheck, path: '/spocs' },
  { id: 'jobs', label: 'Jobs', icon: Briefcase, path: '/jobs' },
  { id: 'candidates', label: 'Candidates', icon: Users, path: '/candidates' },
  { id: 'applications', label: 'Applications', icon: FileText, path: '/applications' },
  { id: 'interviews', label: 'Interviews', icon: Calendar, path: '/interviews' },
  { id: 'reports', label: 'Reports', icon: BarChart3, path: '/reports' },
  { id: 'team', label: 'Team', icon: Users, path: '/team' },
];

const adminItems = [
  { id: 'company', label: 'Company', icon: Building, path: '/company' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

const Sidebar: React.FC<SidebarProps> = ({ activeSection }) => {
  const { user } = useAuth();

  const isAdmin = user?.roles.some(role => 
    ['company_admin', 'hr_manager'].includes(role.name.toLowerCase().replace(' ', '_'))
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* Company Logo/Branding */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">ATS Pro</h2>
            <p className="text-sm text-gray-500">{user?.company.name}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-150 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon 
                size={20} 
                className={isActive ? 'text-blue-600' : 'text-gray-400'} 
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin Section */}
      {isAdmin && (
        <div className="px-4 py-4 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Administration
          </h3>
          <div className="space-y-1">
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-150 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon 
                    size={18} 
                    className={isActive ? 'text-blue-600' : 'text-gray-400'} 
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <img
            src={user?.avatar}
            alt={`${user?.firstName} ${user?.lastName}`}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.roles[0]?.name || 'User'}
            </p>
          </div>
          <button className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
            <Bell size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;