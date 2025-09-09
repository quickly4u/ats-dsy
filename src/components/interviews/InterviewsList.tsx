import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter,
  Clock,
  MapPin,
  User,
  Video,
  Eye,
  Edit,
  MoreVertical
} from 'lucide-react';
import { useInterviews } from '../../hooks/useRecruitmentData';
import type { FilterOptions } from '../../types';
import InterviewForm from '../forms/InterviewForm';

const InterviewsList: React.FC = () => {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const { interviews, isLoading, error, createInterview, refetch } = useInterviews(filters);

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
  };

  const handleSaveInterview = async (interviewData: any) => {
    const result = await createInterview(interviewData);
    await refetch();
    return result;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading interviews: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
          <p className="text-gray-600 mt-1">
            Schedule and manage candidate interviews
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowInterviewForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Schedule Interview</span>
          </button>
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
              placeholder="Search interviews by candidate name or job title..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={(e) => handleSearch(e.target.value)}
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
      </div>

      {/* Interviews List */}
      <div className="space-y-4">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))
        ) : (
          interviews.map((interview) => (
            <div key={interview.id} className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{interview.title}</h3>
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {interview.status}
                      </span>
                    </div>
                    
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <User size={16} className="mr-2 text-gray-400" />
                        <span>
                          {interview.application.candidate.firstName} {interview.application.candidate.lastName}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{interview.application.job.title}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock size={16} className="mr-2 text-gray-400" />
                        <span>{formatDate(interview.scheduledAt)}</span>
                        <span className="mx-2">•</span>
                        <span>{interview.durationMinutes} minutes</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        {interview.location && interview.location.includes('Video') ? (
                          <Video size={16} className="mr-2 text-gray-400" />
                        ) : (
                          <MapPin size={16} className="mr-2 text-gray-400" />
                        )}
                        <span>{interview.location || 'No location specified'}</span>
                      </div>
                    </div>
                    
                    {interview.description && (
                      <p className="text-sm text-gray-600 mb-3">{interview.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Eye size={16} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <Edit size={16} />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {interviews.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No interviews scheduled</h3>
          <p className="mt-1 text-sm text-gray-500">
            Schedule your first interview to get started.
          </p>
        </div>
      )}
    </div>

    {/* Interview Form Modal */}
    <InterviewForm
      isOpen={showInterviewForm}
      onClose={() => setShowInterviewForm(false)}
      onSave={handleSaveInterview}
    />
    </>
  );
};

export default InterviewsList;