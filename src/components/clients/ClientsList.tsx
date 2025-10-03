import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter,
  Globe,
  Mail,
  Phone,
  MapPin,
  Users,
  Briefcase,
  TrendingUp,
  MoreVertical,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  X
} from 'lucide-react';
import type { Client } from '../../types';
import { useClients } from '../../hooks/useRecruitmentData';
import ClientForm from '../forms/ClientForm';
import { supabase, getCurrentUserCompanyId } from '../../lib/supabase';
import SPOCManagement from './SPOCManagement';

// Mock data removed - now using real Supabase data

const ClientsList: React.FC = () => {
  const navigate = useNavigate();
  const { clients, isLoading, error, refetch } = useClients();
  const [searchQuery, setSearchQuery] = useState('');
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showSPOCManager, setShowSPOCManager] = useState(false);
  const [spocInitialClientId, setSpocInitialClientId] = useState<string | undefined>(undefined);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'inactive':
        return <XCircle size={16} className="text-red-600" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = searchQuery === '' || 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.industry.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || client.status === selectedStatus;
    const matchesIndustry = selectedIndustry === 'all' || client.industry === selectedIndustry;
    
    return matchesSearch && matchesStatus && matchesIndustry;
  });

  const handleSaveClient = async (clientData: Partial<Client>): Promise<boolean> => {
    try {
      const formatDate = (d?: Date) => (d ? new Date(d).toISOString().slice(0, 10) : null);

      // Get current user's company_id
      const companyId = await getCurrentUserCompanyId();
      if (!companyId) {
        alert('Unable to determine your company. Please log in again.');
        return false;
      }

      // Prepare contract_details JSON payload
      const contractDetails = {
        contractType: clientData.contractDetails?.contractType ?? null,
        paymentTerms: clientData.contractDetails?.paymentTerms ?? null,
        startDate: formatDate(clientData.contractDetails?.startDate),
        endDate: formatDate(clientData.contractDetails?.endDate) || null,
        isExclusive: clientData.contractDetails?.isExclusive ?? false,
        includesBackgroundCheck: clientData.contractDetails?.includesBackgroundCheck ?? false,
        hasReplacementGuarantee: clientData.contractDetails?.hasReplacementGuarantee ?? false,
        replacementGuaranteeDays: typeof clientData.contractDetails?.replacementGuaranteeDays === 'number'
          ? clientData.contractDetails?.replacementGuaranteeDays
          : (clientData.contractDetails?.replacementGuaranteeDays ?? null),
        hasConfidentialityAgreement: clientData.contractDetails?.hasConfidentialityAgreement ?? false,
        additionalTerms: clientData.contractDetails?.additionalTerms ?? null,
      };

      const payload: Record<string, any> = {
        company_id: companyId,
        name: clientData.name ?? '',
        company_name: clientData.companyName ?? '',
        industry: clientData.industry ?? null,
        website: clientData.website ?? null,
        description: clientData.description ?? null,
        status: clientData.status ?? 'active',
        logo: clientData.logo ?? null,
        contact_email: clientData.contactInfo?.email ?? null,
        contact_phone: clientData.contactInfo?.phone ?? null,
        address_street: clientData.address?.street ?? null,
        address_city: clientData.address?.city ?? null,
        address_state: clientData.address?.state ?? null,
        address_country: clientData.address?.country ?? null,
        address_zip: clientData.address?.zipCode ?? null,
        // Store all contract details inside JSONB
        contract_details: contractDetails,
      };

      let error = null as any;
      if (clientData.id) {
        const { error: updateError } = await supabase
          .from('clients')
          .update(payload)
          .eq('id', clientData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('clients')
          .insert(payload);
        error = insertError;
      }

      if (error) {
        console.error('Failed to save client:', error);
        alert(`Failed to save client: ${error.message}`);
        return false;
      }

      refetch();
      return true;
    } catch (e: any) {
      console.error('Unexpected error saving client:', e);
      alert(`Unexpected error: ${e.message || e}`);
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Clients</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === 'active').length;
  const totalActiveJobs = clients.reduce((sum, c) => sum + c.activeJobs, 0);
  const totalPlacements = clients.reduce((sum, c) => sum + c.successfulPlacements, 0);

  return (
    <>
    <div className="p-6">
      {/* Header actions moved into toolbar below */}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
            </div>
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Clients</p>
              <p className="text-2xl font-bold text-gray-900">{activeClients}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{totalActiveJobs}</p>
            </div>
            <Briefcase className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Placements</p>
              <p className="text-2xl font-bold text-gray-900">{totalPlacements}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex-1 relative">
            <Search 
              size={20} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            />
            <input
              type="text"
              placeholder="Search clients by name, company, or industry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <Filter size={18} />
              <span>Filters</span>
            </button>
            <button 
              onClick={() => { setSpocInitialClientId(undefined); setShowSPOCManager(true); }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <Users size={18} />
              <span>SPOCs</span>
            </button>
            <button 
              onClick={() => { setEditingClient(undefined); setShowClientForm(true); }}
              className="bg-blue-600 text-white px-3 py-2 text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus size={18} />
              <span>Add Client</span>
            </button>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <select 
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Industries</option>
                  <option value="Technology">Technology</option>
                  <option value="Financial Services">Financial Services</option>
                  <option value="Healthcare Technology">Healthcare Technology</option>
                  <option value="Manufacturing">Manufacturing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contract Type
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Types</option>
                  <option>Retainer</option>
                  <option>Contingency</option>
                  <option>Hybrid</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {client.logo ? (
                    <img
                      src={client.logo}
                      alt={client.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                    <p className="text-sm text-gray-600">{client.industry}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(client.status)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(client.status)}`}>
                      {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                    </span>
                  </div>
                  <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {client.description}
              </p>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail size={16} className="mr-2 text-gray-400" />
                  <span>{client.contactInfo.email}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone size={16} className="mr-2 text-gray-400" />
                  <span>{client.contactInfo.phone}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin size={16} className="mr-2 text-gray-400" />
                  <span>{client.address.city}, {client.address.state}</span>
                </div>
                {client.website && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe size={16} className="mr-2 text-gray-400" />
                    <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                      Visit Website
                    </a>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{client.activeJobs}</p>
                  <p className="text-xs text-gray-600">Active Jobs</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{client.totalJobs}</p>
                  <p className="text-xs text-gray-600">Total Jobs</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{client.successfulPlacements}</p>
                  <p className="text-xs text-gray-600">Placements</p>
                </div>
              </div>

              {/* Contract Info */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Contract Type:</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {client.contractDetails.contractType}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-500">Payment Terms:</span>
                  <span className="font-medium text-gray-900">
                    {client.contractDetails.paymentTerms}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <button 
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    onClick={() => navigate(`/clients/${client.id}`)}
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                  <button 
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    onClick={() => { setEditingClient(client); setShowClientForm(true); }}
                    title="Edit Client"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    onClick={() => { setSpocInitialClientId(client.id); setShowSPOCManager(true); }}
                    title="Manage SPOCs"
                  >
                    <Users size={16} />
                  </button>
                </div>
                
                <button 
                  className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>

    {/* Client Form Modal */}
    <ClientForm
      client={editingClient}
      isOpen={showClientForm}
      onClose={() => { setShowClientForm(false); setEditingClient(undefined); }}
      onSave={handleSaveClient}
    />

    {/* SPOC Management Overlay */}
    {showSPOCManager && (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => { setShowSPOCManager(false); setSpocInitialClientId(undefined); }} />
        <div className="absolute inset-0 bg-white flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Manage SPOCs</h2>
            <button
              onClick={() => { setShowSPOCManager(false); setSpocInitialClientId(undefined); }}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <SPOCManagement initialClientId={spocInitialClientId} />
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default ClientsList;