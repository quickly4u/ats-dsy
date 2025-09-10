import React, { useState, useEffect } from 'react';
import { 
  User, 
  Plus, 
  Search, 
  Filter,
  Mail,
  Phone,
  MapPin,
  Eye,
  Edit,
  MoreVertical,
  FileText
} from 'lucide-react';
import { useCandidates } from '../../hooks/useRecruitmentData';
import { supabase, getCurrentUserCompanyId } from '../../lib/supabase';
import type { Candidate, FilterOptions } from '../../types';
import CandidateForm from '../forms/CandidateForm';
import CandidateDetailsModal from './CandidateDetailsModal';
import CandidateFileManager from './CandidateFileManager';

const CandidatesList: React.FC = () => {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const { candidates, isLoading, error } = useCandidates(filters);
  const [showCandidateDetails, setShowCandidateDetails] = useState(false);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | undefined>(undefined);
  const [showFileManager, setShowFileManager] = useState(false);
  const [fileManagerCandidate, setFileManagerCandidate] = useState<Candidate | undefined>(undefined);
  const [userCompanyId, setUserCompanyId] = useState<string>('');

  useEffect(() => {
    const fetchCompanyId = async () => {
      const companyId = await getCurrentUserCompanyId();
      if (companyId) {
        setUserCompanyId(companyId);
      }
    };
    fetchCompanyId();
  }, []);

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
  };

  const handleSaveCandidate = async (candidateData: Partial<Candidate>) => {
    try {
      const companyId = await getCurrentUserCompanyId();
      if (!companyId) throw new Error('User company not found');

      const { experiences = [], skills = [], ...rest } = candidateData;

      // Insert candidate
      const candidateRow: any = {
        email: rest.email,
        first_name: rest.firstName,
        last_name: rest.lastName,
        phone: rest.phone ?? null,
        location: rest.location ?? null,
        linkedin_url: rest.linkedinUrl ?? null,
        portfolio_url: rest.portfolioUrl ?? null,
        current_company: rest.currentCompany ?? null,
        current_title: rest.currentTitle ?? null,
        experience_years: typeof rest.experienceYears === 'number' ? rest.experienceYears : null,
        summary: rest.summary ?? null,
        avatar: rest.avatar ?? null,
        resume_url: rest.resumeUrl ?? null,
        source: rest.source ?? 'manual',
        rating: rest.rating ?? null,
        is_blacklisted: rest.isBlacklisted ?? false,
        gdpr_consent: rest.gdprConsent ?? false,
        company_id: companyId,
      };

      const { data: insertedCandidates, error: insertCandidateError } = await supabase
        .from('candidates')
        .insert(candidateRow)
        .select('id')
        .limit(1);

      if (insertCandidateError) throw insertCandidateError;
      const candidateId = insertedCandidates?.[0]?.id as string | undefined;
      if (!candidateId) throw new Error('Failed to create candidate');

      // Insert skills
      if (skills.length > 0) {
        const skillRows = skills.map((skill) => ({ candidate_id: candidateId, skill }));
        const { error: skillsError } = await supabase.from('candidate_skills').insert(skillRows);
        if (skillsError) throw skillsError;
      }

      // Insert experiences
      if (experiences.length > 0) {
        const expRows = experiences.map((exp) => ({
          candidate_id: candidateId,
          company: exp.company || '',
          title: exp.title || '',
          location: exp.location ?? null,
          start_date: exp.startDate ?? null,
          end_date: exp.endDate ?? null,
          description: exp.description ?? null,
          company_id: companyId,
        }));
        const { error: expError } = await supabase.from('candidate_experiences').insert(expRows);
        if (expError) throw expError;
      }

      // Close form and refresh list
      setShowCandidateForm(false);
      setFilters(prev => ({ ...prev }));
    } catch (err) {
      console.error('Failed to save candidate:', err);
      alert('Failed to save candidate');
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading candidates: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="p-6">
      {/* Header actions moved into toolbar below */}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex-1 relative">
            <Search 
              size={20} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            />
            <input
              type="text"
              placeholder="Search candidates by name, email, or skills..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <Filter size={18} />
              <span>Filters</span>
            </button>
            <button 
              onClick={() => setShowCandidateForm(true)}
              className="bg-blue-600 text-white px-3 py-2 text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus size={18} />
              <span>Add Candidate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
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
          candidates.map((candidate) => (
            <div key={candidate.id} className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {candidate.avatar ? (
                    <img
                      src={candidate.avatar}
                      alt={`${candidate.firstName} ${candidate.lastName}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {candidate.firstName} {candidate.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{candidate.currentTitle}</p>
                  </div>
                </div>
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                  <MoreVertical size={16} />
                </button>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail size={16} className="mr-2 text-gray-400" />
                  <span>{candidate.email}</span>
                </div>
                {candidate.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone size={16} className="mr-2 text-gray-400" />
                    <span>{candidate.phone}</span>
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin size={16} className="mr-2 text-gray-400" />
                  <span>{candidate.location}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <button
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    onClick={() => { setActiveCandidate(candidate); setShowCandidateDetails(true); }}
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                  <button 
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Edit Candidate"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    onClick={() => { setFileManagerCandidate(candidate); setShowFileManager(true); }}
                    title="Manage Files"
                  >
                    <FileText size={16} />
                  </button>
                </div>
                
                <button
                  className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  onClick={() => { setActiveCandidate(candidate); setShowCandidateDetails(true); }}
                >
                  View Profile
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {candidates.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No candidates found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first candidate.
          </p>
        </div>
      )}
    </div>

    {/* Candidate Details Modal */}
    <CandidateDetailsModal
      isOpen={showCandidateDetails}
      candidate={activeCandidate}
      onClose={() => { setShowCandidateDetails(false); setActiveCandidate(undefined); }}
    />

    {/* Candidate Form Modal */}
    <CandidateForm
      isOpen={showCandidateForm}
      onClose={() => setShowCandidateForm(false)}
      onSave={handleSaveCandidate}
    />

    {/* File Manager Modal */}
    {fileManagerCandidate && (
      <CandidateFileManager
        candidateId={fileManagerCandidate.id}
        companyId={userCompanyId}
        isOpen={showFileManager}
        onClose={() => { setShowFileManager(false); setFileManagerCandidate(undefined); }}
      />
    )}
    </>
  );
};

export default CandidatesList;