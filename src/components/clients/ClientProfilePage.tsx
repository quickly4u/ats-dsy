import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  History,
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  Users,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { supabase, getCurrentUserCompanyId } from '../../lib/supabase';
import { AuditInfo } from '../common/AuditInfo';
import { TransactionHistory } from '../common/TransactionHistory';

const ClientProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'contacts' | 'history'>('overview');
  const [client, setClient] = useState<any | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [spocs, setSpocs] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const cid = await getCurrentUserCompanyId();
      if (cid) setCompanyId(cid);
    })();
  }, []);

  useEffect(() => {
    if (!id || !companyId) return;
    const loadClient = async () => {
      try {
        setLoading(true);
        const { data: row, error } = await supabase
          .from('clients')
          .select(`
            id,
            name,
            company_name,
            industry,
            website,
            description,
            status,
            logo,
            contact_email,
            contact_phone,
            address_street,
            address_city,
            address_state,
            address_country,
            address_zip,
            contract_details,
            created_at
          `)
          .eq('id', id)
          .eq('company_id', companyId)
          .maybeSingle();
        if (error) throw error;
        if (!row) { setClient(null); return; }

        const contractDetails = (row as any).contract_details || {};
        
        setClient({
          id: (row as any).id,
          name: (row as any).name,
          companyName: (row as any).company_name,
          industry: (row as any).industry,
          website: (row as any).website,
          description: (row as any).description,
          status: (row as any).status,
          logo: (row as any).logo,
          contactInfo: {
            email: (row as any).contact_email,
            phone: (row as any).contact_phone
          },
          address: {
            street: (row as any).address_street,
            city: (row as any).address_city,
            state: (row as any).address_state,
            country: (row as any).address_country,
            zipCode: (row as any).address_zip
          },
          contractDetails: {
            contractType: contractDetails.contractType,
            paymentTerms: contractDetails.paymentTerms,
            startDate: contractDetails.startDate,
            endDate: contractDetails.endDate,
            isExclusive: contractDetails.isExclusive,
            includesBackgroundCheck: contractDetails.includesBackgroundCheck,
            hasReplacementGuarantee: contractDetails.hasReplacementGuarantee,
            replacementGuaranteeDays: contractDetails.replacementGuaranteeDays,
            hasConfidentialityAgreement: contractDetails.hasConfidentialityAgreement,
            additionalTerms: contractDetails.additionalTerms
          },
          createdAt: (row as any).created_at
        });
      } catch (e) {
        console.error('Failed to load client', e);
        setClient(null);
      } finally {
        setLoading(false);
      }
    };
    loadClient();
  }, [id, companyId]);

  // Load jobs for this client
  useEffect(() => {
    if (!id || !companyId) return;
    const loadJobs = async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          status,
          employment_type,
          location,
          published_at,
          expires_at
        `)
        .eq('client_id', id)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (!error) setJobs(data || []);
    };
    loadJobs();
  }, [id, companyId]);

  // Load SPOCs for this client
  useEffect(() => {
    if (!id || !companyId) return;
    const loadSpocs = async () => {
      const { data, error } = await supabase
        .from('spocs')
        .select(`
          id,
          name,
          email,
          phone,
          role,
          is_primary,
          spoc_type
        `)
        .eq('client_id', id)
        .eq('company_id', companyId)
        .order('is_primary', { ascending: false });
      if (!error) setSpocs(data || []);
    };
    loadSpocs();
  }, [id, companyId]);

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

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-3 text-gray-600">Loading client...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-700">Client not found.</p>
        </div>
      </div>
    );
  }

  const activeJobs = jobs.filter(j => j.status === 'active' || j.status === 'open').length;
  const totalJobs = jobs.length;

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/clients')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Clients"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {client.logo ? (
              <img
                src={client.logo}
                alt={client.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {client.name}
              </h2>
              <p className="text-sm text-gray-600">
                {client.companyName} • {client.industry}
              </p>
              {client.id && (
                <div className="mt-2">
                  <AuditInfo tableName="clients" recordId={client.id} className="text-xs" />
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Status</div>
            <div className="font-medium text-gray-900 flex items-center gap-2">
              {getStatusIcon(client.status)}
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(client.status)}`}>
                {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Building2 },
              { id: 'jobs', label: 'Jobs', icon: Briefcase },
              { id: 'contacts', label: 'Contacts', icon: Users },
              { id: 'history', label: 'History', icon: History },
            ].map((tab) => {
              const Icon = tab.icon as any;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {tab.id === 'jobs' && jobs.length > 0 && (
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">{jobs.length}</span>
                  )}
                  {tab.id === 'contacts' && spocs.length > 0 && (
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">{spocs.length}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500">Active Jobs</div>
                      <div className="text-2xl font-bold text-blue-600">{activeJobs}</div>
                    </div>
                    <Briefcase className="w-8 h-8 text-blue-400" />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500">Total Jobs</div>
                      <div className="text-2xl font-bold text-purple-600">{totalJobs}</div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-400" />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500">Contacts</div>
                      <div className="text-2xl font-bold text-green-600">{spocs.length}</div>
                    </div>
                    <Users className="w-8 h-8 text-green-400" />
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                  Company Information
                </h4>
                {client.description && (
                  <p className="text-sm text-gray-700 mb-4 whitespace-pre-line">{client.description}</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Company Name</span>
                    <span className="text-sm text-gray-900">{client.companyName}</span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Industry</span>
                    <span className="text-sm text-gray-900">{client.industry}</span>
                  </div>
                  {client.website && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Website</span>
                      <div className="flex items-center text-sm text-blue-600">
                        <Globe size={16} className="mr-2" />
                        <a href={client.website} target="_blank" rel="noreferrer" className="hover:underline">
                          {client.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-blue-600" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {client.contactInfo.email && (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email Address</span>
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail size={16} className="mr-2 text-gray-400" />
                        <span className="truncate">{client.contactInfo.email}</span>
                      </div>
                    </div>
                  )}
                  {client.contactInfo.phone && (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Phone Number</span>
                      <div className="flex items-center text-sm text-gray-900">
                        <Phone size={16} className="mr-2 text-gray-400" />
                        <span>{client.contactInfo.phone}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              {(client.address.street || client.address.city) && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                    Address
                  </h4>
                  <div className="text-sm text-gray-900">
                    {client.address.street && <div>{client.address.street}</div>}
                    <div>
                      {[client.address.city, client.address.state, client.address.zipCode]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                    {client.address.country && <div>{client.address.country}</div>}
                  </div>
                </div>
              )}

              {/* Contract Details */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Contract Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {client.contractDetails.contractType && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Contract Type</span>
                      <span className="text-sm text-gray-900 capitalize">{client.contractDetails.contractType}</span>
                    </div>
                  )}
                  {client.contractDetails.paymentTerms && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Payment Terms</span>
                      <span className="text-sm text-gray-900">{client.contractDetails.paymentTerms}</span>
                    </div>
                  )}
                  {client.contractDetails.startDate && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Start Date</span>
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar size={16} className="mr-2 text-gray-400" />
                        <span>{new Date(client.contractDetails.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                  {client.contractDetails.endDate && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">End Date</span>
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar size={16} className="mr-2 text-gray-400" />
                        <span>{new Date(client.contractDetails.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Contract Features */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {client.contractDetails.isExclusive && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      Exclusive
                    </span>
                  )}
                  {client.contractDetails.includesBackgroundCheck && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Background Check Included
                    </span>
                  )}
                  {client.contractDetails.hasReplacementGuarantee && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                      {client.contractDetails.replacementGuaranteeDays}-Day Replacement Guarantee
                    </span>
                  )}
                  {client.contractDetails.hasConfidentialityAgreement && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                      Confidentiality Agreement
                    </span>
                  )}
                </div>

                {client.contractDetails.additionalTerms && (
                  <div className="mt-4">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Additional Terms</span>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{client.contractDetails.additionalTerms}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="space-y-3">
              {jobs.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs yet</h3>
                  <p className="mt-1 text-sm text-gray-500">This client doesn't have any jobs posted.</p>
                </div>
              ) : (
                jobs.map((job: any) => (
                  <div 
                    key={job.id} 
                    className="flex items-center justify-between border rounded-lg p-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <div>
                      <div className="text-gray-900 text-sm font-medium">{job.title}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                        <MapPin size={14} className="text-gray-400" /> {job.location || 'Location not specified'}
                        <span>•</span>
                        <span className="capitalize">{job.employment_type || 'Full-time'}</span>
                        {job.published_at && (
                          <>
                            <span>•</span>
                            <Calendar size={14} className="text-gray-400" /> Published {new Date(job.published_at).toLocaleDateString()}
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        job.status === 'active' || job.status === 'open' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-3">
              {spocs.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts yet</h3>
                  <p className="mt-1 text-sm text-gray-500">No SPOCs have been added for this client.</p>
                </div>
              ) : (
                spocs.map((spoc: any) => (
                  <div key={spoc.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-gray-900 text-sm font-medium">{spoc.name}</div>
                            {spoc.is_primary && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                Primary
                              </span>
                            )}
                            {spoc.spoc_type && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs font-medium rounded-full capitalize">
                                {spoc.spoc_type}
                              </span>
                            )}
                          </div>
                          {spoc.role && (
                            <div className="text-xs text-gray-500 mt-1">{spoc.role}</div>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            {spoc.email && (
                              <div className="flex items-center text-xs text-gray-600">
                                <Mail size={14} className="mr-1 text-gray-400" />
                                <span>{spoc.email}</span>
                              </div>
                            )}
                            {spoc.phone && (
                              <div className="flex items-center text-xs text-gray-600">
                                <Phone size={14} className="mr-1 text-gray-400" />
                                <span>{spoc.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'history' && client.id && (
            <TransactionHistory tableName="clients" recordId={client.id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientProfilePage;
