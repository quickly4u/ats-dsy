import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  UserPlus
} from 'lucide-react';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: Date;
  joinedAt: Date;
  permissions: string[];
  reportsTo?: string;
  directReports: number;
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@company.com',
    phone: '+1 (555) 123-4567',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
    role: 'HR Manager',
    department: 'Human Resources',
    status: 'active',
    lastLogin: new Date(Date.now() - 2 * 3600000),
    joinedAt: new Date('2023-01-15'),
    permissions: ['job_management', 'candidate_management', 'reporting', 'user_management'],
    directReports: 3
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah@company.com',
    phone: '+1 (555) 234-5678',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
    role: 'Senior Recruiter',
    department: 'Human Resources',
    status: 'active',
    lastLogin: new Date(Date.now() - 30 * 60000),
    joinedAt: new Date('2023-03-20'),
    permissions: ['job_management', 'candidate_management', 'interview_scheduling'],
    reportsTo: '1',
    directReports: 0
  },
  {
    id: '3',
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike@company.com',
    avatar: 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
    role: 'Hiring Manager',
    department: 'Engineering',
    status: 'active',
    lastLogin: new Date(Date.now() - 4 * 3600000),
    joinedAt: new Date('2022-11-10'),
    permissions: ['candidate_review', 'interview_participation', 'hiring_decisions'],
    directReports: 1
  },
  {
    id: '4',
    firstName: 'Lisa',
    lastName: 'Chen',
    email: 'lisa@company.com',
    phone: '+1 (555) 345-6789',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
    role: 'Recruiter',
    department: 'Human Resources',
    status: 'pending',
    joinedAt: new Date('2024-01-20'),
    permissions: ['candidate_management', 'interview_scheduling'],
    reportsTo: '1',
    directReports: 0
  },
  {
    id: '5',
    firstName: 'David',
    lastName: 'Brown',
    email: 'david@company.com',
    role: 'Interviewer',
    department: 'Marketing',
    status: 'inactive',
    lastLogin: new Date(Date.now() - 30 * 24 * 3600000),
    joinedAt: new Date('2023-06-15'),
    permissions: ['interview_participation'],
    directReports: 0
  }
];

const TeamList: React.FC = () => {
  const [teamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const formatLastLogin = (date?: Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = searchQuery === '' || 
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || member.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeMembers = teamMembers.filter(m => m.status === 'active').length;
  const pendingMembers = teamMembers.filter(m => m.status === 'pending').length;
  const totalPermissions = [...new Set(teamMembers.flatMap(m => m.permissions))].length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">
            Manage users, roles, and permissions
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
            <Shield size={20} />
            <span>Roles & Permissions</span>
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <UserPlus size={20} />
            <span>Invite User</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{activeMembers}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Invites</p>
              <p className="text-2xl font-bold text-gray-900">{pendingMembers}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Permission Types</p>
              <p className="text-2xl font-bold text-gray-900">{totalPermissions}</p>
            </div>
            <Shield className="w-8 h-8 text-purple-600" />
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
              placeholder="Search team members by name, email, role, or department..."
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
                  Role
                </label>
                <select 
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Roles</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="Senior Recruiter">Senior Recruiter</option>
                  <option value="Recruiter">Recruiter</option>
                  <option value="Hiring Manager">Hiring Manager</option>
                  <option value="Interviewer">Interviewer</option>
                </select>
              </div>
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
                  Department
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Departments</option>
                  <option>Human Resources</option>
                  <option>Engineering</option>
                  <option>Marketing</option>
                  <option>Sales</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Team Members List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role & Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={member.avatar || `https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2`}
                        alt={`${member.firstName} ${member.lastName}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center space-x-2">
                          <Mail size={12} />
                          <span>{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="text-sm text-gray-500 flex items-center space-x-2">
                            <Phone size={12} />
                            <span>{member.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{member.role}</div>
                    <div className="text-sm text-gray-500">{member.department}</div>
                    {member.directReports > 0 && (
                      <div className="text-xs text-blue-600">
                        {member.directReports} direct report{member.directReports !== 1 ? 's' : ''}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(member.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.status)}`}>
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatLastLogin(member.lastLogin)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {member.permissions.slice(0, 2).map((permission, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                        >
                          {permission.replace('_', ' ')}
                        </span>
                      ))}
                      {member.permissions.length > 2 && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                          +{member.permissions.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit size={16} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No team members found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default TeamList;