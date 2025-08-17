import React, { useState } from 'react';
import { X, Mail, Phone, MapPin, LinkedinIcon, ExternalLink, Star, Briefcase } from 'lucide-react';
import type { Candidate } from '../../types';
import { supabase } from '../../lib/supabase';
import SelectJobsModal from '../modals/SelectJobsModal';

interface CandidateDetailsModalProps {
  candidate?: Candidate;
  isOpen: boolean;
  onClose: () => void;
}

const CandidateDetailsModal: React.FC<CandidateDetailsModalProps> = ({ candidate, isOpen, onClose }) => {
  const [showSelectJobs, setShowSelectJobs] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !candidate) return null;

  const renderStars = (rating?: number) => {
    const stars = [];
    const filled = rating || 0;
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star key={i} size={16} className={`${i <= filled ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
      );
    }
    return <div className="flex items-center space-x-1">{stars}</div>;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {candidate.firstName} {candidate.lastName}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {candidate.currentTitle || 'Candidate'}
                {candidate.currentCompany ? ` • ${candidate.currentCompany}` : ''}
              </p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center text-sm text-gray-700">
                <Mail size={18} className="mr-2 text-gray-400" />
                <span className="truncate">{candidate.email}</span>
              </div>
              {candidate.phone && (
                <div className="flex items-center text-sm text-gray-700">
                  <Phone size={18} className="mr-2 text-gray-400" />
                  <span>{candidate.phone}</span>
                </div>
              )}
              {candidate.location && (
                <div className="flex items-center text-sm text-gray-700">
                  <MapPin size={18} className="mr-2 text-gray-400" />
                  <span>{candidate.location}</span>
                </div>
              )}
            </div>

            {/* Rating & Experience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center text-sm text-gray-700">
                {renderStars(candidate.rating)}
              </div>
              {candidate.experienceYears != null && (
                <div className="flex items-center text-sm text-gray-700">
                  <Briefcase size={18} className="mr-2 text-gray-400" />
                  <span>{candidate.experienceYears}+ years experience</span>
                </div>
              )}
            </div>

            {/* Skills */}
            {candidate.skills?.length > 0 && (
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-2">Top Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((s, i) => (
                    <span key={i} className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            <div className="flex items-center gap-3">
              {candidate.linkedinUrl && (
                <a href={candidate.linkedinUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  <LinkedinIcon size={16} className="mr-2" /> LinkedIn
                </a>
              )}
              {candidate.portfolioUrl && (
                <a href={candidate.portfolioUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  <ExternalLink size={16} className="mr-2" /> Portfolio
                </a>
              )}
              {candidate.resumeUrl && (
                <a href={candidate.resumeUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  <ExternalLink size={16} className="mr-2" /> Resume
                </a>
              )}
            </div>

            {/* Summary */}
            {candidate.summary && (
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-2">Summary</h3>
                <p className="text-sm text-gray-700 whitespace-pre-line">{candidate.summary}</p>
              </div>
            )}

            {/* Tags */}
            {candidate.tags?.length > 0 && (
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.tags.map((t, i) => (
                    <span key={i} className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSelectJobs(true)}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Apply to Jobs
              </button>
            </div>
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Close
            </button>
          </div>
        </div>
      </div>

      <SelectJobsModal
        isOpen={showSelectJobs}
        onClose={() => setShowSelectJobs(false)}
        onConfirm={async (jobIds: string[]) => {
          if (!candidate) return;
          const rows = jobIds.map((jid) => ({
            job_id: jid,
            candidate_id: candidate.id,
            status: 'new',
            source: 'Manual',
            applied_at: new Date().toISOString(),
          }));
          try {
            setSubmitting(true);
            const { error } = await supabase.from('applications').insert(rows);
            if (error) throw error;
            alert('Applied candidate to selected jobs');
          } catch (e) {
            console.error('Failed to apply to jobs:', e);
            alert('Failed to apply to selected jobs');
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </>
  );
};

export default CandidateDetailsModal;
