import React, { useState } from 'react';
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
  Clock
} from 'lucide-react';
import type { Client } from '../../types';

const mockClients: Client[] = [
  {
    id: '1',
    name: 'TechCorp Solutions',
    companyName: 'TechCorp Solutions Inc.',
    industry: 'Technology',
    website: 'https://techcorp.com',
    logo: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
    description: 'Leading technology solutions provider specializing in enterprise software development.',
    address: {
      street: '123 Tech Street',
      city: 'San Francisco',
      state: 'CA',
      country: 'United States',
      zipCode: '94105'
    },
    contactInfo: {
      email: 'contact@techcorp.com',
      phone: '+1 (555) 123-4567'
    },
    contractDetails: {
      startDate: new Date('2024-01-01'),
      contractType: 'retainer',
      paymentTerms: 'Net 30'
    },
    status: 'active',
    totalJobs: 15,
    activeJobs: 8,
    successfulPlacements: 12,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'FinanceFirst',
    companyName: 'FinanceFirst Banking Corp',
    industry: 'Financial Services',
    website: 'https://financefirst.com',
    description: 'Premier financial services company providing banking and investment solutions.',
    address: {
      street: '456 Wall Street',
      city: 'New York',
      state: 'NY',
      country: 'United States',
      zipCode: '10005'
    },
    contactInfo: {
      email: 'hr@financefirst.com',
      phone: '+1 (555) 987-6543'
    },
    contractDetails: {
      startDate: new Date('2023-06-01'),
      contractType: 'contingency',
      paymentTerms: 'Net 15'
    },
    status: 'active',
    totalJobs: 22,
    activeJobs: 5,
    successfulPlacements: 18,
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: '3',
    name: 'HealthTech Innovations',
    companyName: 'HealthTech Innovations Ltd.',
    industry: 'Healthcare Technology',
    website: 'https://healthtech.com',
    description: 'Innovative healthcare technology company developing cutting-edge medical solutions.',
    address: {
      street: '789 Medical Drive',
      city: 'Boston',
      state: 'MA',
      country: 'United States',
      zipCode: '02101'
    },
    contactInfo: {
      email: 'talent@healthtech.com',
      phone: '+1 (555) 456-7890'
    },
    contractDetails: {
      startDate: new Date('2024-03-01'),
      contractType: 'hybrid',
      paymentTerms: 'Net 45'
    },
    status: 'pending',
    totalJobs: 3,
    activeJobs: 3,
    successfulPlacements: 0,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-15')
  }
];

const ClientsList: React.FC = () => {
  const [clients] = useState<Client[]>(mockClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

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

  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === 'active').length;
  const totalActiveJobs = clients.reduce((sum, c) => sum + c.activeJobs, 0);
  const totalPlacements = clients.reduce((sum, c) => sum + c.successfulPlacements, 0);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-600 mt-1">
            Manage client relationships and external partnerships
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
            <Users size={20} />
            <span>Manage SPOCs</span>
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Plus size={20} />
            <span>Add Client</span>
          </button>
        </div>
      </div>

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
        <div className="flex items-center space-x-4 mb-4">
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <Filter size={20} />
            <span>Filters</span>
          </button>
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
                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Eye size={16} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <Edit size={16} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                    <Users size={16} />
                  </button>
                </div>
                
                <button className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
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
  );
};

export default ClientsList;