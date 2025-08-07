import React from 'react';
import { Award, TrendingUp, Users } from 'lucide-react';

interface Performer {
  id: string;
  name: string;
  role: string;
  avatar: string;
  metric: string;
  value: number;
  change: number;
  changeType: 'positive' | 'negative';
}

const mockPerformers: Performer[] = [
  {
    id: '1',
    name: 'Sarah Connor',
    role: 'Senior Recruiter',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
    metric: 'Hires This Month',
    value: 12,
    change: 25,
    changeType: 'positive',
  },
  {
    id: '2',
    name: 'Mike Johnson',
    role: 'HR Manager',
    avatar: 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
    metric: 'Interview Completion Rate',
    value: 94,
    change: 8,
    changeType: 'positive',
  },
  {
    id: '3',
    name: 'Lisa Wong',
    role: 'Talent Acquisition',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
    metric: 'Time to Fill (days)',
    value: 14,
    change: -15,
    changeType: 'positive',
  },
];

const TopPerformers: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Top Performers
        </h3>
        <Award className="text-yellow-500" size={20} />
      </div>
      
      <div className="space-y-4">
        {mockPerformers.map((performer, index) => (
          <div 
            key={performer.id} 
            className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0 relative">
              <img
                src={performer.avatar}
                alt={performer.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              {index === 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">1</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {performer.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {performer.role}
                  </p>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <span className="text-lg font-bold text-gray-900">
                      {performer.value}
                      {performer.metric.includes('Rate') ? '%' : ''}
                    </span>
                    <div className={`flex items-center ${
                      performer.changeType === 'positive' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      <TrendingUp 
                        size={14} 
                        className={
                          performer.changeType === 'positive' 
                            ? 'text-green-500' 
                            : 'text-red-500 transform rotate-180'
                        } 
                      />
                      <span className="text-xs font-medium ml-1">
                        {Math.abs(performer.change)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {performer.metric}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1">
          <Users size={16} />
          <span>View Team Performance</span>
        </button>
      </div>
    </div>
  );
};

export default TopPerformers;