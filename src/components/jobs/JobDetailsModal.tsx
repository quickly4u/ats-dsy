import React, { useEffect, useState } from 'react';
import { X, MapPin, DollarSign, Calendar, Users, Eye } from 'lucide-react';
import type { Job } from '../../types';
import { supabase } from '../../lib/supabase';
import SelectCandidatesModal from '../modals/SelectCandidatesModal';
import { getJobRequiredSkills } from '../../lib/jobSkillsApi';

interface JobDetailsModalProps {
  job?: Job;
  isOpen: boolean;
  onClose: () => void;
}

const formatSalary = (min?: number, max?: number) => {
  if (!min && !max) return 'Salary not specified';
  if (min && max) return `$${(min / 1000).toFixed(0)}K - $${(max / 1000).toFixed(0)}K`;
  if (min) return `From $${(min / 1000).toFixed(0)}K`;
  if (max) return `Up to $${(max / 1000).toFixed(0)}K`;
  return 'Salary not specified';
};

const formatDate = (date?: Date) => {
  if (!date) return 'Not specified';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ job, isOpen, onClose }) => {
  const [showSelectCandidates, setShowSelectCandidates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requiredSkills, setRequiredSkills] = useState<{ name: string; isMandatory: boolean; experienceLevel?: string }[]>([]);

  useEffect(() => {
    const loadSkills = async () => {
      if (!isOpen || !job?.id) return;
      try {
        const existing = await getJobRequiredSkills(job.id);
        setRequiredSkills(existing.map(s => ({
          name: s.skill_name,
          isMandatory: !!s.is_mandatory,
          experienceLevel: s.experience_level || undefined,
        })));
      } catch (e) {
        console.warn('Failed to load job skills for details view', e);
        setRequiredSkills([]);
      }
    };
    loadSkills();
  }, [isOpen, job?.id]);

  if (!isOpen || !job) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{job.title}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {job.client?.name || 'Direct Client'} • {job.department?.name}
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
                <MapPin size={18} className="mr-2 text-gray-400" />
                <span>
                  {job.location} • <span className="capitalize">{job.remoteType.replace('-', ' ')}</span>
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <DollarSign size={18} className="mr-2 text-gray-400" />
                <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <Calendar size={18} className="mr-2 text-gray-400" />
                <span>Posted {formatDate(job.publishedAt)}</span>
              </div>
            </div>

            {/* Screening Summary */}
            {(job.minExperienceYears != null || job.educationLevel) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                {job.minExperienceYears != null && (
                  <div>
                    <span className="text-gray-500">Minimum Experience:</span>{' '}
                    <span className="font-medium">{job.minExperienceYears} years</span>
                  </div>
                )}
                {job.educationLevel && (
                  <div>
                    <span className="text-gray-500">Education Level:</span>{' '}
                    <span className="font-medium capitalize">{job.educationLevel.replace('-', ' ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-2">Job Description</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">{job.description}</p>
            </div>

            {/* Responsibilities */}
            {job.responsibilities && (
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-2">Responsibilities</h3>
                <p className="text-sm text-gray-700 whitespace-pre-line">{job.responsibilities}</p>
              </div>
            )}

            {/* Requirements */}
            {job.requirements && (
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-2">Requirements</h3>
                <p className="text-sm text-gray-700 whitespace-pre-line">{job.requirements}</p>
              </div>
            )}

            {/* Team */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="text-sm text-gray-700">
                <span className="text-gray-500">External SPOC:</span>{' '}
                <span className="font-medium">
                  {job.externalSpoc?.firstName} {job.externalSpoc?.lastName}
                </span>
              </div>
              <div className="text-sm text-gray-700">
                <span className="text-gray-500">Internal SPOC:</span>{' '}
                <span className="font-medium">
                  {job.primaryInternalSpoc?.user.firstName} {job.primaryInternalSpoc?.user.lastName}
                </span>
              </div>
            </div>

            {/* Required Skills */}
            {requiredSkills.length > 0 && (
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-2">Required Skills</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {requiredSkills.map((s, idx) => (
                    <li key={idx}>
                      <span className={s.isMandatory ? 'font-semibold' : ''}>{s.name}</span>
                      {s.experienceLevel ? <span className="text-gray-500"> • {s.experienceLevel}</span> : null}
                      {s.isMandatory ? <span className="ml-2 text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded">Mandatory</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center space-x-6 text-sm text-gray-700">
              <div className="flex items-center">
                <Users size={16} className="mr-1" />
                <span>{job.applicationsCount} applications</span>
              </div>
              <div className="flex items-center">
                <Eye size={16} className="mr-1" />
                <span>{job.viewsCount} views</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSelectCandidates(true)}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Add Applicants
              </button>
            </div>
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Close
            </button>
          </div>
        </div>
      </div>
      <SelectCandidatesModal
        isOpen={showSelectCandidates}
        onClose={() => setShowSelectCandidates(false)}
        onConfirm={async (candidateIds: string[]) => {
          if (!job) return;
          const rows = candidateIds.map((cid) => ({
            job_id: job.id,
            candidate_id: cid,
            status: 'new',
            source: 'Manual',
            applied_at: new Date().toISOString(),
          }));
          try {
            setSubmitting(true);
            const { error } = await supabase.from('applications').insert(rows);
            if (error) throw error;
            alert('Added applicants to job successfully');
          } catch (e) {
            console.error('Failed to add applicants:', e);
            alert('Failed to add applicants');
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </>
  );
};

export default JobDetailsModal;
