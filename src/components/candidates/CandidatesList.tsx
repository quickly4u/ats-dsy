import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Star,
  MapPin,
  Briefcase,
  Mail,
  Phone
} from 'lucide-react';
import { useCandidates } from '../../hooks/useRecruitmentData';
import type { Candidate, FilterOptions } from '../../types';
import CandidateCard from './CandidateCard';
import CandidateForm from '../forms/CandidateForm';

const CandidatesList: React.FC = () => {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const { candidates, isLoading, error } = useCandidates(filters);

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
  };

  const handleCandidateSelect = (candidateId: string, selected: boolean) => {
    const newSelected = new Set(selectedCandidates);
    if (selected) {
      newSelected.add(candidateId);
    } else {
      newSelected.delete(candidateId);
    }
    setSelectedCandidates(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCandidates.size === candidates.length) {
      setSelectedCandidates(new Set());
    } else {
      setSelectedCandidates(new Set(candidates.map(c => c.id)));
    }
  };

  const handleSaveCandidate = (candidateData: Partial<Candidate>) => {
    console.log('Saving candidate:', candidateData);
    // In real app, this would call an API
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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Talent Pool</h1>
          <p className="text-gray-600 mt-1">
            Discover and manage your candidate database
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
            <Download size={20} />
            <span>Export</span>
          </button>
          <button 
            onClick={() => setShowCandidateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Candidate</span>
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
              placeholder="Search candidates by name, skills, experience..."
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
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
            >
              List
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedCandidates.size > 0 && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg mb-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedCandidates.size} candidate(s) selected
            </span>
            <div className="flex items-center space-x-3">
              <button className="text-sm font-medium text-blue-600 hover:text-blue-800">
                Add to Job
              </button>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-800">
                Export Selected
              </button>
              <button className="text-sm font-medium text-red-600 hover:text-red-800">
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Filter Panel */}
        {showFilters && (
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Levels</option>
                  <option>Entry Level</option>
                  <option>Mid Level</option>
                  <option>Senior Level</option>
                  <option>Executive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Locations</option>
                  <option>San Francisco</option>
                  <option>New York</option>
                  <option>Austin</option>
                  <option>Remote</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Skills</option>
                  <option>JavaScript</option>
                  <option>React</option>
                  <option>Python</option>
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
                  <option>Referral</option>
                  <option>Company Website</option>
                  <option>Job Boards</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Ratings</option>
                  <option>5 Stars</option>
                  <option>4+ Stars</option>
                  <option>3+ Stars</option>
                  <option>Unrated</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Candidates Display */}
      {isLoading ? (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
          {candidates.map((candidate) => (
            <CandidateCard 
              key={candidate.id} 
              candidate={candidate}
              viewMode={viewMode}
              isSelected={selectedCandidates.has(candidate.id)}
              onSelect={(selected) => handleCandidateSelect(candidate.id, selected)}
            />
          ))}
        </div>
      )}

      {candidates.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No candidates found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start building your talent pool by adding candidates.
          </p>
          <div className="mt-6">
            <button 
              onClick={() => setShowCandidateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Candidate
            </button>
          </div>
        </div>
      )}
    </div>
  );

      {/* Candidate Form Modal */}
      <CandidateForm
        isOpen={showCandidateForm}
        onClose={() => setShowCandidateForm(false)}
        onSave={handleSaveCandidate}
      />
    </div>
  );
};

export default CandidatesList;