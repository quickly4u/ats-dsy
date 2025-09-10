import React, { useEffect, useState } from 'react';
import { 
  X, 
  Save, 
  FileText, 
  Upload,
  Plus
} from 'lucide-react';
import type { Application } from '../../types';
import { supabase } from '../../lib/supabase';
import { useJobs, useCandidates, useStages } from '../../hooks/useRecruitmentData';
import { getJobApplicationQuestions } from '../../lib/jobSkillsApi';

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
  customResponses: {
    questionId: string;
    question: string;
    type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'file';
    options?: string[];
    required?: boolean;
    answer: string | string[];
    file?: File | null;
    fileUrl?: string | null; // for reusing candidate primary resume
    usePrimary?: boolean; // toggle state
  }[];
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
    customResponses: [] as FormData['customResponses']
  });

  const [currentTag, setCurrentTag] = useState('');
  const [filePreviews, setFilePreviews] = useState<Record<number, string>>({});
  const [primaryResume, setPrimaryResume] = useState<{ url: string; name: string; size?: number; type?: string } | null>(null);
  const [responseErrors, setResponseErrors] = useState<Record<number, string | null>>({});

  // When job changes, load custom application questions for that job and prefill response slots
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        if (!formData.jobId) return;
        const questions = await getJobApplicationQuestions(formData.jobId);
        setFormData(prev => ({
          ...prev,
          customResponses: (questions || []).map((q: any) => ({
            questionId: q.id,
            question: q.question,
            type: q.question_type,
            options: q.options || [],
            required: !!q.is_required,
            answer: q.question_type === 'checkbox' ? [] : '',
            file: null,
            fileUrl: null,
            usePrimary: false
          }))
        }));
      } catch (e) {
        console.error('Failed to load job application questions:', e);
      }
    };
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.jobId]);

  // Load candidate's primary resume when candidate changes
  useEffect(() => {
    const loadPrimaryResume = async () => {
      try {
        setPrimaryResume(null);
        if (!formData.candidateId) return;
        const { data, error } = await supabase
          .from('candidate_files')
          .select('file_url, file_name, file_size, file_type, is_primary, file_category')
          .eq('candidate_id', formData.candidateId)
          .eq('is_primary', true)
          .maybeSingle();
        if (error) throw error;
        if (data?.file_url) {
          setPrimaryResume({ url: data.file_url, name: data.file_name, size: data.file_size, type: data.file_type });
        }
      } catch (e) {
        console.warn('Failed to load primary resume:', e);
      }
    };
    loadPrimaryResume();
  }, [formData.candidateId]);

  // Fetch company-specific jobs and candidates
  const { jobs, isLoading: jobsLoading, error: jobsError } = useJobs();
  const { candidates, isLoading: candidatesLoading, error: candidatesError } = useCandidates();
  const { stages, isLoading: stagesLoading, error: stagesError } = useStages();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required answers before submit
    const errs: Record<number, string | null> = {};
    formData.customResponses.forEach((_, i) => {
      // Run validation using latest state
      const r = formData.customResponses[i];
      if (r?.required) {
        let ok = true;
        switch (r.type) {
          case 'text':
          case 'textarea':
            ok = typeof r.answer === 'string' && r.answer.trim().length > 0; break;
          case 'select':
          case 'radio':
            ok = typeof r.answer === 'string' && r.answer !== ''; break;
          case 'checkbox':
            ok = Array.isArray(r.answer) && r.answer.length > 0; break;
          case 'file':
            ok = !!r.file; break;
          default:
            ok = true;
        }
        if (!ok) errs[i] = 'This question is required.'; else errs[i] = null;
      }
    });
    setResponseErrors(errs);
    const hasError = Object.values(errs).some(v => v);
    if (hasError) return;
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

  // Manual custom response add/edit removed; questions are driven by Job settings

  const setAnswer = (index: number, value: any) => {
    setFormData(prev => ({
      ...prev,
      customResponses: prev.customResponses.map((r, i) => i === index ? { ...r, answer: value } : r)
    }));
    validateResponse(index);
  };

  const toggleCheckboxAnswer = (index: number, option: string) => {
    setFormData(prev => ({
      ...prev,
      customResponses: prev.customResponses.map((r, i) => {
        if (i !== index) return r;
        const arr = Array.isArray(r.answer) ? r.answer.slice() : [];
        const pos = arr.indexOf(option);
        if (pos >= 0) arr.splice(pos, 1); else arr.push(option);
        return { ...r, answer: arr };
      })
    }));
    validateResponse(index);
  };

  const setFileAnswer = (index: number, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      customResponses: prev.customResponses.map((r, i) => i === index ? { ...r, file, fileUrl: file ? null : r.fileUrl, usePrimary: file ? false : r.usePrimary } : r)
    }));
    setFilePreviews(prev => {
      // Revoke existing
      if (prev[index]) {
        try { URL.revokeObjectURL(prev[index]); } catch {}
      }
      if (file) {
        const url = URL.createObjectURL(file);
        return { ...prev, [index]: url };
      } else {
        const copy = { ...prev };
        delete copy[index];
        return copy;
      }
    });
    validateResponse(index);
  };

  const validateResponse = (index: number) => {
    const r = formData.customResponses[index];
    if (!r) return;
    if (!r.required) {
      setResponseErrors(prev => ({ ...prev, [index]: null }));
      return;
    }
    let ok = true;
    switch (r.type) {
      case 'text':
      case 'textarea':
        ok = typeof r.answer === 'string' && r.answer.trim().length > 0;
        break;
      case 'select':
      case 'radio':
        ok = typeof r.answer === 'string' && r.answer !== '';
        break;
      case 'checkbox':
        ok = Array.isArray(r.answer) && r.answer.length > 0;
        break;
      case 'file':
        ok = !!r.file || !!r.fileUrl;
        break;
      default:
        ok = true;
    }
    setResponseErrors(prev => ({ ...prev, [index]: ok ? null : 'This question is required.' }));
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(filePreviews).forEach(url => {
        try { URL.revokeObjectURL(url); } catch {}
      });
    };
  }, [filePreviews]);

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
                </div>

                <div className="space-y-4">
                  {formData.customResponses.map((response, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{response.question || `Question ${index + 1}`}</h4>
                      </div>

                      <div className="space-y-3">
                        {/* Render answer control by type */}
                        {response.type === 'text' && (
                          <input
                            type="text"
                            value={(response.answer as string) || ''}
                            onChange={(e) => setAnswer(index, e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Your answer"
                          />
                        )}
                        {responseErrors[index] && response.type === 'text' && (
                          <p className="text-sm text-red-600">{responseErrors[index]}</p>
                        )}
                        {response.type === 'textarea' && (
                          <textarea
                            rows={4}
                            value={(response.answer as string) || ''}
                            onChange={(e) => setAnswer(index, e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Your detailed answer"
                          />
                        )}
                        {responseErrors[index] && response.type === 'textarea' && (
                          <p className="text-sm text-red-600">{responseErrors[index]}</p>
                        )}
                        {(response.type === 'select') && (
                          <select
                            value={(response.answer as string) || ''}
                            onChange={(e) => setAnswer(index, e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select an option</option>
                            {(response.options || []).map((opt, i) => (
                              <option key={i} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                        {responseErrors[index] && response.type === 'select' && (
                          <p className="text-sm text-red-600">{responseErrors[index]}</p>
                        )}
                        {response.type === 'radio' && (
                          <div className="space-y-2">
                            {(response.options || []).map((opt, i) => (
                              <label key={i} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`q_${index}`}
                                  checked={response.answer === opt}
                                  onChange={() => setAnswer(index, opt)}
                                  className="rounded border-gray-300"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        {responseErrors[index] && response.type === 'radio' && (
                          <p className="text-sm text-red-600">{responseErrors[index]}</p>
                        )}
                        {response.type === 'checkbox' && (
                          <div className="space-y-2">
                            {(response.options || []).map((opt, i) => {
                              const selected = Array.isArray(response.answer) && response.answer.includes(opt);
                              return (
                                <label key={i} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() => toggleCheckboxAnswer(index, opt)}
                                    className="rounded border-gray-300"
                                  />
                                  <span>{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                        {responseErrors[index] && response.type === 'checkbox' && (
                          <p className="text-sm text-red-600">{responseErrors[index]}</p>
                        )}
                        {response.type === 'file' && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  disabled={!primaryResume}
                                  checked={!!response.usePrimary}
                                  onChange={(e) => {
                                    const use = e.target.checked;
                                    setFormData(prev => ({
                                      ...prev,
                                      customResponses: prev.customResponses.map((r, i) => i === index ? {
                                        ...r,
                                        usePrimary: use,
                                        file: use ? null : r.file,
                                        fileUrl: use && primaryResume ? primaryResume.url : (use ? null : r.fileUrl)
                                      } : r)
                                    }));
                                    // Clear preview if toggled to primary
                                    if (e.target.checked) {
                                      setFileAnswer(index, null);
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                />
                                <span>Use candidate's primary resume</span>
                              </label>
                              {!primaryResume && (
                                <span className="text-xs text-gray-500">No primary resume set for selected candidate</span>
                              )}
                              {primaryResume && response.usePrimary && (
                                <a href={primaryResume.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                                  Preview primary resume
                                </a>
                              )}
                            </div>

                            {!response.usePrimary && (
                              <input
                                type="file"
                                onChange={(e) => setFileAnswer(index, e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              />
                            )}
                            {response.file && (
                              <div className="border rounded p-3 bg-gray-50">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-gray-700">
                                    Selected: <strong>{response.file.name}</strong> ({Math.round(response.file.size / 1024)} KB)
                                  </div>
                                  <div className="space-x-3">
                                    {filePreviews[index] && (
                                      <a href={filePreviews[index]} download={response.file.name} className="text-blue-600 hover:underline">Download</a>
                                    )}
                                    <button type="button" onClick={() => setFileAnswer(index, null)} className="text-red-600 hover:underline">Remove</button>
                                  </div>
                                </div>
                                {filePreviews[index] && response.file.type.startsWith('image/') && (
                                  <img src={filePreviews[index]} alt="Preview" className="mt-3 max-h-48 rounded" />
                                )}
                                {filePreviews[index] && response.file.type === 'application/pdf' && (
                                  <iframe src={filePreviews[index]} className="mt-3 w-full h-64" />
                                )}
                              </div>
                            )}
                            {responseErrors[index] && (
                              <p className="text-sm text-red-600">{responseErrors[index]}</p>
                            )}
                          </div>
                        )}
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