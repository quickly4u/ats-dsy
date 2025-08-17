import React, { useState } from 'react';
import { 
  X, 
  Save, 
  User, 
  Shield,
  Building2,
  Upload,
  Plus,
  Trash2
} from 'lucide-react';

interface TeamMemberFormProps {
  member?: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberData: any) => void;
}

const TeamMemberForm: React.FC<TeamMemberFormProps> = ({ member, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: member?.firstName || '',
    lastName: member?.lastName || '',
    email: member?.email || '',
    phone: member?.phone || '',
    role: member?.role || 'recruiter',
    department: member?.department || 'Human Resources',
    status: member?.status || 'active',
    reportsTo: member?.reportsTo || '',
    startDate: member?.startDate ? 
      new Date(member.startDate).toISOString().split('T')[0] : '',
    permissions: member?.permissions || [],
    customPermissions: [] as string[]
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [newPermission, setNewPermission] = useState('');

  const roles = [
    { value: 'hr_manager', label: 'HR Manager' },
    { value: 'senior_recruiter', label: 'Senior Recruiter' },
    { value: 'recruiter', label: 'Recruiter' },
    { value: 'hiring_manager', label: 'Hiring Manager' },
    { value: 'interviewer', label: 'Interviewer' },
    { value: 'coordinator', label: 'Recruitment Coordinator' },
    { value: 'admin', label: 'Administrator' }
  ];

  const departments = [
    'Human Resources',
    'Engineering',
    'Marketing',
    'Sales',
    'Design',
    'Operations',
    'Finance',
    'Legal'
  ];

  const defaultPermissions = [
    { id: 'job_management', label: 'Job Management', description: 'Create, edit, and manage job postings' },
    { id: 'candidate_management', label: 'Candidate Management', description: 'View and manage candidate profiles' },
    { id: 'application_review', label: 'Application Review', description: 'Review and process applications' },
    { id: 'interview_scheduling', label: 'Interview Scheduling', description: 'Schedule and manage interviews' },
    { id: 'interview_participation', label: 'Interview Participation', description: 'Participate in interviews and provide feedback' },
    { id: 'reporting', label: 'Reporting', description: 'Access reports and analytics' },
    { id: 'user_management', label: 'User Management', description: 'Manage team members and permissions' },
    { id: 'client_management', label: 'Client Management', description: 'Manage client relationships' },
    { id: 'settings', label: 'Settings', description: 'Access system and company settings' }
  ];

  const mockUsers = [
    { id: '1', firstName: 'John', lastName: 'Doe', role: 'HR Manager' },
    { id: '2', firstName: 'Jane', lastName: 'Smith', role: 'Senior Recruiter' },
    { id: '3', firstName: 'Mike', lastName: 'Johnson', role: 'Hiring Manager' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      permissions: [...formData.permissions, ...formData.customPermissions]
    });
    onClose();
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p: string) => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const addCustomPermission = () => {
    if (newPermission.trim()) {
      setFormData(prev => ({
        ...prev,
        customPermissions: [...prev.customPermissions, newPermission.trim()]
      }));
      setNewPermission('');
    }
  };

  const removeCustomPermission = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customPermissions: prev.customPermissions.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'role', label: 'Role & Department', icon: Building2 },
    { id: 'permissions', label: 'Permissions', icon: Shield }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            {member ? 'Edit Team Member' : 'Invite Team Member'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="john.doe@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Picture
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <button
                        type="button"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Upload Photo
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      PNG, JPG up to 2MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Role & Department Tab */}
            {activeTab === 'role' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department *
                    </label>
                    <select
                      required
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reports To
                    </label>
                    <select
                      value={formData.reportsTo}
                      onChange={(e) => setFormData(prev => ({ ...prev, reportsTo: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Manager</option>
                      {mockUsers.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Role Description</h4>
                  <div className="text-sm text-blue-800">
                    {formData.role === 'hr_manager' && (
                      <p>Full oversight of recruitment processes, team management, and strategic planning.</p>
                    )}
                    {formData.role === 'senior_recruiter' && (
                      <p>Lead complex recruitment projects, mentor junior recruiters, and manage key client relationships.</p>
                    )}
                    {formData.role === 'recruiter' && (
                      <p>Source candidates, manage applications, and coordinate interviews for assigned positions.</p>
                    )}
                    {formData.role === 'hiring_manager' && (
                      <p>Make hiring decisions for department positions and participate in interview processes.</p>
                    )}
                    {formData.role === 'interviewer' && (
                      <p>Conduct interviews and provide feedback on candidates for relevant positions.</p>
                    )}
                    {formData.role === 'coordinator' && (
                      <p>Support recruitment operations, schedule interviews, and manage administrative tasks.</p>
                    )}
                    {formData.role === 'admin' && (
                      <p>System administration, user management, and technical configuration.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Permissions Tab */}
            {activeTab === 'permissions' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">System Permissions</h3>
                  <div className="space-y-3">
                    {defaultPermissions.map(permission => (
                      <div key={permission.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                        <input
                          type="checkbox"
                          id={permission.id}
                          checked={formData.permissions.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          className="mt-1 rounded border-gray-300"
                        />
                        <div className="flex-1">
                          <label htmlFor={permission.id} className="text-sm font-medium text-gray-900 cursor-pointer">
                            {permission.label}
                          </label>
                          <p className="text-sm text-gray-500 mt-1">{permission.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Permissions</h3>
                  <div className="flex space-x-2 mb-4">
                    <input
                      type="text"
                      value={newPermission}
                      onChange={(e) => setNewPermission(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomPermission())}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add custom permission"
                    />
                    <button
                      type="button"
                      onClick={addCustomPermission}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formData.customPermissions.map((permission, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-900">{permission}</span>
                        <button
                          type="button"
                          onClick={() => removeCustomPermission(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {formData.customPermissions.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                      <Shield className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">No custom permissions added</p>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Permission Summary</h4>
                  <p className="text-sm text-yellow-800">
                    This user will have {formData.permissions.length + formData.customPermissions.length} permissions.
                    Review carefully before saving.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Save size={16} />
              <span>{member ? 'Update Member' : 'Send Invitation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamMemberForm;