import React from 'react';
import { 
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  MessageSquare,
  MoreVertical,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import type { Interview } from '../../types';
import { AuditInfo } from '../common/AuditInfo';

interface InterviewCardProps {
  interview: Interview;
  isToday?: boolean;
}

const InterviewCard: React.FC<InterviewCardProps> = ({ interview, isToday = false }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const isUpcoming = new Date(interview.scheduledAt) > new Date();
  const needsFeedback = interview.status === 'completed' && (!interview.feedback || interview.feedback.length === 0);

  return (
    <div className={`bg-white rounded-lg border transition-all duration-200 p-6 ${
      isToday ? 'border-blue-300 shadow-md' : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4">
          <img
            src={interview.application.candidate.avatar || `https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2`}
            alt={`${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`}
            className="w-12 h-12 rounded-full object-cover"
          />
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {interview.application.candidate.firstName} {interview.application.candidate.lastName}
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              {interview.title || `Interview for ${interview.application.job.title}`}
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar size={16} className="mr-1" />
                <span>{formatDateTime(interview.scheduledAt)}</span>
              </div>
              <div className="flex items-center">
                <Clock size={16} className="mr-1" />
                <span>{interview.durationMinutes} min</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(interview.status)}`}>
            {interview.status.charAt(0).toUpperCase() + interview.status.slice(1).replace('-', ' ')}
          </span>
          {needsFeedback && (
            <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full flex items-center">
              <AlertCircle size={12} className="mr-1" />
              Feedback Needed
            </span>
          )}
          <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>
      
      {/* Interview Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex items-center text-sm text-gray-600 mb-2">
            {interview.meetingUrl ? (
              <>
                <Video size={16} className="mr-2 text-gray-400" />
                <span>Video Interview</span>
              </>
            ) : interview.location ? (
              <>
                <MapPin size={16} className="mr-2 text-gray-400" />
                <span>{interview.location}</span>
              </>
            ) : (
              <>
                <MapPin size={16} className="mr-2 text-gray-400" />
                <span>Location TBD</span>
              </>
            )}
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Users size={16} className="mr-2 text-gray-400" />
            <span>
              {interview.participants.length} participant{interview.participants.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium">Round:</span> {interview.interviewRound}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Job:</span> {interview.application.job.title}
          </p>
        </div>
      </div>
      
      {/* Participants */}
      {interview.participants.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Participants:</p>
          <div className="flex items-center space-x-2">
            {interview.participants.slice(0, 3).map((participant, index) => (
              <div key={index} className="flex items-center space-x-1">
                <img
                  src={participant.user.avatar || `https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=32&h=32&dpr=2`}
                  alt={`${participant.user.firstName} ${participant.user.lastName}`}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-sm text-gray-600">
                  {participant.user.firstName} {participant.user.lastName}
                </span>
                {participant.role === 'interviewer' && (
                  <span className="text-xs text-gray-500">({participant.role})</span>
                )}
              </div>
            ))}
            {interview.participants.length > 3 && (
              <span className="text-sm text-gray-500">
                +{interview.participants.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Description */}
      {interview.description && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-2">
            {interview.description}
          </p>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-3">
          {interview.status === 'scheduled' && isUpcoming && (
            <>
              {interview.meetingUrl && (
                <button className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-1">
                  <Video size={14} />
                  <span>Join Meeting</span>
                </button>
              )}
              <button className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
                Reschedule
              </button>
            </>
          )}
          
          {interview.status === 'completed' && (
            <button className="px-3 py-1 text-sm font-medium text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors flex items-center space-x-1">
              <CheckCircle size={14} />
              <span>View Feedback</span>
            </button>
          )}
          
          {needsFeedback && (
            <button className="px-3 py-1 text-sm font-medium text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors">
              Submit Feedback
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <MessageSquare size={16} />
          </button>
          <button className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
            View Details
          </button>
        </div>
      </div>
      
      {/* Audit Information */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <AuditInfo tableName="interviews" recordId={interview.id} className="text-xs" />
      </div>
    </div>
  );
};

export default InterviewCard;