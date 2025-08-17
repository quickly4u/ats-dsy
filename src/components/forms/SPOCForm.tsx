import React, { useState } from 'react';
import { 
  X, 
  Save, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Linkedin,
  Star,
  Users,
  FileText
} from 'lucide-react';
import type { ExternalSPOC, InternalSPOC, Client, User as UserType } from '../../types';

interface SPOCFormProps {
  spoc?: ExternalSPOC | InternalSPOC;
  type: 'external' | 'internal';
  isOpen: boolean;
  onClose: () => void;
  onSave: (spocData: any) => void;
}

const SPOCForm: React.FC<SPOCFormProps> = ({ spoc, type, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState(() => {
    if (type === 'external' && spoc && 'clientId' in spoc) {
      return {
        clientId: spoc.clientId || '',
        firstName: spoc.firstName || '',
        lastName: spoc.lastName || '',
        email: spoc.email || '',
        phone: spoc.phone || '',
        designation: spoc.designation || '',
        department: spoc.department || '',
        isPrimary: spoc.isPrimary || false,
        linkedinUrl: spoc.linkedinUrl || '',
        notes: spoc.notes || '',
        isActive: spoc.isActive !== undefined ? spoc.isActive : true
      };
    } else if (type === 'internal' && spoc && 'userId' in spoc) {
      return {
        userId: spoc.userId || '',
        level: spoc.level || 'primary',
        clientIds: spoc.clientIds || [],
        isActive: spoc.isActive !== undefined ? spoc.isActive : true
      };
    } else {
      return type === 'external' ? {
        clientId: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        designation: '',
        department: '',
        isPrimary: false,
        linkedinUrl: '',
        notes: '',
        isActive: true
      } : {
        userId: '',
        level: 'primary',
        clientIds: [],
        isActive: true
      };
    }
  });

  // Mock data - in real app, these would come from API
  const mockClients = [
    { id: '1', name: 'TechCorp Solutions' },
    { id: '2', name: 'FinanceFirst' },
    { id: '3', name: 'HealthTech Innovations' }
  ];

  const mockUsers = [
    { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@company.com' },
    { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@company.com' },
    { id: '3', firstName: 'Mike', lastName: 'Johnson', email: 'mike@company.com' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleClientSelection = (clientId: string, checked: boolean) => {
    if (type === 'internal') {
      setFormData(prev => ({
        ...prev,
        clientIds: checked 
          ? [...prev.clientIds, clientId]
          : prev.clientIds.filter(id => id !== clientId)
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {spoc ? 'Edit' : 'Add'} {type === 'external' ? 'External' : 'Internal'} SPOC
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6">
            {type === 'external' ? (
              // External SPOC Form
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client *
                  </label>
                  <select
                    required
                    value={formData.clientId}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Client</option>
                    {mockClients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>

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
                      placeholder="john.doe@client.com"
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
                      Designation *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.designation}
                      onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="VP of Engineering"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Department</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Sales</option>
                      <option value="Operations">Operations</option>
                      <option value="Finance">Finance</option>
                      <option value="Legal">Legal</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn Profile
                  </label>
                  <input
                    type="url"
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://linkedin.com/in/johndoe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes about this SPOC..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isPrimary}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPrimary: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 flex items-center">
                      <Star size={16} className="mr-1 text-yellow-500" />
                      Primary SPOC for this client
                    </span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>
            ) : (
              // Internal SPOC Form
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Member *
                  </label>
                  <select
                    required
                    value={formData.userId}
                    onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Team Member</option>
                    {mockUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SPOC Level *
                  </label>
                  <select
                    required
                    value={formData.level}
                    onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="primary">Primary SPOC</option>
                    <option value="secondary">Secondary SPOC</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.level === 'primary' 
                      ? 'Primary contact responsible for client relationship management'
                      : 'Secondary contact providing backup support'
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned Clients *
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <div className="space-y-2">
                      {mockClients.map(client => (
                        <label key={client.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.clientIds.includes(client.id)}
                            onChange={(e) => handleClientSelection(client.id, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">{client.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Select the clients this internal SPOC will manage
                  </p>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>

                {formData.clientIds.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Assignment Summary</h4>
                    <div className="text-sm text-blue-800">
                      <p><strong>Level:</strong> {formData.level.charAt(0).toUpperCase() + formData.level.slice(1)} SPOC</p>
                      <p><strong>Clients:</strong> {formData.clientIds.length} assigned</p>
                      <div className="mt-2">
                        <strong>Client List:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {formData.clientIds.map(clientId => {
                            const client = mockClients.find(c => c.id === clientId);
                            return client ? <li key={clientId}>{client.name}</li> : null;
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
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
              <span>{spoc ? 'Update' : 'Add'} SPOC</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SPOCForm;