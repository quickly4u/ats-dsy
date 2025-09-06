import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  User,
  Plus
} from 'lucide-react';
import { useApplications } from '../../hooks/useRecruitmentData';
import { supabase, getCurrentUserCompanyId } from '../../lib/supabase';
import type { Application, FilterOptions } from '../../types';
import ApplicationCard from './ApplicationCard';
import ApplicationPipeline from './ApplicationPipeline';
import ApplicationForm from '../forms/ApplicationForm';

const ApplicationsList: React.FC = () => {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('pipeline');
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [companyId, setCompanyId] = useState<string>('');
  
  const { applications, isLoading, error } = useApplications(filters);
  // Stages are fetched inside ApplicationPipeline and via explicit queries when needed.

  // Get company ID on component mount
  React.useEffect(() => {
    const getCompanyId = async () => {
      const id = await getCurrentUserCompanyId();
      if (id) setCompanyId(id);
    };
    getCompanyId();
  }, []);

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
  };

  const handleApplicationSelect = (applicationId: string, selected: boolean) => {
    const newSelected = new Set(selectedApplications);
    if (selected) {
      newSelected.add(applicationId);
    } else {
      newSelected.delete(applicationId);
    }
    setSelectedApplications(newSelected);
  };

  const handleSaveApplication = async (applicationData: Partial<Application>) => {
    try {
      const companyId = await getCurrentUserCompanyId();
      if (!companyId) {
        alert('Unable to determine your company. Please log in again.');
        return;
      }

      // Determine stage to use: selected by user or default "Applied"
      let stageIdToUse = (applicationData as any).stageId as string | undefined;
      if (!stageIdToUse) {
        const { data: defaultStage, error: stageError } = await supabase
          .from('custom_stages')
          .select('id')
          .eq('company_id', companyId)
          .eq('stage_type', 'application')
          .eq('is_default', true)
          .eq('is_active', true)
          .single();

        if (stageError || !defaultStage) {
          console.error('Error fetching default stage:', stageError);
          alert('Unable to find default application stage. Please contact support.');
          return;
        }
        stageIdToUse = defaultStage.id;
      }

      const { data, error } = await supabase
        .from('applications')
        .insert({
          job_id: (applicationData as any).jobId,
          candidate_id: (applicationData as any).candidateId,
          stage_id: stageIdToUse,
          status: applicationData.status || 'new',
          score: applicationData.score,
          rating: applicationData.rating,
          notes: applicationData.notes,
          cover_letter: (applicationData as any).coverLetter,
          applied_at: new Date().toISOString(),
          company_id: companyId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating application:', error);
        alert('Failed to create application. Please try again.');
        return;
      }

      console.log('Application created successfully:', data);
      alert('Application created successfully!');
      
      // Refresh the applications list
      window.location.reload();
    } catch (err) {
      console.error('Error saving application:', err);
      alert('Failed to create application. Please try again.');
    }
  };

  // Persist pipeline drag-and-drop moves to the backend
  const handleApplicationMove = async (applicationId: string, newStageName: string) => {
    try {
      const companyId = await getCurrentUserCompanyId();
      if (!companyId) return;

      // Find the target stage ID for this company by name
      const { data: stageRow, error: stageErr } = await supabase
        .from('custom_stages')
        .select('id')
        .eq('company_id', companyId)
        .eq('name', newStageName)
        .eq('is_active', true)
        .single();

      if (stageErr || !stageRow) {
        console.error('Failed finding stage by name', newStageName, stageErr);
        return;
      }

      // Update the application with the new stage_id
      const { error: updateErr } = await supabase
        .from('applications')
        .update({ stage_id: stageRow.id })
        .eq('id', applicationId)
        .eq('company_id', companyId);

      if (updateErr) {
        console.error('Failed updating application stage', updateErr);
        return;
      }

      // No hard reload; ApplicationPipeline already updated local UI optimistically.
      // If needed later, we can add a lightweight refetch hook here.
    } catch (e) {
      console.error('Unexpected error while moving application:', e);
    }
  };


  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading applications: {error}</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600 mt-1">
            Track candidates through your hiring pipeline
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
            <Download size={20} />
            <span>Export</span>
          </button>
          <button 
            onClick={() => setShowApplicationForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Plus size={20} />
            <span>Add Application</span>
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
              placeholder="Search applications by candidate name, job title..."
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
              onClick={() => setViewMode('pipeline')}
              className={`px-3 py-2 ${viewMode === 'pipeline' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
            >
              List
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
                  <option>New</option>
                  <option>In Progress</option>
                  <option>Interview</option>
                  <option>Offer</option>
                  <option>Hired</option>
                  <option>Rejected</option>
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
                  Department
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Departments</option>
                  <option>Engineering</option>
                  <option>Marketing</option>
                  <option>Design</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Sources</option>
                  <option>LinkedIn</option>
                  <option>Company Website</option>
                  <option>Referral</option>
                  <option>Job Board</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Time</option>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Applications Display */}
      {viewMode === 'pipeline' ? (
        <ApplicationPipeline 
          applications={applications} 
          isLoading={isLoading} 
          companyId={companyId}
          onApplicationMove={handleApplicationMove} 
        />
      ) : (
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
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))
          ) : (
            applications.map((application) => (
              <ApplicationCard 
                key={application.id} 
                application={application}
                isSelected={selectedApplications.has(application.id)}
                onSelect={(selected) => handleApplicationSelect(application.id, selected)}
              />
            ))
          )}
        </div>
      )}

      {applications.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Applications will appear here as candidates apply to your jobs.
          </p>
        </div>
      )}
    </div>

    {/* Application Form Modal */}
    <ApplicationForm
      isOpen={showApplicationForm}
      onClose={() => setShowApplicationForm(false)}
      onSave={handleSaveApplication}
    />
    </>
  );
};

export default ApplicationsList;