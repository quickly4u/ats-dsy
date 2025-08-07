import React from 'react';
import { 
  UserPlus, 
  Calendar, 
  FileText, 
  CheckCircle, 
  Clock 
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'application' | 'interview' | 'hire' | 'document';
  title: string;
  description: string;
  timestamp: Date;
  user?: string;
  priority?: 'low' | 'medium' | 'high';
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'application',
    title: 'New Application',
    description: 'Sarah Johnson applied for Senior Software Engineer',
    timestamp: new Date(Date.now() - 30 * 60000), // 30 minutes ago
    user: 'Sarah Johnson',
    priority: 'high',
  },
  {
    id: '2',
    type: 'interview',
    title: 'Interview Scheduled',
    description: 'Technical interview with Michael Chen at 2:00 PM',
    timestamp: new Date(Date.now() - 2 * 3600000), // 2 hours ago
    user: 'Michael Chen',
    priority: 'medium',
  },
  {
    id: '3',
    type: 'hire',
    title: 'Offer Accepted',
    description: 'Emily Davis accepted UX Designer position',
    timestamp: new Date(Date.now() - 4 * 3600000), // 4 hours ago
    user: 'Emily Davis',
    priority: 'high',
  },
  {
    id: '4',
    type: 'document',
    title: 'Document Uploaded',
    description: 'Resume uploaded by Alex Thompson',
    timestamp: new Date(Date.now() - 6 * 3600000), // 6 hours ago
    user: 'Alex Thompson',
    priority: 'low',
  },
];

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
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Activity
      </h3>
      
      <div className="space-y-4">
        {mockActivities.map((activity) => (
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