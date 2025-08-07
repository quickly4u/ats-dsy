import React from 'react';
import { Plus, MoreVertical } from 'lucide-react';
import type { Application } from '../../types';

interface ApplicationPipelineProps {
  applications: Application[];
  isLoading: boolean;
}

const ApplicationPipeline: React.FC<ApplicationPipelineProps> = ({ applications, isLoading }) => {
  // Mock pipeline stages
  const stages = [
    { id: '1', name: 'Applied', color: 'bg-blue-500' },
    { id: '2', name: 'Screening', color: 'bg-yellow-500' },
    { id: '3', name: 'Interview', color: 'bg-purple-500' },
    { id: '4', name: 'Assessment', color: 'bg-orange-500' },
    { id: '5', name: 'Final Review', color: 'bg-indigo-500' },
    { id: '6', name: 'Offer', color: 'bg-green-500' },
  ];

  // Group applications by stage
  const applicationsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = applications.filter(app => app.currentStage.name === stage.name);
    return acc;
  }, {} as Record<string, Application[]>);

  const ApplicationCard: React.FC<{ application: Application }> = ({ application }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-3">
          <img
            src={application.candidate.avatar || `https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2`}
            alt={`${application.candidate.firstName} ${application.candidate.lastName}`}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              {application.candidate.firstName} {application.candidate.lastName}
            </h4>
            <p className="text-xs text-gray-500">
              {application.job.title}
            </p>
          </div>
        </div>
        <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
          <MoreVertical size={14} />
        </button>
      </div>
      
      <div className="text-xs text-gray-500 mb-2">
        Applied {new Intl.DateTimeFormat('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }).format(application.appliedAt)}
      </div>
      
      {application.candidate.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {application.candidate.skills.slice(0, 2).map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
            >
              {skill}
            </span>
          ))}
          {application.candidate.skills.length > 2 && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              +{application.candidate.skills.length - 2}
            </span>
          )}
        </div>
      )}
      
      {application.score && (
        <div className="mt-2 text-xs">
          <span className="text-gray-500">Score: </span>
          <span className="font-medium text-gray-900">{application.score}/100</span>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {stages.map((stage) => (
          <div key={stage.id} className="bg-gray-50 rounded-lg p-4">
            <div className="h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 mb-3 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
      {stages.map((stage) => {
        const stageApplications = applicationsByStage[stage.id] || [];
        
        return (
          <div key={stage.id} className="bg-gray-50 rounded-lg p-4 min-h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                <h3 className="font-medium text-gray-900">{stage.name}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
                  {stageApplications.length}
                </span>
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                  <Plus size={16} />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {stageApplications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
            
            {stageApplications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No applications</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ApplicationPipeline;