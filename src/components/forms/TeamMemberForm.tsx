import React, { useEffect, useMemo, useState } from 'react';
import { 
  X, 
  Save, 
  User, 
  Building2,
  Upload,
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
}

interface TeamMemberFormProps {
  member?: any;
  editingMember?: any;
  roles?: Role[];
  members?: Array<{ id: string; firstName: string; lastName: string; role: string; status: string }>; 
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberData: any) => void;
}

const TeamMemberForm: React.FC<TeamMemberFormProps> = ({ member, editingMember, roles = [], members = [], isOpen, onClose, onSave }) => {
  const currentMember = editingMember || member;
  const [formData, setFormData] = useState({
    firstName: currentMember?.firstName || '',
    lastName: currentMember?.lastName || '',
    email: currentMember?.email || '',
    phone: currentMember?.phone || '',
    roleId: roles.find(r => r.name === currentMember?.role)?.id || roles[0]?.id || '',
    role: currentMember?.role || 'Recruiter',
    department: currentMember?.department || 'General',
    status: currentMember?.status || 'active',
    reportsTo: currentMember?.reportsTo || '',
    startDate: currentMember?.startDate ? 
      new Date(currentMember.startDate).toISOString().split('T')[0] : '',
    // permissions removed
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'role'>('basic');

  // Removed unused defaultRoles array - using roles prop instead

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

  // Role hierarchy for Reports To (strict, role-dependent)
  // Recruiter < ATL < TL < Manager < Head < Owner
  const roleHierarchy: Record<string, string[]> = {
    Owner: [],
    Head: ['Owner'],
    Manager: ['Head', 'Owner'],
    TL: ['Manager', 'Head', 'Owner'],
    ATL: ['TL', 'Manager', 'Head', 'Owner'],
    Recruiter: ['ATL', 'TL', 'Manager', 'Head', 'Owner'],
  };

  const selectedRoleName = useMemo(() => roles.find(r => r.id === formData.roleId)?.name || formData.role, [roles, formData.roleId, formData.role]);
  const allowedManagerRoles = roleHierarchy[selectedRoleName] || [];
  const availableManagers = useMemo(() => {
    if (!allowedManagerRoles.length) return [] as Array<{ id: string; firstName: string; lastName: string; role: string; status: string }>;
    const excludeId = editingMember?.id || member?.id;
    return members.filter(m => allowedManagerRoles.includes(m.role) && m.status === 'active' && m.id !== excludeId);
  }, [members, allowedManagerRoles, editingMember, member]);

  // Ensure a sensible default roleId for new invitations when roles load
  useEffect(() => {
    if (!currentMember && roles.length > 0) {
      setFormData(prev => {
        // If roleId already valid, keep it
        if (prev.roleId && roles.some(r => r.id === prev.roleId)) return prev;
        const recruiterRole = roles.find(r => r.name === 'Recruiter') || roles[0];
        const nextRoleId = recruiterRole?.id || prev.roleId;
        // Keep role name aligned as well
        const nextRoleName = recruiterRole?.name || prev.role;
        // Validate reportsTo for new role
        if (nextRoleId) {
          ensureValidReportsTo(nextRoleId);
        }
        return { ...prev, roleId: nextRoleId, role: nextRoleName };
      });
    }
  }, [roles, currentMember]);

  // If role changes and current reportsTo no longer valid, clear it
  const ensureValidReportsTo = (nextRoleId: string) => {
    const nextRoleName = roles.find(r => r.id === nextRoleId)?.name || formData.role;
    const nextAllowed = roleHierarchy[nextRoleName] || [];
    if (!nextAllowed.length) {
      setFormData(prev => ({ ...prev, reportsTo: '' }));
      return;
    }
    const nextManagers = members.filter(m => nextAllowed.includes(m.role) && m.status === 'active');
    if (!nextManagers.some(m => m.id === formData.reportsTo)) {
      setFormData(prev => ({ ...prev, reportsTo: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      roleId: formData.roleId,
      role: selectedRoleName,
      department: formData.department,
      status: formData.status,
      reportsTo: formData.reportsTo || undefined,
      startDate: formData.startDate,
    });
    onClose();
  };

  if (!isOpen) return null;

  const tabs: ReadonlyArray<{ id: 'basic' | 'role'; label: string; icon: any }> = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'role', label: 'Role & Department', icon: Building2 },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            {currentMember ? 'Edit Team Member' : 'Invite Team Member'}
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
                      value={formData.roleId}
                      onChange={(e) => {
                        const selectedRole = roles.find(r => r.id === e.target.value);
                        setFormData(prev => ({ 
                          ...prev, 
                          roleId: e.target.value,
                          role: selectedRole?.name || ''
                        }));
                        ensureValidReportsTo(e.target.value);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
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

                  {allowedManagerRoles.length > 0 && (
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
                        {availableManagers.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} ({user.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Role Description</h4>
                  <div className="text-sm text-blue-800">
                    {roles.find(r => r.id === formData.roleId)?.description || 'Role-specific permissions and responsibilities will be defined by the selected role.'}
                  </div>
                </div>
              </div>
            )}

            {/* Permissions Tab removed */}
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
              <span>{currentMember ? 'Update Member' : 'Send Invitation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamMemberForm;