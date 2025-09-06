import React, { useState } from 'react';
import { 
  Building, 
  Save, 
  Users,
  Shield,
  Bell,
  Palette,
  Database,
  GitBranch
} from 'lucide-react';
import StageManagement from './StageManagement';
import { getCurrentUserCompanyId } from '../../lib/supabase';

interface CompanySettings {
  general: {
    name: string;
    slug: string;
    website: string;
    industry: string;
    size: string;
    description: string;
    logo: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    contact: {
      email: string;
      phone: string;
    };
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    favicon: string;
  };
  recruitment: {
    defaultJobExpiry: number;
    requireApproval: boolean;
    allowPublicApplications: boolean;
    enableReferrals: boolean;
    autoRejectAfterDays: number;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    slackIntegration: boolean;
    webhookUrl: string;
  };
  privacy: {
    gdprCompliance: boolean;
    dataRetentionDays: number;
    allowCookies: boolean;
    privacyPolicyUrl: string;
  };
}

const CompanySettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [companyId, setCompanyId] = useState<string>('');
  const [settings, setSettings] = useState<CompanySettings>({
    general: {
      name: 'TechCorp Inc.',
      slug: 'techcorp',
      website: 'https://techcorp.com',
      industry: 'Technology',
      size: '51-200',
      description: 'Leading technology company focused on innovative solutions.',
      logo: '',
      address: {
        street: '123 Tech Street',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'United States'
      },
      contact: {
        email: 'contact@techcorp.com',
        phone: '+1 (555) 123-4567'
      }
    },
    branding: {
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      logoUrl: '',
      favicon: ''
    },
    recruitment: {
      defaultJobExpiry: 30,
      requireApproval: true,
      allowPublicApplications: true,
      enableReferrals: true,
      autoRejectAfterDays: 90
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      slackIntegration: false,
      webhookUrl: ''
    },
    privacy: {
      gdprCompliance: true,
      dataRetentionDays: 365,
      allowCookies: true,
      privacyPolicyUrl: 'https://techcorp.com/privacy'
    }
  });

  React.useEffect(() => {
    const fetchCompanyId = async () => {
      const id = await getCurrentUserCompanyId();
      if (id) setCompanyId(id);
    };
    fetchCompanyId();
  }, []);

  const tabs = [
    { id: 'general', label: 'General', icon: Building },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'recruitment', label: 'Recruitment', icon: Users },
    { id: 'stages', label: 'Pipeline Stages', icon: GitBranch },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'integrations', label: 'Integrations', icon: Database }
  ];

  const handleSave = () => {
    // Save settings logic here
    console.log('Saving settings:', settings);
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={settings.general.name}
              onChange={(e) => setSettings({
                ...settings,
                general: { ...settings.general, name: e.target.value }
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Slug
            </label>
            <input
              type="text"
              value={settings.general.slug}
              onChange={(e) => setSettings({
                ...settings,
                general: { ...settings.general, slug: e.target.value }
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              value={settings.general.website}
              onChange={(e) => setSettings({
                ...settings,
                general: { ...settings.general, website: e.target.value }
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            <select
              value={settings.general.industry}
              onChange={(e) => setSettings({
                ...settings,
                general: { ...settings.general, industry: e.target.value }
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Education">Education</option>
              <option value="Retail">Retail</option>
              <option value="Manufacturing">Manufacturing</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Size
            </label>
            <select
              value={settings.general.size}
              onChange={(e) => setSettings({
                ...settings,
                general: { ...settings.general, size: e.target.value }
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-500">201-500 employees</option>
              <option value="501-1000">501-1000 employees</option>
              <option value="1000+">1000+ employees</option>
            </select>
          </div>
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={settings.general.description}
            onChange={(e) => setSettings({
              ...settings,
              general: { ...settings.general, description: e.target.value }
            })}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={settings.general.contact.email}
              onChange={(e) => setSettings({
                ...settings,
                general: { 
                  ...settings.general, 
                  contact: { ...settings.general.contact, email: e.target.value }
                }
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={settings.general.contact.phone}
              onChange={(e) => setSettings({
                ...settings,
                general: { 
                  ...settings.general, 
                  contact: { ...settings.general.contact, phone: e.target.value }
                }
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
            </label>
            <input
              type="text"
              value={settings.general.address.street}
              onChange={(e) => setSettings({
                ...settings,
                general: { 
                  ...settings.general, 
                  address: { ...settings.general.address, street: e.target.value }
                }
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              value={settings.general.address.city}
              onChange={(e) => setSettings({
                ...settings,
                general: { 
                  ...settings.general, 
                  address: { ...settings.general.address, city: e.target.value }
                }
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State/Province
            </label>
            <input
              type="text"
              value={settings.general.address.state}
              onChange={(e) => setSettings({
                ...settings,
                general: { 
                  ...settings.general, 
                  address: { ...settings.general.address, state: e.target.value }
                }
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ZIP/Postal Code
            </label>
            <input
              type="text"
              value={settings.general.address.zipCode}
              onChange={(e) => setSettings({
                ...settings,
                general: { 
                  ...settings.general, 
                  address: { ...settings.general.address, zipCode: e.target.value }
                }
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              value={settings.general.address.country}
              onChange={(e) => setSettings({
                ...settings,
                general: { 
                  ...settings.general, 
                  address: { ...settings.general.address, country: e.target.value }
                }
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="United States">United States</option>
              <option value="Canada">Canada</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Germany">Germany</option>
              <option value="France">France</option>
              <option value="Australia">Australia</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRecruitmentSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Job Posting Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Job Expiry (days)
            </label>
            <input
              type="number"
              value={settings.recruitment.defaultJobExpiry}
              onChange={(e) => setSettings({
                ...settings,
                recruitment: { ...settings.recruitment, defaultJobExpiry: parseInt(e.target.value) }
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auto-reject after (days)
            </label>
            <input
              type="number"
              value={settings.recruitment.autoRejectAfterDays}
              onChange={(e) => setSettings({
                ...settings,
                recruitment: { ...settings.recruitment, autoRejectAfterDays: parseInt(e.target.value) }
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Application Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Require Job Approval</h4>
              <p className="text-sm text-gray-500">Jobs must be approved before publishing</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.recruitment.requireApproval}
                onChange={(e) => setSettings({
                  ...settings,
                  recruitment: { ...settings.recruitment, requireApproval: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Allow Public Applications</h4>
              <p className="text-sm text-gray-500">Enable public job board and career page</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.recruitment.allowPublicApplications}
                onChange={(e) => setSettings({
                  ...settings,
                  recruitment: { ...settings.recruitment, allowPublicApplications: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Enable Employee Referrals</h4>
              <p className="text-sm text-gray-500">Allow employees to refer candidates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.recruitment.enableReferrals}
                onChange={(e) => setSettings({
                  ...settings,
                  recruitment: { ...settings.recruitment, enableReferrals: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentTab = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'recruitment':
        return renderRecruitmentSettings();
      case 'stages':
        return companyId ? (
          <StageManagement companyId={companyId} />
        ) : (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-sm text-gray-600">Loading company context...</p>
          </div>
        );
      case 'branding':
        return (
          <div className="text-center py-12">
            <Palette className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Branding Settings</h3>
            <p className="mt-1 text-sm text-gray-500">
              Customize your company's visual identity and branding.
            </p>
          </div>
        );
      case 'notifications':
        return (
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Notification Settings</h3>
            <p className="mt-1 text-sm text-gray-500">
              Configure email, SMS, and integration notifications.
            </p>
          </div>
        );
      case 'privacy':
        return (
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Privacy & Security</h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage GDPR compliance, data retention, and security settings.
            </p>
          </div>
        );
      case 'integrations':
        return (
          <div className="text-center py-12">
            <Database className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Integrations</h3>
            <p className="mt-1 text-sm text-gray-500">
              Connect with job boards, HRIS systems, and other tools.
            </p>
          </div>
        );
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure your company profile and recruitment settings
          </p>
        </div>
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Save size={20} />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* Horizontal Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <nav className="flex items-center gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-full whitespace-nowrap transition-colors border ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'text-gray-700 border-transparent hover:bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-white' : 'text-gray-400'} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {renderCurrentTab()}
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;