import React, { useState } from 'react';
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  Send, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  MoreVertical,
  Calendar,
  User,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Communication {
  id: string;
  type: 'email' | 'sms' | 'call' | 'note';
  subject?: string;
  content: string;
  recipient: {
    name: string;
    email: string;
    avatar?: string;
  };
  sender: {
    name: string;
    email: string;
    avatar?: string;
  };
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  sentAt: Date;
  openedAt?: Date;
  clickedAt?: Date;
  relatedTo?: {
    type: 'job' | 'application' | 'interview';
    title: string;
    id: string;
  };
  template?: string;
}

const mockCommunications: Communication[] = [
  {
    id: '1',
    type: 'email',
    subject: 'Interview Invitation - Senior Software Engineer',
    content: 'Hi Sarah, We would like to invite you for an interview for the Senior Software Engineer position...',
    recipient: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2'
    },
    sender: {
      name: 'John Doe',
      email: 'john@company.com',
      avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2'
    },
    status: 'opened',
    sentAt: new Date(Date.now() - 2 * 3600000),
    openedAt: new Date(Date.now() - 1 * 3600000),
    relatedTo: {
      type: 'application',
      title: 'Senior Software Engineer Application',
      id: '1'
    },
    template: 'Interview Invitation'
  },
  {
    id: '2',
    type: 'email',
    subject: 'Application Received - Product Marketing Manager',
    content: 'Thank you for your application for the Product Marketing Manager position...',
    recipient: {
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      avatar: 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2'
    },
    sender: {
      name: 'Jane Smith',
      email: 'jane@company.com'
    },
    status: 'delivered',
    sentAt: new Date(Date.now() - 4 * 3600000),
    relatedTo: {
      type: 'application',
      title: 'Product Marketing Manager Application',
      id: '2'
    },
    template: 'Application Confirmation'
  },
  {
    id: '3',
    type: 'sms',
    content: 'Reminder: Your interview is scheduled for tomorrow at 2:00 PM. Please confirm your attendance.',
    recipient: {
      name: 'Emily Davis',
      email: 'emily.davis@email.com',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2'
    },
    sender: {
      name: 'System',
      email: 'system@company.com'
    },
    status: 'delivered',
    sentAt: new Date(Date.now() - 6 * 3600000),
    relatedTo: {
      type: 'interview',
      title: 'UX Designer Interview',
      id: '3'
    }
  }
];

const CommunicationsList: React.FC = () => {
  const [communications] = useState<Communication[]>(mockCommunications);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'opened':
        return 'bg-purple-100 text-purple-800';
      case 'clicked':
        return 'bg-indigo-100 text-indigo-800';
      case 'bounced':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail size={16} className="text-blue-600" />;
      case 'sms':
        return <MessageSquare size={16} className="text-green-600" />;
      case 'call':
        return <Phone size={16} className="text-purple-600" />;
      case 'note':
        return <FileText size={16} className="text-gray-600" />;
      default:
        return <Mail size={16} className="text-blue-600" />;
    }
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const filteredCommunications = communications.filter(comm => {
    const matchesType = selectedType === 'all' || comm.type === selectedType;
    const matchesSearch = searchQuery === '' || 
      comm.recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
          <p className="text-gray-600 mt-1">
            Manage candidate communications and templates
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
            <FileText size={20} />
            <span>Templates</span>
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Plus size={20} />
            <span>New Message</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sent</p>
              <p className="text-2xl font-bold text-gray-900">1,247</p>
            </div>
            <Send className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Rate</p>
              <p className="text-2xl font-bold text-gray-900">68%</p>
            </div>
            <Eye className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Response Rate</p>
              <p className="text-2xl font-bold text-gray-900">24%</p>
            </div>
            <MessageSquare className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bounce Rate</p>
              <p className="text-2xl font-bold text-gray-900">2.1%</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-600" />
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
              placeholder="Search communications by recipient, subject, or content..."
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

        {/* Type Filter Tabs */}
        <div className="flex items-center space-x-2">
          {[
            { id: 'all', label: 'All', count: communications.length },
            { id: 'email', label: 'Email', count: communications.filter(c => c.type === 'email').length },
            { id: 'sms', label: 'SMS', count: communications.filter(c => c.type === 'sms').length },
            { id: 'call', label: 'Calls', count: communications.filter(c => c.type === 'call').length },
            { id: 'note', label: 'Notes', count: communications.filter(c => c.type === 'note').length }
          ].map(type => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                selectedType === type.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{type.label}</span>
              <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
                {type.count}
              </span>
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Status</option>
                  <option>Sent</option>
                  <option>Delivered</option>
                  <option>Opened</option>
                  <option>Clicked</option>
                  <option>Bounced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Templates</option>
                  <option>Interview Invitation</option>
                  <option>Application Confirmation</option>
                  <option>Rejection Letter</option>
                  <option>Offer Letter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Time</option>
                  <option>Today</option>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sender
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Senders</option>
                  <option>John Doe</option>
                  <option>Jane Smith</option>
                  <option>System</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Communications List */}
      <div className="space-y-4">
        {filteredCommunications.map((communication) => (
          <div key={communication.id} className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {getTypeIcon(communication.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {communication.subject || `${communication.type.toUpperCase()} Message`}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(communication.status)}`}>
                        {communication.status.charAt(0).toUpperCase() + communication.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <img
                          src={communication.recipient.avatar || `https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=32&h=32&dpr=2`}
                          alt={communication.recipient.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span>To: {communication.recipient.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>{formatDateTime(communication.sentAt)}</span>
                      </div>
                      {communication.template && (
                        <div className="flex items-center space-x-1">
                          <FileText size={14} />
                          <span>Template: {communication.template}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                    <MoreVertical size={16} />
                  </button>
                </div>
                
                <p className="text-gray-600 mb-3 line-clamp-2">
                  {communication.content}
                </p>
                
                {communication.relatedTo && (
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm text-gray-500">Related to:</span>
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                      {communication.relatedTo.title}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Send size={14} />
                      <span>Sent {formatDateTime(communication.sentAt)}</span>
                    </div>
                    {communication.openedAt && (
                      <div className="flex items-center space-x-1">
                        <Eye size={14} />
                        <span>Opened {formatDateTime(communication.openedAt)}</span>
                      </div>
                    )}
                    {communication.clickedAt && (
                      <div className="flex items-center space-x-1">
                        <CheckCircle size={14} />
                        <span>Clicked {formatDateTime(communication.clickedAt)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Eye size={16} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCommunications.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No communications found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Communications will appear here as you interact with candidates.
          </p>
          <div className="mt-6">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Send Message
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationsList;