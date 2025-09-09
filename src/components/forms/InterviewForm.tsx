import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Video, 
  Users,
  Plus,
  Trash2
} from 'lucide-react';
import type { Interview, Application } from '../../types';
import { useApplications, useTeamMembers } from '../../hooks/useRecruitmentData';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../common/LoadingSpinner';

type InterviewStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

interface CreateInterviewPayload {
  applicationId: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  durationMinutes: number;
  location?: string;
  meetingUrl?: string;
  status: InterviewStatus;
  interviewRound: number;
  participants: { userId: string; role: string; isRequired: boolean }[];
}

interface InterviewFormProps {
  interview?: Interview;
  application?: Application;
  isOpen: boolean;
  onClose: () => void;
  onSave: (interviewData: CreateInterviewPayload) => Promise<{ id?: string; error?: string }>;
}

const InterviewForm: React.FC<InterviewFormProps> = ({ 
  interview, 
  application, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    applicationId: interview?.application?.id || application?.id || '',
    title: interview?.title || '',
    description: interview?.description || '',
    scheduledAt: interview?.scheduledAt ? 
      new Date(interview.scheduledAt).toISOString().slice(0, 16) : '',
    durationMinutes: interview?.durationMinutes || 60,
    location: interview?.location || '',
    meetingUrl: interview?.meetingUrl || '',
    status: interview?.status || 'scheduled',
    interviewRound: interview?.interviewRound || 1,
    interviewType: 'technical', // Default type
    participants: [] as { userId: string; role: string; isRequired: boolean }[]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Hooks
  const { success, error: showError } = useToast();
  const { applications, isLoading: appsLoading, error: appsError } = useApplications();
  const { teamMembers, isLoading: usersLoading, error: usersError } = useTeamMembers();

  const interviewTypes = [
    { value: 'phone', label: 'Phone Screening' },
    { value: 'video', label: 'Video Interview' },
    { value: 'technical', label: 'Technical Interview' },
    { value: 'panel', label: 'Panel Interview' },
    { value: 'cultural', label: 'Cultural Fit' },
    { value: 'final', label: 'Final Interview' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Interview title is required';
    }
    if (!formData.applicationId) {
      newErrors.applicationId = 'Application selection is required';
    }
    if (!formData.scheduledAt) {
      newErrors.scheduledAt = 'Interview date and time is required';
    }
    if (formData.durationMinutes < 15) {
      newErrors.durationMinutes = 'Duration must be at least 15 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Validation Error', 'Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await onSave({
        applicationId: formData.applicationId,
        title: formData.title,
        description: formData.description,
        scheduledAt: new Date(formData.scheduledAt),
        durationMinutes: formData.durationMinutes,
        location: formData.location,
        meetingUrl: formData.meetingUrl,
        status: formData.status as InterviewStatus,
        interviewRound: formData.interviewRound,
        participants: formData.participants,
      });

      if (result.error) {
        showError('Failed to save interview', result.error);
      } else {
        success('Interview saved successfully', 
          interview ? 'Interview has been updated' : 'Interview has been scheduled');
        onClose();
      }
    } catch (error) {
      showError('Unexpected error', 'Failed to save interview. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addParticipant = () => {
    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, { userId: '', role: 'interviewer', isRequired: true }]
    }));
  };

  const updateParticipant = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };

  const removeParticipant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index)
    }));
  };

  const generateMeetingUrl = () => {
    const meetingId = Math.random().toString(36).substring(2, 15);
    setFormData(prev => ({
      ...prev,
      meetingUrl: `https://meet.company.com/${meetingId}`
    }));
  };

  if (!isOpen) return null;

  const selectedApplication = applications.find(app => app.id === formData.applicationId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            {interview ? 'Edit Interview' : 'Schedule New Interview'}
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
              {/* Loading State */}
              {(appsLoading || usersLoading) && (
                <div className="mb-4">
                  <LoadingSpinner text="Loading form data..." />
                </div>
              )}

              {/* Error State */}
              {(appsError || usersError) && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">
                    {appsError || usersError || 'Failed to load form data'}
                  </p>
                </div>
              )}

              {/* Application Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application *
                </label>
                <select
                  required
                  value={formData.applicationId}
                  onChange={(e) => setFormData(prev => ({ ...prev, applicationId: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.applicationId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={!!application || appsLoading} // Disable if application is pre-selected or loading
                >
                  <option value="">Select Application</option>
                  {appsLoading && (
                    <option value="" disabled>Loading applications...</option>
                  )}
                  {appsError && (
                    <option value="" disabled>Error loading applications</option>
                  )}
                  {!appsLoading && !appsError && applications.map(app => (
                    <option key={app.id} value={app.id}>
                      {app.candidate.firstName} {app.candidate.lastName} - {app.job.title}
                    </option>
                  ))}
                </select>
                {errors.applicationId && (
                  <p className="mt-1 text-sm text-red-600">{errors.applicationId}</p>
                )}
                {selectedApplication && (
                  <p className="mt-1 text-sm text-gray-500">
                    Interview for {selectedApplication.candidate.firstName} {selectedApplication.candidate.lastName}
                  </p>
                )}
              </div>

              {/* Basic Interview Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="e.g. Technical Interview"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Type *
                  </label>
                  <select
                    required
                    value={formData.interviewType}
                    onChange={(e) => setFormData(prev => ({ ...prev, interviewType: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {interviewTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes) *
                  </label>
                  <select
                    required
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Round
                  </label>
                  <select
                    value={formData.interviewRound}
                    onChange={(e) => setFormData(prev => ({ ...prev, interviewRound: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Round 1</option>
                    <option value={2}>Round 2</option>
                    <option value={3}>Round 3</option>
                    <option value={4}>Round 4</option>
                    <option value={5}>Final Round</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as InterviewStatus }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Location/Meeting Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Location & Meeting Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Physical Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Conference Room A, Office Building"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Video Meeting URL
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="url"
                        value={formData.meetingUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, meetingUrl: e.target.value }))}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://meet.company.com/interview"
                      />
                      <button
                        type="button"
                        onClick={generateMeetingUrl}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        title="Generate meeting URL"
                      >
                        <Video size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of what will be covered in this interview..."
                />
              </div>

              {/* Participants */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Interview Participants</h3>
                  <button
                    type="button"
                    onClick={addParticipant}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>Add Participant</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.participants.map((participant, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Participant {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeParticipant(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Team Member
                          </label>
                          <select
                            value={participant.userId}
                            onChange={(e) => updateParticipant(index, 'userId', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Member</option>
                            {usersLoading && (
                              <option value="" disabled>Loading team members...</option>
                            )}
                            {usersError && (
                              <option value="" disabled>Error loading team members</option>
                            )}
                            {!usersLoading && !usersError && teamMembers.map((user: any) => (
                              <option key={user.id} value={user.id}>
                                {user.firstName} {user.lastName}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role
                          </label>
                          <select
                            value={participant.role}
                            onChange={(e) => updateParticipant(index, 'role', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="interviewer">Interviewer</option>
                            <option value="observer">Observer</option>
                            <option value="note-taker">Note Taker</option>
                          </select>
                        </div>

                        <div className="flex items-end">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={participant.isRequired}
                              onChange={(e) => updateParticipant(index, 'isRequired', e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700">Required</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}

                  {formData.participants.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <Users className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No participants added</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Add team members who will participate in this interview.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Interview Preparation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Interview Preparation</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• Review candidate's resume and application</p>
                  <p>• Prepare technical questions relevant to the role</p>
                  <p>• Set up recording equipment if needed</p>
                  <p>• Test video conferencing setup in advance</p>
                  <p>• Prepare interview evaluation form</p>
                </div>
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
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                isSubmitting 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              <Save size={16} />
              <span>
                {isSubmitting 
                  ? 'Saving...' 
                  : interview ? 'Update Interview' : 'Schedule Interview'
                }
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterviewForm;