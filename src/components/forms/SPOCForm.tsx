import React, { useState } from 'react';
import {
  X,
  Save,
  Star,
} from 'lucide-react';
import type { ExternalSPOC, InternalSPOC } from '../../types';

// Form data types used locally by this component
type ExternalSPOCFormData = {
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation: string;
  department?: string;
  isPrimary: boolean;
  linkedinUrl?: string;
  notes?: string;
  isActive: boolean;
};

type InternalSPOCFormData = {
  userId: string;
  level: 'primary' | 'secondary';
  clientIds: string[];
  isActive: boolean;
};

interface SPOCFormProps {
  spoc?: ExternalSPOC | InternalSPOC;
  type: 'external' | 'internal';
  isOpen: boolean;
  onClose: () => void;
  onSave: (spocData: ExternalSPOCFormData | InternalSPOCFormData) => void;
}

const SPOCForm: React.FC<SPOCFormProps> = ({ spoc, type, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<ExternalSPOCFormData | InternalSPOCFormData>(() => {
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

  // Typed helpers to update state safely without using `any`
  const setExternal = (patch: Partial<ExternalSPOCFormData>) =>
    setFormData(prev => ({ ...(prev as ExternalSPOCFormData), ...patch }));

  const setInternal = (patch: Partial<InternalSPOCFormData>) =>
    setFormData(prev => ({ ...(prev as InternalSPOCFormData), ...patch }));

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
      setFormData(prev => {
        const p = prev as InternalSPOCFormData;
        const nextIds = checked
          ? [...(p.clientIds ?? []), clientId]
          : (p.clientIds ?? []).filter((id) => id !== clientId);
        return { ...p, clientIds: nextIds };
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
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

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {type === 'external' ? (
              // External SPOC Form
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client *
                  </label>
                  <select
                    required
                    value={(formData as ExternalSPOCFormData).clientId}
                    onChange={(e) => setExternal({ clientId: e.target.value })}
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
                      value={(formData as ExternalSPOCFormData).firstName}
                      onChange={(e) => setExternal({ firstName: e.target.value })}
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
                      value={(formData as ExternalSPOCFormData).lastName}
                      onChange={(e) => setExternal({ lastName: e.target.value })}
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
                      value={(formData as ExternalSPOCFormData).email}
                      onChange={(e) => setExternal({ email: e.target.value })}
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
                      value={(formData as ExternalSPOCFormData).phone ?? ''}
                      onChange={(e) => setExternal({ phone: e.target.value })}
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
                      value={(formData as ExternalSPOCFormData).designation}
                      onChange={(e) => setExternal({ designation: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="VP of Engineering"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <select
                      value={(formData as ExternalSPOCFormData).department ?? ''}
                      onChange={(e) => setExternal({ department: e.target.value })}
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
                    value={(formData as ExternalSPOCFormData).linkedinUrl ?? ''}
                    onChange={(e) => setExternal({ linkedinUrl: e.target.value })}
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
                    value={(formData as ExternalSPOCFormData).notes ?? ''}
                    onChange={(e) => setExternal({ notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes about this SPOC..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={(formData as ExternalSPOCFormData).isPrimary}
                      onChange={(e) => setExternal({ isPrimary: e.target.checked })}
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
                      checked={(formData as ExternalSPOCFormData).isActive}
                      onChange={(e) => setExternal({ isActive: e.target.checked })}
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
                    value={(formData as InternalSPOCFormData).userId}
                    onChange={(e) => setInternal({ userId: e.target.value })}
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
                    value={(formData as InternalSPOCFormData).level}
                    onChange={(e) => setInternal({ level: e.target.value as 'primary' | 'secondary' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="primary">Primary SPOC</option>
                    <option value="secondary">Secondary SPOC</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    {(formData as InternalSPOCFormData).level === 'primary' 
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
                            checked={((formData as InternalSPOCFormData).clientIds ?? []).includes(client.id)}
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
                      checked={(formData as InternalSPOCFormData).isActive}
                      onChange={(e) => setInternal({ isActive: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>

                {((formData as InternalSPOCFormData).clientIds ?? []).length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Assignment Summary</h4>
                    <div className="text-sm text-blue-800">
                      <p><strong>Level:</strong> {(formData as InternalSPOCFormData).level.charAt(0).toUpperCase() + (formData as InternalSPOCFormData).level.slice(1)} SPOC</p>
                      <p><strong>Clients:</strong> {((formData as InternalSPOCFormData).clientIds ?? []).length} assigned</p>
                      <div className="mt-2">
                        <strong>Client List:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {((formData as InternalSPOCFormData).clientIds ?? []).map((clientId) => {
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
              <span>{spoc ? 'Update' : 'Add'} SPOC</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SPOCForm;