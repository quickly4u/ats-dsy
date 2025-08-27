import React, { useEffect, useMemo, useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Mail,
  Phone,
  Building2,
  User,
  UserCheck,
  MoreVertical,
  Edit,
  Trash2,
  MessageSquare,
  Linkedin,
  CheckCircle,
  Star,
} from 'lucide-react';
import SPOCForm from '../forms/SPOCForm';
import { useClients } from '../../hooks/useRecruitmentData';
import { useExternalSpocs, useInternalSpocs } from '../../hooks/useSpocs';
import { supabase, getCurrentUserCompanyId } from '../../lib/supabase';

interface SPOCManagementProps {
  initialTab?: 'external' | 'internal';
  initialClientId?: string;
}

// Local type for team members list in the form
type TeamMemberOption = { id: string; firstName: string; lastName: string; email: string };

const SPOCManagement: React.FC<SPOCManagementProps> = ({ initialTab = 'external', initialClientId }) => {
  const [activeTab, setActiveTab] = useState<'external' | 'internal'>(initialTab);
  const { clients: allClients, isLoading: clientsLoading } = useClients();
  const clientsOptions = useMemo(() => (allClients || []).map((c: any) => ({ id: c.id, name: c.name })), [allClients]);
  const { externalSpocs, isLoading: externalLoading, error: externalError, createExternal } = useExternalSpocs();
  const { internalSpocs, isLoading: internalLoading, error: internalError, createInternal } = useInternalSpocs();
  const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>(initialClientId || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [showSPOCForm, setShowSPOCForm] = useState(false);
  const [spocFormType, setSPOCFormType] = useState<'external' | 'internal'>('external');

  // Fetch team members (users table) for internal SPOC assignment - only from current company
  useEffect(() => {
    const load = async () => {
      try {
        setTeamLoading(true);
        const companyId = await getCurrentUserCompanyId();
        if (!companyId) {
          throw new Error('User company not found');
        }
        
        const { data, error } = await supabase
          .from('users')
          .select('id, email, first_name, last_name, is_active')
          .eq('company_id', companyId)
          .eq('is_active', true)
          .order('first_name');
        if (error) throw error;
        setTeamMembers((data || []).map((u: any) => ({
          id: u.id,
          firstName: u.first_name || '',
          lastName: u.last_name || '',
          email: u.email || '',
        })));
      } catch (err) {
        console.error('Failed to load team members', err);
        setTeamMembers([]);
      } finally {
        setTeamLoading(false);
      }
    };
    load();
  }, []);

  const filteredExternalSPOCs = (externalSpocs || []).filter(spoc => {
    const matchesSearch = searchQuery === '' || 
      `${spoc.firstName} ${spoc.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spoc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spoc.designation.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesClient = selectedClient === 'all' || spoc.clientId === selectedClient;
    
    return matchesSearch && matchesClient;
  });

  const filteredInternalSPOCs = (internalSpocs || []).filter(spoc => {
    const matchesSearch = searchQuery === '' || 
      `${spoc.user.firstName} ${spoc.user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spoc.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const handleSaveSPOC = async (spocData: any) => {
    try {
      if (spocFormType === 'external') {
        await createExternal({
          clientId: spocData.clientId,
          firstName: spocData.firstName,
          lastName: spocData.lastName,
          email: spocData.email,
          phone: spocData.phone || undefined,
          designation: spocData.designation,
          department: spocData.department || undefined,
          isPrimary: !!spocData.isPrimary,
          linkedinUrl: spocData.linkedinUrl || undefined,
          notes: spocData.notes || undefined,
          isActive: !!spocData.isActive,
        });
      } else {
        await createInternal({
          userId: spocData.userId,
          level: spocData.level,
          clientIds: spocData.clientIds || [],
          isActive: !!spocData.isActive,
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save SPOC');
    }
  };

  const renderExternalSPOCs = () => (
    <div className="space-y-4">
      {filteredExternalSPOCs.map((spoc) => (
        <div key={spoc.id} className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 p-6">
          <div className="flex items-start space-x-4">
            <img
              src={spoc.avatar || `https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2`}
              alt={`${spoc.firstName} ${spoc.lastName}`}
              className="w-12 h-12 rounded-full object-cover"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {spoc.firstName} {spoc.lastName}
                    </h3>
                    {spoc.isPrimary && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full flex items-center">
                        <Star size={12} className="mr-1" />
                        Primary
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      spoc.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {spoc.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{spoc.designation}</p>
                  <p className="text-sm text-gray-500">{spoc.client.name}</p>
                </div>
                
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                  <MoreVertical size={16} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail size={16} className="mr-2 text-gray-400" />
                    <span>{spoc.email}</span>
                  </div>
                  
                  {spoc.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone size={16} className="mr-2 text-gray-400" />
                      <span>{spoc.phone}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Building2 size={16} className="mr-2 text-gray-400" />
                    <span>{spoc.department}</span>
                  </div>
                  
                  {spoc.linkedinUrl && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Linkedin size={16} className="mr-2 text-gray-400" />
                      <a href={spoc.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              {spoc.notes && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <strong>Notes:</strong> {spoc.notes}
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Added {new Intl.DateTimeFormat('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  }).format(spoc.createdAt)}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <MessageSquare size={16} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <Edit size={16} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderInternalSPOCs = () => (
    <div className="space-y-4">
      {filteredInternalSPOCs.map((spoc) => (
        <div key={spoc.id} className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 p-6">
          <div className="flex items-start space-x-4">
            <img
              src={spoc.user.avatar || `https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2`}
              alt={`${spoc.user.firstName} ${spoc.user.lastName}`}
              className="w-12 h-12 rounded-full object-cover"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {spoc.user.firstName} {spoc.user.lastName}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      spoc.level === 'primary' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {spoc.level === 'primary' ? 'Primary SPOC' : 'Secondary SPOC'}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      spoc.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {spoc.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{spoc.user.roles[0]?.name}</p>
                  <p className="text-sm text-gray-500">{spoc.user.email}</p>
                </div>
                
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                  <MoreVertical size={16} />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Assigned Clients:</p>
                <div className="flex flex-wrap gap-2">
                  {spoc.clients.map((client) => (
                    <span key={client.id} className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                      {client.name}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Assigned {new Intl.DateTimeFormat('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  }).format(spoc.assignedAt)}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <MessageSquare size={16} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <Edit size={16} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
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
              <p className="text-2xl font-bold text-gray-900">{externalSpocs.length}</p>
            </div>
            <User className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Internal SPOCs</p>
              <p className="text-2xl font-bold text-gray-900">{internalSpocs.length}</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Primary SPOCs</p>
              <p className="text-2xl font-bold text-gray-900">
                {externalSpocs.filter(s => s.isPrimary).length}
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active SPOCs</p>
              <p className="text-2xl font-bold text-gray-900">
                {[...externalSpocs, ...internalSpocs].filter(s => s.isActive).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search 
              size={20} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            />
            <input
              type="text"
              placeholder="Search SPOCs by name, email, or designation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <Filter size={20} />
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
            External SPOCs ({externalSpocs.length})
          </button>
          <button
            onClick={() => setActiveTab('internal')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'internal'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Internal SPOCs ({internalSpocs.length})
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Clients</option>
                  {clientsOptions.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Types</option>
                  <option>Primary</option>
                  <option>Secondary</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SPOC Lists */}
      {(externalError || internalError) && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {externalError || internalError}
        </div>
      )}
      {(clientsLoading || externalLoading || internalLoading || teamLoading) && (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      )}
      {!(clientsLoading || externalLoading || internalLoading || teamLoading) && (
        activeTab === 'external' ? renderExternalSPOCs() : renderInternalSPOCs()
      )}

      {/* Empty State */}
      {!(clientsLoading || externalLoading || internalLoading || teamLoading) && ((activeTab === 'external' && filteredExternalSPOCs.length === 0) ||
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
      <SPOCForm
        type={spocFormType}
        isOpen={showSPOCForm}
        onClose={() => setShowSPOCForm(false)}
        onSave={handleSaveSPOC}
        clients={clientsOptions}
        teamMembers={teamMembers}
        defaultClientId={selectedClient !== 'all' ? selectedClient : (initialClientId || undefined)}
      />
    </div>
  );
};

export default SPOCManagement;