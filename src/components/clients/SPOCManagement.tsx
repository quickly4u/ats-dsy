import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  User,
  UserCheck,
  Edit,
  Trash2,
  CheckCircle,
  Star,
} from 'lucide-react';
import SPOCForm from '../forms/SPOCForm';
import { useClients } from '../../hooks/useRecruitmentData';
import { useContacts } from '../../hooks/useContacts';
import { supabase, getCurrentUserCompanyId } from '../../lib/supabase';

interface SPOCManagementProps {
  initialTab?: 'external' | 'internal';
  initialClientId?: string;
}

type TeamMemberOption = { id: string; firstName: string; lastName: string; email: string };

const SPOCManagement: React.FC<SPOCManagementProps> = ({ initialTab = 'external', initialClientId }) => {
  const [activeTab, setActiveTab] = useState<'external' | 'internal'>(initialTab);
  const { clients: allClients, isLoading: clientsLoading } = useClients();
  const clientsOptions = useMemo(() => (allClients || []).map((c: any) => ({ id: c.id, name: c.name })), [allClients]);
  const { externalContacts, internalContacts, stats, isLoading, error, createContact } = useContacts();
  const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>(initialClientId || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [showSPOCForm, setShowSPOCForm] = useState(false);
  const [spocFormType, setSPOCFormType] = useState<'external' | 'internal'>('external');

  // Fetch team members for internal SPOC assignment
  useEffect(() => {
    const load = async () => {
      try {
        setTeamLoading(true);
        const companyId = await getCurrentUserCompanyId();
        if (!companyId) return;

        const { data: users, error } = await supabase
          .from('users')
          .select('id, email, first_name, last_name')
          .eq('company_id', companyId);

        if (error) throw error;

        setTeamMembers(
          (users || []).map(u => ({
            id: u.id,
            firstName: u.first_name || 'Unknown',
            lastName: u.last_name || 'User',
            email: u.email,
          }))
        );
      } catch (err) {
        console.error('Failed to load team members', err);
        setTeamMembers([]);
      } finally {
        setTeamLoading(false);
      }
    };
    load();
  }, []);

  const filteredExternalSPOCs = externalContacts.filter(contact => {
    const matchesSearch = searchQuery === '' || 
      `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.designation || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesClient = selectedClient === 'all' || contact.clientId === selectedClient;
    
    return matchesSearch && matchesClient;
  });

  const filteredInternalSPOCs = internalContacts.filter(contact => {
    const matchesSearch = searchQuery === '' || 
      `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const handleSaveSPOC = async (spocData: any) => {
    try {
      if (spocFormType === 'external') {
        await createContact({
          contactType: 'external',
          clientId: spocData.clientId,
          firstName: spocData.firstName,
          lastName: spocData.lastName,
          email: spocData.email,
          phone: spocData.phone,
          designation: spocData.designation,
          department: spocData.department,
          isPrimary: !!spocData.isPrimary,
          linkedinUrl: spocData.linkedinUrl,
          notes: spocData.notes,
          isActive: !!spocData.isActive,
        });
      } else {
        await createContact({
          contactType: 'internal',
          userId: spocData.userId,
          firstName: spocData.firstName || 'Internal',
          lastName: spocData.lastName || 'SPOC',
          email: spocData.email || 'internal@company.com',
          spocLevel: spocData.level,
          assignedClientIds: spocData.clientIds || [],
          isActive: !!spocData.isActive,
        });
      }
      setShowSPOCForm(false);
    } catch (err: any) {
      console.error('Failed to save SPOC:', err);
    }
  };

  const renderExternalSPOCs = () => (
    <div className="space-y-4">
      {filteredExternalSPOCs.map((contact) => (
        <div key={contact.id} className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 p-6">
          <div className="flex items-start space-x-4">
            <img
              src={contact.avatar || `https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2`}
              alt={`${contact.firstName} ${contact.lastName}`}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {contact.firstName} {contact.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{contact.designation}</p>
                  <p className="text-sm text-gray-500">{contact.client?.name}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      contact.isPrimary 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {contact.isPrimary ? 'Primary' : 'Secondary'}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      contact.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {contact.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-gray-400 hover:text-gray-600">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 mt-4">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{contact.email}</span>
                </div>
                {contact.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{contact.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderInternalSPOCs = () => (
    <div className="space-y-4">
      {filteredInternalSPOCs.map((contact) => (
        <div key={contact.id} className="bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200 p-6">
          <div className="flex items-start space-x-4">
            <img
              src={contact.avatar || contact.user?.avatar || `https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2`}
              alt={`${contact.firstName} ${contact.lastName}`}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {contact.firstName} {contact.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{contact.email}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      contact.spocLevel === 'primary' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {contact.spocLevel || 'secondary'} SPOC
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      contact.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {contact.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-gray-400 hover:text-gray-600">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned Clients:</h4>
                <div className="flex flex-wrap gap-2">
                  {contact.assignedClients?.map((client: any) => (
                    <span key={client.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {client.name}
                    </span>
                  ))}
                  {(!contact.assignedClients || contact.assignedClients.length === 0) && (
                    <span className="text-sm text-gray-500">No clients assigned</span>
                  )}
                </div>
              </div>
              
              <div className="mt-3 text-xs text-gray-500">
                Created: {contact.createdAt.toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SPOC Management</h1>
          <p className="text-gray-600 mt-1">
            Manage external and internal points of contact
          </p>
        </div>
        <button 
          onClick={() => {
            setSPOCFormType('external');
            setShowSPOCForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus size={20} />
          <span>Add SPOC</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">External SPOCs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.external}</p>
            </div>
            <User className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Internal SPOCs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.internal}</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Primary SPOCs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.primary}</p>
            </div>
            <Star className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active SPOCs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search SPOCs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('external')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'external'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            External SPOCs ({stats.external})
          </button>
          <button
            onClick={() => setActiveTab('internal')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'internal'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Internal SPOCs ({stats.internal})
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && activeTab === 'external' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client
                </label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Clients</option>
                  {clientsOptions.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SPOC Lists */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}
      {(clientsLoading || isLoading || teamLoading) && (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      )}
      {!(clientsLoading || isLoading || teamLoading) && (
        activeTab === 'external' ? renderExternalSPOCs() : renderInternalSPOCs()
      )}

      {/* Empty State */}
      {!(clientsLoading || isLoading || teamLoading) && ((activeTab === 'external' && filteredExternalSPOCs.length === 0) ||
        (activeTab === 'internal' && filteredInternalSPOCs.length === 0)) && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No SPOCs found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {/* SPOC Form Modal */}
      {showSPOCForm && (
        <SPOCForm
          type={spocFormType}
          isOpen={showSPOCForm}
          onClose={() => setShowSPOCForm(false)}
          onSave={handleSaveSPOC}
          clients={clientsOptions}
          teamMembers={teamMembers}
        />
      )}
    </div>
  );
};

export default SPOCManagement;
