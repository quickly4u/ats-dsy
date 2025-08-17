import React from 'react';
import { 
  UserPlus, 
  Calendar, 
  FileText, 
  CheckCircle, 
  Clock 
} from 'lucide-react';
import { useRecentActivity } from '../../hooks/useRecruitmentData';

// ActivityItem interface removed - now using real data from Supabase

const getActivityIcon = (type: string, priority: string = 'medium') => {
  const iconProps = {
    size: 20,
    className: `${
      priority === 'high' 
        ? 'text-red-500' 
        : priority === 'low' 
        ? 'text-gray-400' 
        : 'text-blue-500'
    }`
  };

  switch (type) {
    case 'application':
      return <UserPlus {...iconProps} />;
    case 'interview':
      return <Calendar {...iconProps} />;
    case 'hire':
      return <CheckCircle {...iconProps} />;
    case 'document':
      return <FileText {...iconProps} />;
    default:
      return <Clock {...iconProps} />;
  }
};

const formatTimestamp = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
};

const RecentActivity: React.FC = () => {
  const { activities, isLoading, error } = useRecentActivity();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Activity
      </h3>
      
      <div className="space-y-4">
        {activities.map((activity: any) => (
          <div 
            key={activity.id} 
            className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              {getActivityIcon(activity.type, activity.priority)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">
                  {activity.title}
                </p>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(activity.timestamp)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {activity.description}
              </p>
              {activity.priority === 'high' && (
                <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  High Priority
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
          View All Activities →
        </button>
      </div>
    </div>
  );
};

export default RecentActivity;