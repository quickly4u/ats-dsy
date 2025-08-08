import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  Database, 
  Mail, 
  Shield, 
  Globe, 
  Zap,
  Monitor,
  HardDrive,
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface SystemMetrics {
  uptime: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeUsers: number;
  totalRequests: number;
  errorRate: number;
}

const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics] = useState<SystemMetrics>({
    uptime: '15 days, 4 hours',
    cpuUsage: 45,
    memoryUsage: 62,
    diskUsage: 78,
    activeUsers: 1247,
    totalRequests: 89432,
    errorRate: 0.02
  });

  const tabs = [
    { id: 'overview', label: 'System Overview', icon: Monitor },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'email', label: 'Email Configuration', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API Settings', icon: Globe },
    { id: 'performance', label: 'Performance', icon: Zap }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* System Status */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">System Health</p>
                <p className="text-2xl font-bold text-green-900">Healthy</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Uptime</p>
                <p className="text-2xl font-bold text-blue-900">{metrics.uptime}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Active Users</p>
                <p className="text-2xl font-bold text-purple-900">{metrics.activeUsers.toLocaleString()}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Resource Usage */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Resource Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">CPU Usage</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{metrics.cpuUsage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${metrics.cpuUsage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Monitor className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Memory Usage</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{metrics.memoryUsage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${metrics.memoryUsage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Disk Usage</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{metrics.diskUsage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full" 
                style={{ width: `${metrics.diskUsage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent System Events</h3>
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="divide-y divide-gray-200">
            {[
              { type: 'info', message: 'Database backup completed successfully', time: '2 minutes ago' },
              { type: 'warning', message: 'High memory usage detected (85%)', time: '15 minutes ago' },
              { type: 'success', message: 'System update deployed', time: '1 hour ago' },
              { type: 'info', message: 'New user registration: john@example.com', time: '2 hours ago' },
              { type: 'error', message: 'Failed login attempt from IP 192.168.1.100', time: '3 hours ago' }
            ].map((event, index) => (
              <div key={index} className="p-4 flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  event.type === 'success' ? 'bg-green-500' :
                  event.type === 'warning' ? 'bg-yellow-500' :
                  event.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{event.message}</p>
                  <p className="text-xs text-gray-500">{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDatabaseSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Database Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Connection Pool Size
            </label>
            <input
              type="number"
              defaultValue="20"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Query Timeout (seconds)
            </label>
            <input
              type="number"
              defaultValue="30"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Backup Frequency
            </label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retention Period (days)
            </label>
            <input
              type="number"
              defaultValue="30"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Database Status</h3>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">99.9%</p>
              <p className="text-sm text-gray-600">Uptime</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">1.2ms</p>
              <p className="text-sm text-gray-600">Avg Query Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">45GB</p>
              <p className="text-sm text-gray-600">Database Size</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentTab = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'database':
        return renderDatabaseSettings();
      case 'email':
        return (
          <div className="text-center py-12">
            <Mail className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Email Configuration</h3>
            <p className="mt-1 text-sm text-gray-500">
              Configure SMTP settings and email templates.
            </p>
          </div>
        );
      case 'security':
        return (
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Security Settings</h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage authentication, encryption, and security policies.
            </p>
          </div>
        );
      case 'api':
        return (
          <div className="text-center py-12">
            <Globe className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">API Settings</h3>
            <p className="mt-1 text-sm text-gray-500">
              Configure API rate limits, authentication, and webhooks.
            </p>
          </div>
        );
      case 'performance':
        return (
          <div className="text-center py-12">
            <Zap className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Performance Settings</h3>
            <p className="mt-1 text-sm text-gray-500">
              Optimize caching, CDN, and performance configurations.
            </p>
          </div>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">
            Monitor and configure system-wide settings
          </p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Save size={20} />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} className={activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {renderCurrentTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;