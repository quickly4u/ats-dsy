import React, { useState } from 'react';
import { 
  Calendar,
  Clock,
  Video,
  MapPin,
  Plus,
  Search,
  Filter,
  Users,
  CheckCircle,
  XCircle,
  MoreVertical
} from 'lucide-react';
import { useInterviews } from '../../hooks/useRecruitmentData';
import type { Interview, FilterOptions } from '../../types';
import InterviewCard from './InterviewCard';
import InterviewForm from '../forms/InterviewForm';

const InterviewsList: React.FC = () => {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const { interviews, isLoading, error } = useInterviews(filters);

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
  };

  const handleSaveInterview = (interviewData: Partial<Interview>) => {
    console.log('Saving interview:', interviewData);
    // In real app, this would call an API
  };

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

  const upcomingInterviews = interviews.filter(interview => 
    interview.status === 'scheduled' && 
    new Date(interview.scheduledAt) > new Date()
  );

  const todayInterviews = interviews.filter(interview => {
    const today = new Date();
    const interviewDate = new Date(interview.scheduledAt);
    return interviewDate.toDateString() === today.toDateString();
  });

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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
          <p className="text-gray-600 mt-1">
            Schedule and manage interview processes
          </p>
        </div>
        <button 
          onClick={() => setShowInterviewForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Schedule Interview</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Interviews</p>
              <p className="text-2xl font-bold text-gray-900">{todayInterviews.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingInterviews.length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {interviews.filter(i => i.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Feedback Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {interviews.filter(i => i.status === 'completed' && !i.feedback?.length).length}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
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
              placeholder="Search interviews by candidate, job, or interviewer..."
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
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 ${viewMode === 'calendar' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
            >
              Calendar
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Status</option>
                  <option>Scheduled</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Type
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Types</option>
                  <option>Phone Screen</option>
                  <option>Technical</option>
                  <option>Panel</option>
                  <option>Final</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Jobs</option>
                  <option>Senior Software Engineer</option>
                  <option>Product Marketing Manager</option>
                  <option>UX Designer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interviewer
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Interviewers</option>
                  <option>John Doe</option>
                  <option>Jane Smith</option>
                  <option>Mike Johnson</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Time</option>
                  <option>Today</option>
                  <option>This Week</option>
                  <option>Next Week</option>
                  <option>This Month</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Today's Interviews Section */}
      {todayInterviews.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Interviews</h2>
          <div className="space-y-4">
            {todayInterviews.map((interview) => (
              <InterviewCard key={interview.id} interview={interview} isToday={true} />
            ))}
          </div>
        </div>
      )}

      {/* All Interviews */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Interviews</h2>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map((interview) => (
              <InterviewCard key={interview.id} interview={interview} />
            ))}
          </div>
        )}
      </div>

      {interviews.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No interviews scheduled</h3>
          <p className="mt-1 text-sm text-gray-500">
            Schedule your first interview to get started.
          </p>
          <div className="mt-6">
            <button 
              onClick={() => setShowInterviewForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Schedule Interview
            </button>
          </div>
        </div>
      )}
    </div>
  );

      {/* Interview Form Modal */}
      <InterviewForm
        isOpen={showInterviewForm}
        onClose={() => setShowInterviewForm(false)}
        onSave={handleSaveInterview}
      />
    </div>
  );
};

export default InterviewsList;