import React, { useState } from 'react';
import { 
  X, 
  Save, 
  FileText, 
  Upload,
  Plus,
  Trash2
} from 'lucide-react';
import type { Application } from '../../types';
import { useJobs, useCandidates, useStages } from '../../hooks/useRecruitmentData';

type FormData = {
  jobId: string;
  candidateId: string;
  stageId: string;
  status: 'new' | 'in-progress' | 'rejected' | 'hired' | 'withdrawn';
  coverLetter: string;
  score: string;
  rating: string;
  notes: string;
  tags: string[];
  customResponses: { question: string; answer: string }[];
};

interface ApplicationFormProps {
  application?: Application;
  isOpen: boolean;
  onClose: () => void;
  onSave: (applicationData: Partial<Application>) => void;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({ 
  application, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState<FormData>({
    jobId: application?.job?.id || '',
    candidateId: application?.candidate?.id || '',
    stageId: application?.currentStage?.id || '',
    status: (application?.status ?? 'new') as FormData['status'],
    coverLetter: application?.coverLetter || '',
    score: application?.score !== undefined && application?.score !== null ? String(application.score) : '',
    rating: application?.rating !== undefined && application?.rating !== null ? String(application.rating) : '',
    notes: application?.notes || '',
    tags: application?.tags || [],
    customResponses: [] as { question: string; answer: string }[]
  });

  const [currentTag, setCurrentTag] = useState('');

  // Fetch company-specific jobs and candidates
  const { jobs, isLoading: jobsLoading, error: jobsError } = useJobs();
  const { candidates, isLoading: candidatesLoading, error: candidatesError } = useCandidates();
  const { stages, isLoading: stagesLoading, error: stagesError } = useStages();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      score: formData.score ? parseFloat(formData.score) : undefined,
      rating: formData.rating ? parseInt(formData.rating, 10) : undefined
    });
    onClose();
  };

  const addTag = () => {
    if (currentTag.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const addCustomResponse = () => {
    setFormData(prev => ({
      ...prev,
      customResponses: [...prev.customResponses, { question: '', answer: '' }]
    }));
  };

  const updateCustomResponse = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      customResponses: prev.customResponses.map((response, i) => 
        i === index ? { ...response, [field]: value } : response
      )
    }));
  };

  const removeCustomResponse = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customResponses: prev.customResponses.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  const selectedJob = jobs.find(job => job.id === formData.jobId);
  const selectedCandidate = candidates.find(candidate => candidate.id === formData.candidateId);
  const selectedStage = stages.find(stage => stage.id === formData.stageId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            {application ? 'Edit Application' : 'Create New Application'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="space-y-6">
              {/* Job and Candidate Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Position *
                  </label>
                  <select
                    required
                    value={formData.jobId}
                    onChange={(e) => setFormData(prev => ({ ...prev, jobId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={jobsLoading}
                  >
                    <option value="">
                      {jobsLoading ? 'Loading jobs...' : jobsError ? 'Error loading jobs' : 'Select Job'}
                    </option>
                    {!jobsLoading && !jobsError && jobs.map(job => (
                      <option key={job.id} value={job.id}>
                        {job.title} - {job.client?.name || 'No Client'}
                      </option>
                    ))}
                  </select>
                  {selectedJob && (
                    <p className="mt-1 text-sm text-gray-500">
                      Client: {selectedJob.client?.name || 'No Client'} | Status: {selectedJob.status}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Candidate *
                  </label>
                  <select
                    required
                    value={formData.candidateId}
                    onChange={(e) => setFormData(prev => ({ ...prev, candidateId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={candidatesLoading}
                  >
                    <option value="">
                      {candidatesLoading ? 'Loading candidates...' : candidatesError ? 'Error loading candidates' : 'Select Candidate'}
                    </option>
                    {!candidatesLoading && !candidatesError && candidates.map(candidate => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.firstName} {candidate.lastName} ({candidate.email})
                      </option>
                    ))}
                  </select>
                  {selectedCandidate && (
                    <p className="mt-1 text-sm text-gray-500">
                      Email: {selectedCandidate.email} | Experience: {selectedCandidate.experienceYears || 'N/A'} years
                    </p>
                  )}
                </div>
              </div>

              {/* Application Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stage *
                  </label>
                  <select
                    required
                    value={formData.stageId}
                    onChange={(e) => setFormData(prev => ({ ...prev, stageId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={stagesLoading}
                  >
                    <option value="">
                      {stagesLoading ? 'Loading stages...' : stagesError ? 'Error loading stages' : 'Select Stage'}
                    </option>
                    {!stagesLoading && !stagesError && stages.map(stage => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name} {stage.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                  {selectedStage && (
                    <p className="mt-1 text-sm text-gray-500">
                      Type: {selectedStage.stageType} | Order: {selectedStage.orderIndex}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as FormData['status'] }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="new">New</option>
                    <option value="in-progress">In Progress</option>
                    <option value="rejected">Rejected</option>
                    <option value="hired">Hired</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Score (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.score}
                  onChange={(e) => setFormData(prev => ({ ...prev, score: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 85.5"
                />
              </div>

              {/* Cover Letter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter
                </label>
                <textarea
                  rows={6}
                  value={formData.coverLetter}
                  onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Candidate's cover letter or motivation..."
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a tag"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center space-x-1"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Custom Application Questions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Custom Application Responses</h3>
                  <button
                    type="button"
                    onClick={addCustomResponse}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>Add Response</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.customResponses.map((response, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Response {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeCustomResponse(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Question
                          </label>
                          <input
                            type="text"
                            value={response.question}
                            onChange={(e) => updateCustomResponse(index, 'question', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter the question"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Answer
                          </label>
                          <textarea
                            rows={3}
                            value={response.answer}
                            onChange={(e) => updateCustomResponse(index, 'answer', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Candidate's response"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {formData.customResponses.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No custom responses</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Add responses to custom application questions.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Application Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resume/CV
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="mt-2">
                        <button
                          type="button"
                          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          Upload Resume
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">PDF, DOC, DOCX</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Documents
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Plus className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="mt-2">
                        <button
                          type="button"
                          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          Upload Files
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Portfolio, certificates, etc.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Internal Notes
                </label>
                <textarea
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Internal notes about this application (not visible to candidate)..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Save size={16} />
              <span>{application ? 'Update Application' : 'Create Application'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationForm;