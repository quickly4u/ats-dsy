import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Briefcase,
  GraduationCap,
  Star,
  FileText,
  Mail,
  Phone,
  MapPin,
  LinkedinIcon,
  ExternalLink,
  Calendar,
  Building,
  Eye,
  Download,
  Upload
} from 'lucide-react';
import type { Candidate } from '../../types';
import { supabase, getCurrentUserCompanyId } from '../../lib/supabase';
import CandidateFileManager from './CandidateFileManager';

interface CandidateProfileModalProps {
  candidate?: Candidate;
  isOpen: boolean;
  onClose: () => void;
}

interface CandidateApplication {
  id: string;
  job: {
    id: string;
    title: string;
    client?: {
      name: string;
    };
  };
  currentStage: {
    name: string;
    stageType: string;
  };
  status: string;
  appliedAt: Date;
  score?: number;
  rating?: number;
}

interface ApplicationFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileCategory: string;
  uploadedAt: string;
  applicationId: string;
  jobTitle: string;
}

const CandidateProfileModal: React.FC<CandidateProfileModalProps> = ({ 
  candidate, 
  isOpen, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [applicationFiles, setApplicationFiles] = useState<ApplicationFile[]>([]);
  const [candidateFiles, setCandidateFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string>('');
  const [showFileManager, setShowFileManager] = useState(false);

  // Get company ID
  useEffect(() => {
    const getCompanyId = async () => {
      const id = await getCurrentUserCompanyId();
      if (id) setCompanyId(id);
    };
    getCompanyId();
  }, []);

  // Fetch candidate applications
  useEffect(() => {
    if (!candidate?.id || !companyId) return;
    
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('applications')
          .select(`
            id,
            status,
            applied_at,
            score,
            rating,
            job:jobs (
              id,
              title,
              client:clients (
                name
              )
            ),
            stage:custom_stages (
              name,
              stage_type
            )
          `)
          .eq('candidate_id', candidate.id)
          .eq('company_id', companyId)
          .order('applied_at', { ascending: false });

        if (error) throw error;

        const formattedApplications: CandidateApplication[] = (data || []).map((app: any) => ({
          id: app.id,
          job: {
            id: app.job?.id || '',
            title: app.job?.title || 'Unknown Job',
            client: app.job?.client ? { name: app.job.client.name } : undefined
          },
          currentStage: {
            name: app.stage?.name || 'Applied',
            stageType: app.stage?.stage_type || 'application'
          },
          status: app.status,
          appliedAt: new Date(app.applied_at),
          score: app.score,
          rating: app.rating
        }));

        setApplications(formattedApplications);
      } catch (err) {
        console.error('Error fetching applications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [candidate?.id, companyId]);

  // Fetch application files
  useEffect(() => {
    if (!candidate?.id || !companyId) return;
    
    const fetchApplicationFiles = async () => {
      try {
        const { data, error } = await supabase
          .from('application_files')
          .select(`
            id,
            file_name,
            file_url,
            file_category,
            created_at,
            application:applications (
              id,
              job:jobs (
                title
              )
            )
          `)
          .eq('candidate_id', candidate.id)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedFiles: ApplicationFile[] = (data || []).map((file: any) => ({
          id: file.id,
          fileName: file.file_name,
          fileUrl: file.file_url,
          fileCategory: file.file_category,
          uploadedAt: file.created_at,
          applicationId: file.application?.id || '',
          jobTitle: file.application?.job?.title || 'Unknown Job'
        }));

        setApplicationFiles(formattedFiles);
      } catch (err) {
        console.error('Error fetching application files:', err);
      }
    };

    fetchApplicationFiles();
  }, [candidate?.id, companyId]);

  // Fetch candidate files
  useEffect(() => {
    if (!candidate?.id || !companyId) return;
    
    const fetchCandidateFiles = async () => {
      try {
        const { data, error } = await supabase
          .from('candidate_files')
          .select('*')
          .eq('candidate_id', candidate.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCandidateFiles(data || []);
      } catch (err) {
        console.error('Error fetching candidate files:', err);
      }
    };

    fetchCandidateFiles();
  }, [candidate?.id, companyId]);

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

  const formatDate = (d?: Date | string) => {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(date.getTime())) return String(d);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'new': 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'rejected': 'bg-red-100 text-red-800',
      'hired': 'bg-green-100 text-green-800',
      'withdrawn': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Star },
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'documents', label: 'Documents', icon: Upload }
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {candidate.firstName} {candidate.lastName}
                </h2>
                <p className="text-sm text-gray-600">
                  {candidate.currentTitle || 'Candidate'}
                  {candidate.currentCompany ? ` • ${candidate.currentCompany}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                    {tab.id === 'applications' && applications.length > 0 && (
                      <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                        {applications.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Contact Information */}
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
                    {candidate.rating && (
                      <span className="ml-2 text-gray-600">({candidate.rating}/5)</span>
                    )}
                  </div>
                  {candidate.experienceYears != null && (
                    <div className="flex items-center text-sm text-gray-700">
                      <Briefcase size={18} className="mr-2 text-gray-400" />
                      <span>{candidate.experienceYears}+ years experience</span>
                    </div>
                  )}
                </div>

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
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Professional Summary</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-lg">
                      {candidate.summary}
                    </p>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{applications.length}</div>
                    <div className="text-sm text-blue-600">Applications</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {applications.filter(app => app.status === 'hired').length}
                    </div>
                    <div className="text-sm text-green-600">Hired</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{candidateFiles.length}</div>
                    <div className="text-sm text-purple-600">Documents</div>
                  </div>
                </div>
              </div>
            )}

            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Work Experience</h3>
                {candidate.experiences && candidate.experiences.length > 0 ? (
                  <div className="space-y-4">
                    {candidate.experiences.map((exp, idx) => (
                      <div key={exp.id ?? idx} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-lg font-medium text-gray-900">
                              {exp.title}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center mt-1">
                              <Building size={14} className="mr-1" />
                              {exp.company}
                            </div>
                            {exp.location && (
                              <div className="text-sm text-gray-600 flex items-center mt-1">
                                <MapPin size={14} className="mr-1" />
                                {exp.location}
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 whitespace-nowrap flex items-center">
                            <Calendar size={14} className="mr-1" />
                            {[formatDate(exp.startDate), formatDate(exp.endDate)].filter(Boolean).join(' - ')}
                          </div>
                        </div>
                        {exp.description && (
                          <p className="text-sm text-gray-700 mt-3 whitespace-pre-line bg-gray-50 p-3 rounded">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No work experience</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No work experience has been added for this candidate.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Education Tab */}
            {activeTab === 'education' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Education</h3>
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No education records</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Education information will be displayed here when available.
                  </p>
                </div>
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Skills & Expertise</h3>
                {candidate.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-3 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Star className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No skills listed</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Skills and expertise will be displayed here when available.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Applications Tab */}
            {activeTab === 'applications' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Job Applications</h3>
                  <span className="text-sm text-gray-500">{applications.length} applications</span>
                </div>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading applications...</p>
                  </div>
                ) : applications.length > 0 ? (
                  <div className="space-y-4">
                    {applications.map((app) => (
                      <div key={app.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="text-lg font-medium text-gray-900">{app.job.title}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(app.status)}`}>
                                {app.status}
                              </span>
                            </div>
                            {app.job.client && (
                              <p className="text-sm text-gray-600 mt-1">
                                <Building size={14} className="inline mr-1" />
                                {app.job.client.name}
                              </p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center">
                                <Calendar size={14} className="mr-1" />
                                Applied {formatDate(app.appliedAt)}
                              </span>
                              <span>Stage: {app.currentStage.name}</span>
                              {app.score && (
                                <span>Score: {app.score}/100</span>
                              )}
                              {app.rating && (
                                <span className="flex items-center">
                                  Rating: {renderStars(app.rating)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No applications</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This candidate hasn't applied to any jobs yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Documents & Files</h3>
                  <button
                    onClick={() => setShowFileManager(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Upload size={16} />
                    <span>Manage Files</span>
                  </button>
                </div>

                {/* Candidate Files */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Profile Documents</h4>
                  {candidateFiles.length > 0 ? (
                    <div className="space-y-2">
                      {candidateFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900">{file.file_name}</span>
                                {file.is_primary && (
                                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {file.file_category} • {formatDate(file.created_at)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => window.open(file.file_url, '_blank')}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Eye size={16} />
                            </button>
                            <a
                              href={file.file_url}
                              download={file.file_name}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            >
                              <Download size={16} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                      <FileText className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">No profile documents</p>
                    </div>
                  )}
                </div>

                {/* Application Files */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Application Documents</h4>
                  {applicationFiles.length > 0 ? (
                    <div className="space-y-2">
                      {applicationFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <div>
                              <span className="text-sm font-medium text-gray-900">{file.fileName}</span>
                              <div className="text-xs text-gray-500">
                                {file.jobTitle} • {file.fileCategory} • {formatDate(file.uploadedAt)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => window.open(file.fileUrl, '_blank')}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Eye size={16} />
                            </button>
                            <a
                              href={file.fileUrl}
                              download={file.fileName}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            >
                              <Download size={16} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                      <FileText className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">No application documents</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* File Manager Modal */}
      {showFileManager && (
        <CandidateFileManager
          candidateId={candidate.id}
          companyId={companyId}
          isOpen={showFileManager}
          onClose={() => {
            setShowFileManager(false);
            // Refresh candidate files after closing file manager
            if (candidate?.id && companyId) {
              supabase
                .from('candidate_files')
                .select('*')
                .eq('candidate_id', candidate.id)
                .order('created_at', { ascending: false })
                .then(({ data }) => setCandidateFiles(data || []));
            }
          }}
        />
      )}
    </>
  );
};

export default CandidateProfileModal;
