import React from 'react';
import { 
  MapPin, 
  DollarSign, 
  Calendar, 
  Users, 
  Eye, 
  Edit, 
  MoreVertical 
} from 'lucide-react';
import type { Job } from '../../types';

interface JobCardProps {
  job: Job;
  onClick?: () => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Salary not specified';
    if (min && max) return `$${(min/1000).toFixed(0)}K - $${(max/1000).toFixed(0)}K`;
    if (min) return `From $${(min/1000).toFixed(0)}K`;
    if (max) return `Up to $${(max/1000).toFixed(0)}K`;
    return 'Salary not specified';
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Not specified';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                {job.client?.name || 'Direct Client'}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
              {job.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {job.department.name}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>

        {/* Job Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin size={16} className="mr-2 text-gray-400" />
            <span>{job.location}</span>
            <span className="mx-2">•</span>
            <span className="capitalize">{job.remoteType.replace('-', ' ')}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign size={16} className="mr-2 text-gray-400" />
            <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Calendar size={16} className="mr-2 text-gray-400" />
            <span>Posted {formatDate(job.publishedAt)}</span>
          </div>
        </div>

        {/* Employment Type & Experience */}
        <div className="flex items-center space-x-2 mb-4">
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            {job.employmentType.charAt(0).toUpperCase() + job.employmentType.slice(1).replace('-', ' ')}
          </span>
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
            {job.experienceLevel.charAt(0).toUpperCase() + job.experienceLevel.slice(1)}
          </span>
        </div>

        {/* Job Description Preview */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {job.description}
        </p>

        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Users size={16} className="mr-1" />
              <span>{job.applicationsCount} applications</span>
            </div>
            <div className="flex items-center">
              <Eye size={16} className="mr-1" />
              <span>{job.viewsCount} views</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Edit size={16} />
            </button>
            <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
              <Eye size={16} />
            </button>
          </div>
        </div>

        {/* Hiring Team */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">External SPOC:</span>
                <span className="text-gray-900 font-medium">
                  {job.externalSpoc?.firstName} {job.externalSpoc?.lastName}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">Internal SPOC:</span>
                <span className="text-gray-900 font-medium">
                  {job.primaryInternalSpoc?.user.firstName} {job.primaryInternalSpoc?.user.lastName}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <img
                src={job.hiringManager.avatar}
                alt={`${job.hiringManager.firstName} ${job.hiringManager.lastName}`}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="text-gray-600">
                {job.hiringManager.firstName} {job.hiringManager.lastName}
              </span>
            </div>
            {job.assignedRecruiter && (
              <div className="flex items-center space-x-2">
                <img
                  src={job.assignedRecruiter.avatar}
                  alt={`${job.assignedRecruiter.firstName} ${job.assignedRecruiter.lastName}`}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-gray-600">Recruiter</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobCard;