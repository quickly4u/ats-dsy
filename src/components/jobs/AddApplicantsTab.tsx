import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  UserPlus, 
  Brain,
  Briefcase,
  MapPin,
  Star,
  X,
  Eye
} from 'lucide-react';
import { useCandidates } from '../../hooks/useRecruitmentData';
import { supabase, getCurrentUserCompanyId } from '../../lib/supabase';
import CandidateProfileModal from '../candidates/CandidateProfileModal';
import type { Candidate, Job } from '../../types';

interface AddApplicantsTabProps {
  job: Job;
  onApplicationCreated?: () => void;
}

interface Filters {
  search: string;
  skills: string[];
  minExperience: number;
  maxExperience: number;
  location: string;
}

const AddApplicantsTab: React.FC<AddApplicantsTabProps> = ({ job, onApplicationCreated }) => {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    skills: [],
    minExperience: 0,
    maxExperience: 50,
    location: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  
  const { candidates, isLoading } = useCandidates();

  // Filter candidates based on criteria
  const filteredCandidates = candidates.filter(candidate => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const fullName = `${candidate.firstName} ${candidate.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchLower) || 
                           candidate.email.toLowerCase().includes(searchLower) ||
                           candidate.skills.some(s => s.toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;
    }

    // Skills filter
    if (filters.skills.length > 0) {
      const hasAllSkills = filters.skills.every(filterSkill => 
        candidate.skills.some(candidateSkill => 
          candidateSkill.toLowerCase().includes(filterSkill.toLowerCase())
        )
      );
      if (!hasAllSkills) return false;
    }

    // Experience filter
    if (candidate.experienceYears !== undefined) {
      if (candidate.experienceYears < filters.minExperience || 
          candidate.experienceYears > filters.maxExperience) {
        return false;
      }
    }

    // Location filter
    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      const candidateLocation = (candidate.location || candidate.city || '').toLowerCase();
      if (!candidateLocation.includes(locationLower)) return false;
    }

    return true;
  });

  const handleApplyToJob = async (candidate: Candidate) => {
    try {
      setSubmitting(candidate.id);
      
      const companyId = await getCurrentUserCompanyId();
      if (!companyId) throw new Error('Company ID not found');

      const { error } = await supabase.from('applications').insert({
        job_id: job.id,
        candidate_id: candidate.id,
        status: 'new',
        source: 'Manual',
        applied_at: new Date().toISOString(),
        company_id: companyId
      });

      if (error) throw error;

      alert(`${candidate.firstName} ${candidate.lastName} has been applied to ${job.title}`);
      onApplicationCreated?.();
    } catch (error) {
      console.error('Failed to apply candidate:', error);
      alert('Failed to apply candidate to job');
    } finally {
      setSubmitting(null);
    }
  };

  const handleEvaluate = async (candidate: Candidate) => {
    try {
      setEvaluating(candidate.id);

      // Prepare candidate data
      const candidateData = {
        id: candidate.id,
        email: candidate.email,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        phone: candidate.phone,
        location: candidate.location,
        city: candidate.city,
        state: candidate.state,
        linkedinUrl: candidate.linkedinUrl,
        portfolioUrl: candidate.portfolioUrl,
        currentCompany: candidate.currentCompany,
        currentTitle: candidate.currentTitle,
        experienceYears: candidate.experienceYears,
        skills: candidate.skills,
        experiences: candidate.experiences,
        summary: candidate.summary,
        resumeUrl: candidate.resumeUrl,
        source: candidate.source,
        rating: candidate.rating
      };

      // Prepare job data
      const jobData = {
        id: job.id,
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        responsibilities: job.responsibilities,
        employmentType: job.employmentType,
        experienceLevel: job.experienceLevel,
        location: job.location,
        remoteType: job.remoteType,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        status: job.status
      };

      // Send to webhook
      const response = await fetch('https://n8n.srv1025472.hstgr.cloud/webhook/63163493-b695-4634-b382-fa6991dc2c8e', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate: candidateData,
          job: jobData,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}`);
      }

      alert(`Evaluation request sent for ${candidate.firstName} ${candidate.lastName}`);
    } catch (error) {
      console.error('Failed to send evaluation:', error);
      alert('Failed to send evaluation request');
    } finally {
      setEvaluating(null);
    }
  };

  const addSkillFilter = () => {
    if (skillInput.trim() && !filters.skills.includes(skillInput.trim())) {
      setFilters(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkillFilter = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      skills: [],
      minExperience: 0,
      maxExperience: 50,
      location: ''
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search candidates by name, email, or skills..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
            showFilters ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-5 h-5" />
          Filters
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Skills Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add skill..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkillFilter()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addSkillFilter}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              {filters.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.skills.map(skill => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {skill}
                      <button onClick={() => removeSkillFilter(skill)}>
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                placeholder="Enter location..."
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Experience Range */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience: {filters.minExperience} - {filters.maxExperience}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={filters.minExperience}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    minExperience: Math.min(Number(e.target.value), prev.maxExperience) 
                  }))}
                  className="flex-1"
                />
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={filters.maxExperience}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    maxExperience: Math.max(Number(e.target.value), prev.minExperience) 
                  }))}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredCandidates.length} of {candidates.length} candidates
      </div>

      {/* Candidates List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No candidates found matching your criteria
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCandidates.map(candidate => (
            <div
              key={candidate.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {candidate.avatar ? (
                      <img
                        src={candidate.avatar}
                        alt={`${candidate.firstName} ${candidate.lastName}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-lg">
                          {candidate.firstName[0]}{candidate.lastName[0]}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {candidate.firstName} {candidate.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{candidate.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    {candidate.currentTitle && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Briefcase className="w-4 h-4" />
                        <span>{candidate.currentTitle}</span>
                        {candidate.currentCompany && <span>at {candidate.currentCompany}</span>}
                      </div>
                    )}
                    {candidate.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{candidate.location}</span>
                      </div>
                    )}
                    {candidate.experienceYears !== undefined && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Star className="w-4 h-4" />
                        <span>{candidate.experienceYears} years experience</span>
                      </div>
                    )}
                  </div>

                  {candidate.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.slice(0, 5).map(skill => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                      {candidate.skills.length > 5 && (
                        <span className="px-2 py-1 text-gray-500 text-xs">
                          +{candidate.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => setSelectedCandidate(candidate)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4" />
                    View Profile
                  </button>
                  <button
                    onClick={() => handleApplyToJob(candidate)}
                    disabled={submitting === candidate.id}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                  >
                    <UserPlus className="w-4 h-4" />
                    {submitting === candidate.id ? 'Applying...' : 'Apply to Job'}
                  </button>
                  <button
                    onClick={() => handleEvaluate(candidate)}
                    disabled={evaluating === candidate.id}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                  >
                    <Brain className="w-4 h-4" />
                    {evaluating === candidate.id ? 'Evaluating...' : 'Evaluate'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Candidate Profile Modal */}
      <CandidateProfileModal
        candidate={selectedCandidate || undefined}
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    </div>
  );
};

export default AddApplicantsTab;
