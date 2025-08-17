import React, { useState } from 'react';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter
} from 'lucide-react';
import { useJobs } from '../../hooks/useRecruitmentData';
import type { Job, FilterOptions } from '../../types';
import JobCard from './JobCard';
import JobForm from '../forms/JobForm';
import JobDetailsModal from './JobDetailsModal';

const JobsList: React.FC = () => {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | undefined>(undefined);
  const { jobs, isLoading, error } = useJobs(filters);

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
  };

  const handleSaveJob = (jobData: Partial<Job>) => {
    console.log('Saving job:', jobData);
    // In real app, this would call an API
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading jobs: {error}</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-600 mt-1">
            Manage job postings and requirements
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => { setSelectedJob(undefined); setShowJobForm(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Post Job</span>
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
              placeholder="Search jobs by title, department, or location..."
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

      {/* Jobs List */}
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
          jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onEdit={() => { setSelectedJob(job); setShowJobForm(true); }}
              onView={() => { setSelectedJob(job); setShowJobDetails(true); }}
            />
          ))
        )}
      </div>

      {jobs.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by posting your first job.
          </p>
        </div>
      )}
    </div>

    {/* Job Details Modal */}
    <JobDetailsModal
      job={selectedJob}
      isOpen={showJobDetails}
      onClose={() => setShowJobDetails(false)}
    />

    {/* Job Form Modal */}
    <JobForm
      job={selectedJob}
      isOpen={showJobForm}
      onClose={() => setShowJobForm(false)}
      onSave={handleSaveJob}
    />
    </>
  );
};

export default JobsList;