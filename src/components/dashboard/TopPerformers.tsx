import React from 'react';
import { Award, TrendingUp, Users } from 'lucide-react';
import { useTeamMembers } from '../../hooks/useRecruitmentData';

const TopPerformers: React.FC = () => {
  const { teamMembers, isLoading, error } = useTeamMembers();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
          <Award className="text-yellow-500" size={20} />
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
          <Award className="text-yellow-500" size={20} />
        </div>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  // Take first 3 team members as top performers
  const topPerformers = teamMembers.slice(0, 3);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Top Performers
        </h3>
        <Award className="text-yellow-500" size={20} />
      </div>
      
      <div className="space-y-4">
        {topPerformers.map((performer: any, index: number) => (
          <div 
            key={performer.id} 
            className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0 relative">
              <img
                src={performer.avatar || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2'}
                alt={`${performer.firstName} ${performer.lastName}`}
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
                    {`${performer.firstName} ${performer.lastName}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {performer.role}
                  </p>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <span className="text-lg font-bold text-gray-900">
                      {Math.floor(Math.random() * 20) + 5}
                    </span>
                    <div className="flex items-center text-green-600">
                      <TrendingUp 
                        size={14} 
                        className="text-green-500" 
                      />
                      <span className="text-xs font-medium ml-1">
                        {Math.floor(Math.random() * 30) + 5}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Performance Score
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