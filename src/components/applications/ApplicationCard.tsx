import React from 'react';
import { 
  Briefcase,
  Calendar,
  Star,
  MessageSquare,
  MoreVertical,
  Clock,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';
import type { Application } from '../../types';

interface ApplicationCardProps {
  application: Application;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onViewDetails?: (applicationId: string) => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ 
  application, 
  isSelected, 
  onSelect, 
  onViewDetails
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'hired':
        return 'bg-green-100 text-green-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={14}
          className={`${
            i <= rating 
              ? 'text-yellow-400 fill-current' 
              : 'text-gray-300'
          }`}
        />
      );
    }
    return stars;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 p-6">
      <div className="flex items-start space-x-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-1"
        />
        
        {/* Profile picture commented out as requested */}
        {/* <img
          src={application.candidate.avatar || `https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2`}
          alt={`${application.candidate.firstName} ${application.candidate.lastName}`}
          className="w-12 h-12 rounded-full object-cover"
        /> */}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {application.candidate.firstName} {application.candidate.lastName}
              </h3>
              <p className="text-sm text-gray-600">
                Applied for {application.job.title}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
                {application.status.charAt(0).toUpperCase() + application.status.slice(1).replace('-', ' ')}
              </span>
              <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Briefcase size={16} className="mr-2 text-gray-400" />
                <span>{application.candidate.currentTitle} at {application.candidate.currentCompany}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <MapPin size={16} className="mr-2 text-gray-400" />
                <span>{application.candidate.location}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Mail size={16} className="mr-2 text-gray-400" />
                <span>{application.candidate.email}</span>
              </div>
              
              {application.candidate.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone size={16} className="mr-2 text-gray-400" />
                  <span>{application.candidate.phone}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar size={16} className="mr-2 text-gray-400" />
                <span>Applied {formatDate(application.appliedAt)}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Clock size={16} className="mr-2 text-gray-400" />
                <span>Source: {application.source}</span>
              </div>
            </div>
          </div>
          
          {/* Skills */}
          {application.candidate.skills.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {application.candidate.skills.slice(0, 5).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
                {application.candidate.skills.length > 5 && (
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                    +{application.candidate.skills.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Current Stage */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-gray-500">Current Stage:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {application.currentStage.name}
                </span>
              </div>
              
              {application.rating && (
                <div className="flex items-center space-x-1">
                  {renderStars(application.rating)}
                </div>
              )}
              
              {application.score && (
                <div className="text-sm">
                  <span className="text-gray-500">Score:</span>
                  <span className="ml-1 font-medium text-gray-900">
                    {application.score}/100
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <MessageSquare size={16} />
              </button>
              <button onClick={() => onViewDetails?.(application.id)} className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationCard;