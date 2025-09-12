import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
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
  Upload,
  ArrowLeft,
  Plus,
  X,
  Save,
  History
} from 'lucide-react';
import type { Candidate, Experience } from '../../types';
import { supabase, getCurrentUserCompanyId } from '../../lib/supabase';
import CandidateFileManager from './CandidateFileManager';
import { AuditInfo } from '../common/AuditInfo';
import { TransactionHistory } from '../common/TransactionHistory';

const CandidateProfilePage: React.FC = () => {
  const { id } = useParams();
  const [companyId, setCompanyId] = useState<string>('');
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationFiles, setApplicationFiles] = useState<any[]>([]);
  const [candidateFiles, setCandidateFiles] = useState<any[]>([]);
  const [educationRecords, setEducationRecords] = useState<any[]>([]);
  const [showFileManager, setShowFileManager] = useState(false);
  const [editingSkills, setEditingSkills] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [editingExperience, setEditingExperience] = useState(false);
  const [newExperience, setNewExperience] = useState({ company: '', title: '', location: '', startDate: '', endDate: '', description: '' });
  const [editingEducation, setEditingEducation] = useState(false);
  const [newEducation, setNewEducation] = useState({ institution: '', degree: '', field: '', startDate: '', endDate: '' });
  const navigate = useNavigate();

  // Add skill function
  const addSkill = async () => {
    if (!newSkill.trim() || !candidate?.id || !companyId) return;
    try {
      const { error } = await supabase
        .from('candidate_skills')
        .insert({ candidate_id: candidate.id, skill: newSkill.trim() });
      if (error) throw error;
      
      setCandidate(prev => prev ? {
        ...prev,
        skills: [...(prev.skills || []), newSkill.trim()]
      } : null);
      setNewSkill('');
      setEditingSkills(false);
    } catch (err) {
      console.error('Failed to add skill:', err);
      alert('Failed to add skill');
    }
  };

  // Remove skill function
  const removeSkill = async (skillToRemove: string) => {
    if (!candidate?.id) return;
    try {
      const { error } = await supabase
        .from('candidate_skills')
        .delete()
        .eq('candidate_id', candidate.id)
        .eq('skill', skillToRemove);
      if (error) throw error;
      
      setCandidate(prev => prev ? {
        ...prev,
        skills: (prev.skills || []).filter(skill => skill !== skillToRemove)
      } : null);
    } catch (err) {
      console.error('Failed to remove skill:', err);
      alert('Failed to remove skill');
    }
  };

  // Add experience function
  const addExperience = async () => {
    if (!newExperience.company.trim() || !newExperience.title.trim() || !candidate?.id || !companyId) return;
    try {
      const { data, error } = await supabase
        .from('candidate_experiences')
        .insert({
          candidate_id: candidate.id,
          company_id: companyId,
          company: newExperience.company,
          title: newExperience.title,
          location: newExperience.location || null,
          start_date: newExperience.startDate || null,
          end_date: newExperience.endDate || null,
          description: newExperience.description || null
        })
        .select()
        .single();
      if (error) throw error;
      
      const newExp: Experience = {
        id: data.id,
        company: data.company,
        title: data.title,
        location: data.location || undefined,
        startDate: data.start_date || undefined,
        endDate: data.end_date || undefined,
        description: data.description || undefined
      };
      
      setCandidate(prev => prev ? {
        ...prev,
        experiences: [newExp, ...(prev.experiences || [])]
      } : null);
      setNewExperience({ company: '', title: '', location: '', startDate: '', endDate: '', description: '' });
      setEditingExperience(false);
    } catch (err) {
      console.error('Failed to add experience:', err);
      alert('Failed to add experience');
    }
  };

  // Add education function
  const addEducation = async () => {
    if (!newEducation.institution.trim() || !newEducation.degree.trim() || !candidate?.id || !companyId) return;
    try {
      const { data, error } = await supabase
        .from('candidate_education')
        .insert({
          candidate_id: candidate.id,
          company_id: companyId,
          institution: newEducation.institution,
          degree: newEducation.degree,
          field_of_study: newEducation.field || null,
          start_date: newEducation.startDate || null,
          end_date: newEducation.endDate || null
        })
        .select()
        .single();
      if (error) throw error;
      
      // Add to local state
      setEducationRecords(prev => [data, ...prev]);
      setNewEducation({ institution: '', degree: '', field: '', startDate: '', endDate: '' });
      setEditingEducation(false);
    } catch (err) {
      console.error('Failed to add education:', err);
      alert('Failed to add education');
    }
  };

  // Remove education function
  const removeEducation = async (educationId: string) => {
    try {
      const { error } = await supabase
        .from('candidate_education')
        .delete()
        .eq('id', educationId);
      if (error) throw error;
      
      setEducationRecords(prev => prev.filter(edu => edu.id !== educationId));
    } catch (err) {
      console.error('Failed to remove education:', err);
      alert('Failed to remove education');
    }
  };

  useEffect(() => {
    (async () => {
      const cid = await getCurrentUserCompanyId();
      if (cid) setCompanyId(cid);
    })();
  }, []);

  useEffect(() => {
    if (!id || !companyId) return;
    const loadCandidate = async () => {
      try {
        setLoading(true);
        const { data: row, error } = await supabase
          .from('candidates')
          .select(`
            id, email, first_name, last_name, phone, location, linkedin_url, portfolio_url,
            current_company, current_title, experience_years, summary, avatar, resume_url,
            source, rating, is_blacklisted, created_at
          `)
          .eq('id', id)
          .eq('company_id', companyId)
          .maybeSingle();
        if (error) throw error;
        if (!row) { setCandidate(null); setLoading(false); return; }

        // skills
        const { data: skillsRows } = await supabase
          .from('candidate_skills')
          .select('skill')
          .eq('candidate_id', id);
        const skills = (skillsRows || []).map(s => s.skill);

        // experiences
        const { data: expRows } = await supabase
          .from('candidate_experiences')
          .select('id, company, title, location, start_date, end_date, description')
          .eq('candidate_id', id)
          .eq('company_id', companyId)
          .order('start_date', { ascending: false });
        const experiences: Experience[] = (expRows || []).map((e: any) => ({
          id: e.id,
          company: e.company,
          title: e.title,
          location: e.location || undefined,
          startDate: e.start_date || undefined,
          endDate: e.end_date || undefined,
          description: e.description || undefined,
        }));

        // education records
        const { data: eduRows } = await supabase
          .from('candidate_education')
          .select('*')
          .eq('candidate_id', id)
          .eq('company_id', companyId)
          .order('start_date', { ascending: false });
        setEducationRecords(eduRows || []);

        const c: Candidate = {
          id: row.id,
          email: row.email,
          firstName: row.first_name,
          lastName: row.last_name,
          phone: row.phone || undefined,
          location: row.location || undefined,
          linkedinUrl: row.linkedin_url || undefined,
          portfolioUrl: row.portfolio_url || undefined,
          currentCompany: row.current_company || undefined,
          currentTitle: row.current_title || undefined,
          experienceYears: row.experience_years || undefined,
          skills,
          experiences,
          summary: row.summary || undefined,
          avatar: row.avatar || undefined,
          resumeUrl: row.resume_url || undefined,
          source: row.source || 'Unknown',
          tags: [],
          rating: row.rating || undefined,
          isBlacklisted: !!row.is_blacklisted,
          gdprConsent: false,
          createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        };
        setCandidate(c);
      } catch (e) {
        console.error('Failed to load candidate', e);
      } finally {
        setLoading(false);
      }
    };
    loadCandidate();
  }, [id, companyId]);

  // Applications
  useEffect(() => {
    if (!id || !companyId) return;
    const loadApps = async () => {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          applied_at,
          score,
          rating,
          job:jobs ( id, title, client:clients ( name ) ),
          stage:custom_stages ( name, stage_type )
        `)
        .eq('candidate_id', id)
        .eq('company_id', companyId)
        .order('applied_at', { ascending: false });
      if (!error) setApplications(data || []);
    };
    loadApps();
  }, [id, companyId]);

  // Files
  useEffect(() => {
    if (!id || !companyId) return;
    const loadFiles = async () => {
      const [candFiles, appFiles] = await Promise.all([
        supabase.from('candidate_files').select('*').eq('candidate_id', id).order('created_at', { ascending: false }),
        supabase.from('application_files').select(`
          id, file_name, file_url, file_category, created_at,
          application:applications ( id, job:jobs ( title ) )
        `).eq('candidate_id', id).eq('company_id', companyId).order('created_at', { ascending: false })
      ]);
      if (!candFiles.error) setCandidateFiles(candFiles.data || []);
      if (!appFiles.error) setApplicationFiles((appFiles.data || []).map((f: any) => ({
        id: f.id,
        fileName: f.file_name,
        fileUrl: f.file_url,
        fileCategory: f.file_category,
        uploadedAt: f.created_at,
        applicationId: f.application?.id || '',
        jobTitle: f.application?.job?.title || 'Unknown Job'
      })));
    };
    loadFiles();
  }, [id, companyId]);

  const renderStars = (rating?: number) => {
    const stars = [];
    const filled = rating || 0;
    for (let i = 1; i <= 5; i++) {
      stars.push(<Star key={i} size={16} className={`${i <= filled ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />);
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
    const colors: Record<string, string> = {
      'new': 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'rejected': 'bg-red-100 text-red-800',
      'hired': 'bg-green-100 text-green-800',
      'withdrawn': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Star },
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'history', label: 'History', icon: History }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-3 text-gray-600">Loading candidate...</p>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-700">Candidate not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/candidates')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Candidates"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {candidate.firstName} {candidate.lastName}
              </h2>
              <p className="text-sm text-gray-600">
                {candidate.currentTitle || 'Candidate'}{candidate.currentCompany ? ` • ${candidate.currentCompany}` : ''}
              </p>
              {candidate.id && (
                <div className="mt-2">
                  <AuditInfo tableName="candidates" recordId={candidate.id} className="text-xs" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon as any;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {tab.id === 'applications' && applications.length > 0 && (
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">{applications.length}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-blue-600" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email Address</span>
                    <div className="flex items-center text-sm text-gray-900">
                      <Mail size={16} className="mr-2 text-gray-400" />
                      <span className="truncate">{candidate.email}</span>
                    </div>
                  </div>
                  {candidate.phone && (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Phone Number</span>
                      <div className="flex items-center text-sm text-gray-900">
                        <Phone size={16} className="mr-2 text-gray-400" />
                        <span>{candidate.phone}</span>
                      </div>
                    </div>
                  )}
                  {candidate.location && (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Location</span>
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin size={16} className="mr-2 text-gray-400" />
                        <span>{candidate.location}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Details */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                  Professional Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {candidate.currentTitle && (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Current Position</span>
                      <span className="text-sm text-gray-900">{candidate.currentTitle}</span>
                    </div>
                  )}
                  {candidate.currentCompany && (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Current Company</span>
                      <span className="text-sm text-gray-900">{candidate.currentCompany}</span>
                    </div>
                  )}
                  {candidate.experienceYears != null && (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Experience</span>
                      <div className="flex items-center text-sm text-gray-900">
                        <Briefcase size={16} className="mr-2 text-gray-400" />
                        <span>{candidate.experienceYears}+ years</span>
                      </div>
                    </div>
                  )}
                  {candidate.rating && (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Rating</span>
                      <div className="flex items-center">
                        {renderStars(candidate.rating)}
                        <span className="ml-2 text-sm text-gray-600">({candidate.rating}/5)</span>
                      </div>
                    </div>
                  )}
                  {candidate.source && (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Source</span>
                      <span className="text-sm text-gray-900 capitalize">{candidate.source.replace('-', ' ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Links & Documents */}
              {(candidate.linkedinUrl || candidate.portfolioUrl || candidate.resumeUrl) && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <ExternalLink className="w-5 h-5 mr-2 text-blue-600" />
                    Links & Documents
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {candidate.linkedinUrl && (
                      <a href={candidate.linkedinUrl} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <LinkedinIcon size={16} className="mr-2 text-blue-600" /> LinkedIn Profile
                      </a>
                    )}
                    {candidate.portfolioUrl && (
                      <a href={candidate.portfolioUrl} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <ExternalLink size={16} className="mr-2 text-green-600" /> Portfolio
                      </a>
                    )}
                    {candidate.resumeUrl && (
                      <a href={candidate.resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <FileText size={16} className="mr-2 text-red-600" /> Resume
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Professional Summary */}
              {candidate.summary && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-600" />
                    Professional Summary
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{candidate.summary}</p>
                </div>
              )}

              {/* Quick Stats */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <Star className="w-5 h-5 mr-2 text-blue-600" />
                  Quick Stats
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{applications.length}</div>
                        <div className="text-sm text-gray-600">Total Applications</div>
                      </div>
                      <FileText className="w-8 h-8 text-blue-400" />
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-green-600">{applications.filter((a:any) => a.status === 'hired').length}</div>
                        <div className="text-sm text-gray-600">Successful Hires</div>
                      </div>
                      <Building className="w-8 h-8 text-green-400" />
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-purple-600">{candidateFiles.length}</div>
                        <div className="text-sm text-gray-600">Documents Uploaded</div>
                      </div>
                      <Upload className="w-8 h-8 text-purple-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'experience' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <Briefcase className="w-6 h-6 mr-3 text-blue-600" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Work Experience</h3>
                      <p className="text-sm text-gray-600">Professional work history and career progression</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingExperience(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
                  >
                    <Plus size={16} />
                    <span>Add Experience</span>
                  </button>
                </div>
              
              {editingExperience && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      value={newExperience.company}
                      onChange={(e) => setNewExperience(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="Company name"
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={newExperience.title}
                      onChange={(e) => setNewExperience(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Job title"
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={newExperience.location}
                      onChange={(e) => setNewExperience(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Location"
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex space-x-2">
                      <input
                        type="date"
                        value={newExperience.startDate}
                        onChange={(e) => setNewExperience(prev => ({ ...prev, startDate: e.target.value }))}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="date"
                        value={newExperience.endDate}
                        onChange={(e) => setNewExperience(prev => ({ ...prev, endDate: e.target.value }))}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <textarea
                    value={newExperience.description}
                    onChange={(e) => setNewExperience(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Job description and responsibilities"
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={addExperience}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-1"
                    >
                      <Save size={16} />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingExperience(false);
                        setNewExperience({ company: '', title: '', location: '', startDate: '', endDate: '', description: '' });
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
              
                {candidate.experiences && candidate.experiences.length > 0 ? (
                  <div className="space-y-4">
                    {candidate.experiences.map((exp, idx) => (
                      <div key={exp.id ?? idx} className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Position</span>
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-1">{exp.title}</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Company</span>
                                <div className="flex items-center text-sm text-gray-900">
                                  <Building size={16} className="mr-2 text-gray-400" />
                                  <span>{exp.company}</span>
                                </div>
                              </div>
                              {exp.location && (
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Location</span>
                                  <div className="flex items-center text-sm text-gray-900">
                                    <MapPin size={16} className="mr-2 text-gray-400" />
                                    <span>{exp.location}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Duration</span>
                            <div className="flex items-center text-sm text-gray-900 whitespace-nowrap">
                              <Calendar size={16} className="mr-2 text-gray-400" />
                              <span>{[formatDate(exp.startDate), formatDate(exp.endDate)].filter(Boolean).join(' - ') || 'Present'}</span>
                            </div>
                          </div>
                        </div>
                        
                        {exp.description && (
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Description</span>
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{exp.description}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <Briefcase className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Work Experience Added</h3>
                    <p className="text-sm text-gray-500 mb-4">Start building the candidate's professional history</p>
                    <button
                      onClick={() => setEditingExperience(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
                    >
                      <Plus size={16} />
                      <span>Add First Experience</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'education' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <GraduationCap className="w-6 h-6 mr-3 text-blue-600" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Education Background</h3>
                      <p className="text-sm text-gray-600">Academic qualifications and certifications</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingEducation(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
                  >
                    <Plus size={16} />
                    <span>Add Education</span>
                  </button>
                </div>
              
              {editingEducation && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      value={newEducation.institution}
                      onChange={(e) => setNewEducation(prev => ({ ...prev, institution: e.target.value }))}
                      placeholder="Institution name"
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={newEducation.degree}
                      onChange={(e) => setNewEducation(prev => ({ ...prev, degree: e.target.value }))}
                      placeholder="Degree (e.g., Bachelor's, Master's)"
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={newEducation.field}
                      onChange={(e) => setNewEducation(prev => ({ ...prev, field: e.target.value }))}
                      placeholder="Field of study"
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex space-x-2">
                      <input
                        type="date"
                        value={newEducation.startDate}
                        onChange={(e) => setNewEducation(prev => ({ ...prev, startDate: e.target.value }))}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="date"
                        value={newEducation.endDate}
                        onChange={(e) => setNewEducation(prev => ({ ...prev, endDate: e.target.value }))}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={addEducation}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-1"
                    >
                      <Save size={16} />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingEducation(false);
                        setNewEducation({ institution: '', degree: '', field: '', startDate: '', endDate: '' });
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
              
                {educationRecords.length > 0 ? (
                  <div className="space-y-4">
                    {educationRecords.map((edu) => (
                      <div key={edu.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Degree</span>
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-1">{edu.degree}</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Institution</span>
                                <div className="flex items-center text-sm text-gray-900">
                                  <GraduationCap size={16} className="mr-2 text-gray-400" />
                                  <span>{edu.institution}</span>
                                </div>
                              </div>
                              {edu.field_of_study && (
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Field of Study</span>
                                  <div className="flex items-center text-sm text-gray-900">
                                    <span>{edu.field_of_study}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right flex items-start space-x-2">
                            <div>
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Duration</span>
                              <div className="flex items-center text-sm text-gray-900 whitespace-nowrap">
                                <Calendar size={16} className="mr-2 text-gray-400" />
                                <span>{[formatDate(edu.start_date), formatDate(edu.end_date)].filter(Boolean).join(' - ') || 'Present'}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => removeEducation(edu.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Remove education"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                        
                        {edu.description && (
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Description</span>
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{edu.description}</p>
                            </div>
                          </div>
                        )}
                        
                        {edu.grade && (
                          <div className="mt-3">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Grade/GPA</span>
                            <span className="text-sm text-gray-900">{edu.grade}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <GraduationCap className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Education Records</h3>
                    <p className="text-sm text-gray-500 mb-4">Add academic qualifications and certifications</p>
                    <button
                      onClick={() => setEditingEducation(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
                    >
                      <Plus size={16} />
                      <span>Add First Education</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <Star className="w-6 h-6 mr-3 text-blue-600" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Skills & Expertise</h3>
                      <p className="text-sm text-gray-600">Technical and professional competencies</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingSkills(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
                  >
                    <Plus size={16} />
                    <span>Add Skill</span>
                  </button>
                </div>
              
              {editingSkills && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Enter skill name"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    />
                    <button
                      onClick={addSkill}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-1"
                    >
                      <Save size={16} />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => { setEditingSkills(false); setNewSkill(''); }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
              
                {candidate.skills?.length > 0 ? (
                  <div>
                    <div className="mb-4">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Technical & Professional Skills</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {candidate.skills.map((skill, i) => (
                        <div key={i} className="group relative">
                          <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 rounded-lg text-sm font-medium border border-blue-200 hover:from-blue-100 hover:to-blue-200 transition-all">
                            <Star size={14} className="mr-2 text-blue-600" />
                            <span>{skill}</span>
                            <button
                              onClick={() => removeSkill(skill)}
                              className="ml-2 text-blue-600 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove skill"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-xs text-gray-500">
                      Total Skills: {candidate.skills.length} • Hover over skills to remove them
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <Star className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Skills Added</h3>
                    <p className="text-sm text-gray-500 mb-4">Build the candidate's skill profile</p>
                    <button
                      onClick={() => setEditingSkills(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
                    >
                      <Plus size={16} />
                      <span>Add First Skill</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <FileText className="w-6 h-6 mr-3 text-blue-600" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Job Applications</h3>
                      <p className="text-sm text-gray-600">Application history and current status</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{applications.length}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Total Applications</div>
                  </div>
                </div>
                {applications.length > 0 ? (
                  <div className="space-y-4">
                    {applications.map((app: any) => (
                      <div key={app.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Position Applied</span>
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(app.status)}`}>
                                {app.status.replace('-', ' ').toUpperCase()}
                              </span>
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-3">{app.job?.title || 'Job Position'}</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {app.job?.client && (
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Company</span>
                                  <div className="flex items-center text-sm text-gray-900">
                                    <Building size={16} className="mr-2 text-gray-400" />
                                    <span>{app.job.client.name}</span>
                                  </div>
                                </div>
                              )}
                              
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Applied Date</span>
                                <div className="flex items-center text-sm text-gray-900">
                                  <Calendar size={16} className="mr-2 text-gray-400" />
                                  <span>{formatDate(app.applied_at)}</span>
                                </div>
                              </div>
                              
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Current Stage</span>
                                <div className="flex items-center text-sm text-gray-900">
                                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                  <span>{app.stage?.name || 'Applied'}</span>
                                </div>
                              </div>
                              
                              {(app.score || app.rating) && (
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Assessment</span>
                                  <div className="flex items-center space-x-3 text-sm text-gray-900">
                                    {app.score && (
                                      <div className="flex items-center">
                                        <span className="text-xs text-gray-500 mr-1">Score:</span>
                                        <span className="font-medium">{app.score}/100</span>
                                      </div>
                                    )}
                                    {app.rating && (
                                      <div className="flex items-center">
                                        {renderStars(app.rating)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
                    <p className="text-sm text-gray-500 mb-4">This candidate hasn't applied to any positions</p>
                    <p className="text-xs text-gray-400">Applications will appear here when the candidate applies to jobs</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && candidate && (
            <div className="space-y-6">
              <TransactionHistory tableName="candidates" recordId={candidate.id} />
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Documents & Files</h3>
                <button onClick={() => setShowFileManager(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                  <Upload size={16} />
                  <span>Manage Files</span>
                </button>
              </div>

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
                              {file.is_primary && (<Star className="w-4 h-4 text-yellow-500 fill-current" />)}
                            </div>
                            <div className="text-xs text-gray-500">{file.file_category} • {formatDate(file.created_at)}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => window.open(file.file_url, '_blank')} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={16} /></button>
                          <a href={file.file_url} download={file.file_name} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"><Download size={16} /></a>
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
                            <div className="text-xs text-gray-500">{file.jobTitle} • {file.fileCategory} • {formatDate(file.uploadedAt)}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => window.open(file.fileUrl, '_blank')} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={16} /></button>
                          <a href={file.fileUrl} download={file.fileName} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"><Download size={16} /></a>
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
      </div>

      {showFileManager && candidate && (
        <CandidateFileManager
          candidateId={candidate.id}
          companyId={companyId}
          isOpen={showFileManager}
          onClose={() => {
            setShowFileManager(false);
            // refresh candidate files
            supabase
              .from('candidate_files')
              .select('*')
              .eq('candidate_id', candidate.id)
              .order('created_at', { ascending: false })
              .then(({ data }) => setCandidateFiles(data || []));
          }}
        />
      )}
    </div>
  );
};

export default CandidateProfilePage;
