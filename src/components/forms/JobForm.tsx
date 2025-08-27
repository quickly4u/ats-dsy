import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Building2, 
  Calendar,
  Users,
  FileText,
  Settings,
  Plus,
  Trash2,
  Star
} from 'lucide-react';
import type { Job } from '../../types';
import { saveJobRequiredSkills, getJobRequiredSkills, getExternalSpocs, getInternalSpocs, getActiveClients } from '../../lib/jobSkillsApi';
import { getCurrentUserCompanyId } from '../../lib/supabase';

interface JobFormProps {
  job?: Job;
  isOpen: boolean;
  onClose: () => void;
  onSave: (jobData: Partial<Job>) => Promise<any>;
}

const JobForm: React.FC<JobFormProps> = ({ job, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: job?.title || '',
    clientId: job?.client?.id || '',
    externalSpocId: job?.externalSpoc?.id || '',
    primaryInternalSpocId: job?.primaryInternalSpoc?.id || '',
    secondaryInternalSpocId: job?.secondaryInternalSpoc?.id || '',
    departmentId: job?.department?.id || '',
    hiringManagerId: job?.hiringManager?.id || '',
    description: job?.description || '',
    requirements: job?.requirements || '',
    responsibilities: job?.responsibilities || '',
    employmentType: job?.employmentType || 'full-time',
    experienceLevel: job?.experienceLevel || 'mid',
    location: job?.location || '',
    remoteType: job?.remoteType || 'hybrid',
    salaryMin: job?.salaryMin?.toString() || '',
    salaryMax: job?.salaryMax?.toString() || '',
    status: job?.status || 'draft',
    expiresAt: job?.expiresAt ? new Date(job.expiresAt).toISOString().split('T')[0] : '',
    requiredSkills: [] as { name: string; isMandatory: boolean; experienceLevel?: string }[],
    benefits: [] as string[],
    customQuestions: [] as { question: string; type: string; required: boolean }[]
  });

  const [currentSkill, setCurrentSkill] = useState('');
  const [currentSkillLevel, setCurrentSkillLevel] = useState('intermediate');
  const [currentBenefit, setCurrentBenefit] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [externalSpocs, setExternalSpocs] = useState<any[]>([]);
  const [internalSpocs, setInternalSpocs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingExternalSpocs, setLoadingExternalSpocs] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loadingClients, setLoadingClients] = useState<boolean>(false);
  const [clientsError, setClientsError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingClients(true);
        setClientsError(null);
        const companyId = await getCurrentUserCompanyId();
        if (companyId) {
          const [internalSpocsData, activeClients] = await Promise.all([
            getInternalSpocs(),
            getActiveClients()
          ]);
          setInternalSpocs(internalSpocsData);
          setClients((activeClients || []).map((c: any) => ({ id: c.id, name: c.name })));
        } else {
          const activeClients = await getActiveClients();
          setClients((activeClients || []).map((c: any) => ({ id: c.id, name: c.name })));
        }
        
        if (job?.id) {
          const existingSkills = await getJobRequiredSkills(job.id);
          const mappedSkills = existingSkills.map(skill => ({
            name: skill.skill_name,
            isMandatory: skill.is_mandatory,
            experienceLevel: skill.experience_level
          }));
          setFormData(prev => ({ ...prev, requiredSkills: mappedSkills }));
        }
      } catch (error: any) {
        console.error('Error loading data:', error);
        setClients([]);
        setClientsError(error?.message || 'Failed to load clients');
      } finally {
        setLoadingClients(false);
      }
    };
    
    if (isOpen) {
      loadData();
    }
  }, [isOpen, job?.id]);

  useEffect(() => {
    const loadExternalSpocs = async () => {
      if (formData.clientId) {
        setLoadingExternalSpocs(true);
        try {
          const spocsData = await getExternalSpocs(formData.clientId);
          setExternalSpocs(spocsData);
        } catch (error) {
          console.error('Error loading external spocs:', error);
          setExternalSpocs([]);
        } finally {
          setLoadingExternalSpocs(false);
        }
      } else {
        setExternalSpocs([]);
        setFormData(prev => ({ ...prev, externalSpocId: '' }));
      }
    };
    
    loadExternalSpocs();
  }, [formData.clientId]);

  const mockDepartments = [
    { id: '1', name: 'Engineering' },
    { id: '2', name: 'Marketing' },
    { id: '3', name: 'Sales' },
    { id: '4', name: 'Design' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const companyId = await getCurrentUserCompanyId();
      if (!companyId) {
        throw new Error('Your user is not associated with any company. Cannot create or update job.');
      }

      const jobData = {
        ...formData,
        salaryMin: formData.salaryMin ? Number(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? Number(formData.salaryMax) : undefined,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined,
        employmentType: formData.employmentType as 'full-time' | 'part-time' | 'contract' | 'internship',
        experienceLevel: formData.experienceLevel as 'entry' | 'mid' | 'senior' | 'executive',
        remoteType: formData.remoteType as 'remote' | 'hybrid' | 'on-site',
        status: formData.status as 'draft' | 'published' | 'paused' | 'closed',
        companyId,
      };
      
      const savedJob = await onSave(jobData);
      
      const targetJobId = job?.id || savedJob?.id;
      if (targetJobId) {
        const skillsToSave = formData.requiredSkills.map(skill => ({
          skill_name: skill.name,
          is_mandatory: skill.isMandatory,
          experience_level: skill.experienceLevel
        }));
        await saveJobRequiredSkills(targetJobId, skillsToSave);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving job:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addRequiredSkill = () => {
    if (currentSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, {
          name: currentSkill.trim(),
          isMandatory: false,
          experienceLevel: currentSkillLevel
        }]
      }));
      setCurrentSkill('');
    }
  };

  const removeRequiredSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((_, i) => i !== index)
    }));
  };

  const toggleSkillMandatory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.map((skill, i) => 
        i === index ? { ...skill, isMandatory: !skill.isMandatory } : skill
      )
    }));
  };

  const addBenefit = () => {
    if (currentBenefit.trim()) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, currentBenefit.trim()]
      }));
      setCurrentBenefit('');
    }
  };

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const addCustomQuestion = () => {
    setFormData(prev => ({
      ...prev,
      customQuestions: [...prev.customQuestions, { question: '', type: 'text', required: false }]
    }));
  };

  const updateCustomQuestion = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const removeCustomQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: FileText },
    { id: 'details', label: 'Job Details', icon: Settings },
    { id: 'team', label: 'Team & SPOCs', icon: Users },
    { id: 'requirements', label: 'Requirements', icon: Building2 },
    { id: 'application', label: 'Application', icon: Calendar }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            {job ? 'Edit Job' : 'Create New Job'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 flex-shrink-0">
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
                </button>
              );
            })}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Senior Software Engineer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client *
                    </label>
                    <select
                      required
                      value={formData.clientId}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                      disabled={loadingClients || !!clientsError}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {loadingClients ? 'Loading clients...' : clientsError ? 'Failed to load clients' : 'Select Client'}
                      </option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                    {clientsError && (
                      <p className="text-xs text-red-600 mt-1">{clientsError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department *
                    </label>
                    <select
                      required
                      value={formData.departmentId}
                      onChange={(e) => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Department</option>
                      {mockDepartments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employment Type *
                    </label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) => setFormData(prev => ({ ...prev, employmentType: e.target.value as 'full-time' | 'part-time' | 'contract' | 'internship' }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience Level *
                    </label>
                    <select
                      value={formData.experienceLevel}
                      onChange={(e) => setFormData(prev => ({ ...prev, experienceLevel: e.target.value as 'entry' | 'mid' | 'senior' | 'executive' }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="entry">Entry Level</option>
                      <option value="mid">Mid Level</option>
                      <option value="senior">Senior Level</option>
                      <option value="executive">Executive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. San Francisco, CA"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Remote Type *
                    </label>
                    <select
                      value={formData.remoteType}
                      onChange={(e) => setFormData(prev => ({ ...prev, remoteType: e.target.value as 'remote' | 'hybrid' | 'on-site' }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="on-site">On-site</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' | 'paused' | 'closed' }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="paused">Paused</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Salary
                    </label>
                    <input
                      type="number"
                      value={formData.salaryMin}
                      onChange={(e) => setFormData(prev => ({ ...prev, salaryMin: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 80000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Salary
                    </label>
                    <input
                      type="number"
                      value={formData.salaryMax}
                      onChange={(e) => setFormData(prev => ({ ...prev, salaryMax: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 120000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Job Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the role, company culture, and what makes this opportunity exciting..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Responsibilities *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.responsibilities}
                    onChange={(e) => setFormData(prev => ({ ...prev, responsibilities: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="• Lead development of new features&#10;• Collaborate with cross-functional teams&#10;• Mentor junior developers"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requirements & Qualifications *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.requirements}
                    onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="• Bachelor's degree in Computer Science&#10;• 5+ years of software development experience&#10;• Proficiency in React and Node.js"
                  />
                </div>

                {/* Required Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Skills
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-3">Add New Skill</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          value={currentSkill}
                          onChange={(e) => setCurrentSkill(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequiredSkill())}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter skill name (e.g., React, Python, SQL)"
                        />
                      </div>
                      <div>
                        <select
                          value={currentSkillLevel}
                          onChange={(e) => setCurrentSkillLevel(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                          <option value="expert">Expert</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addRequiredSkill}
                      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <Plus size={16} />
                      <span>Add Skill</span>
                    </button>
                  </div>
                  
                  {/* Skills List */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Mandatory Skills */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                          <Star className="text-yellow-500" size={16} fill="currentColor" />
                          <span>Mandatory Skills</span>
                        </h4>
                        <div className="space-y-2 min-h-[100px] border border-gray-200 rounded-lg p-3">
                          {formData.requiredSkills.filter(skill => skill.isMandatory).map((skill) => {
                            const originalIndex = formData.requiredSkills.findIndex(s => s === skill);
                            return (
                              <div
                                key={originalIndex}
                                className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                              >
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleSkillMandatory(originalIndex)}
                                    className="text-yellow-500 hover:text-yellow-600"
                                  >
                                    <Star size={14} fill="currentColor" />
                                  </button>
                                  <span className="font-medium text-red-800">{skill.name}</span>
                                  <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                                    {skill.experienceLevel}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeRequiredSkill(originalIndex)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            );
                          })}
                          {formData.requiredSkills.filter(skill => skill.isMandatory).length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">No mandatory skills added</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Non-Mandatory Skills */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                          <Star className="text-gray-400" size={16} />
                          <span>Non-Mandatory Skills</span>
                        </h4>
                        <div className="space-y-2 min-h-[100px] border border-gray-200 rounded-lg p-3">
                          {formData.requiredSkills.filter(skill => !skill.isMandatory).map((skill) => {
                            const originalIndex = formData.requiredSkills.findIndex(s => s === skill);
                            return (
                              <div
                                key={originalIndex}
                                className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"
                              >
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleSkillMandatory(originalIndex)}
                                    className="text-gray-400 hover:text-yellow-500"
                                  >
                                    <Star size={14} />
                                  </button>
                                  <span className="font-medium text-blue-800">{skill.name}</span>
                                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                    {skill.experienceLevel}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeRequiredSkill(originalIndex)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            );
                          })}
                          {formData.requiredSkills.filter(skill => !skill.isMandatory).length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">No non-mandatory skills added</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {formData.requiredSkills.length > 0 && (
                      <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="flex items-center space-x-1">
                          <Star className="text-yellow-500" size={14} fill="currentColor" />
                          <span>Click the star icon to toggle between mandatory and non-mandatory skills</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Benefits & Perks
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={currentBenefit}
                      onChange={(e) => setCurrentBenefit(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add a benefit"
                    />
                    <button
                      type="button"
                      onClick={addBenefit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.benefits.map((benefit, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center space-x-1"
                      >
                        <span>{benefit}</span>
                        <button
                          type="button"
                          onClick={() => removeBenefit(index)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Team & SPOCs Tab */}
            {activeTab === 'team' && (
              <div className="space-y-6">
                {/* Row 1: External SPOC and Hiring Manager */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-4 flex items-center space-x-2">
                    <Users size={16} />
                    <span>External Team & Hiring Manager</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        External SPOC *
                      </label>
                      <select
                        required
                        value={formData.externalSpocId}
                        onChange={(e) => setFormData(prev => ({ ...prev, externalSpocId: e.target.value }))}
                        disabled={!formData.clientId || loadingExternalSpocs}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {!formData.clientId 
                            ? 'Select a client first' 
                            : loadingExternalSpocs 
                            ? 'Loading external SPOCs...' 
                            : 'Select External SPOC'
                          }
                        </option>
                        {externalSpocs.map(spoc => (
                          <option key={spoc.id} value={spoc.id}>
                            {spoc.first_name} {spoc.last_name} ({spoc.designation})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {!formData.clientId 
                          ? 'Please select a client in the Basic Info tab first' 
                          : 'Client-side point of contact'
                        }
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hiring Manager *
                      </label>
                      <select
                        required
                        value={formData.hiringManagerId}
                        onChange={(e) => setFormData(prev => ({ ...prev, hiringManagerId: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Hiring Manager</option>
                        {internalSpocs.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Decision maker for this role</p>
                    </div>
                  </div>
                </div>

                {/* Row 2: Internal SPOCs */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-4 flex items-center space-x-2">
                    <Users size={16} />
                    <span>Internal SPOCs</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Internal SPOC *
                      </label>
                      <select
                        required
                        value={formData.primaryInternalSpocId}
                        onChange={(e) => setFormData(prev => ({ ...prev, primaryInternalSpocId: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Primary Internal SPOC</option>
                        {internalSpocs.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Main internal coordinator</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secondary Internal SPOC
                      </label>
                      <select
                        value={formData.secondaryInternalSpocId}
                        onChange={(e) => setFormData(prev => ({ ...prev, secondaryInternalSpocId: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Secondary Internal SPOC</option>
                        {internalSpocs.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Backup internal coordinator</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Requirements Tab */}
            {activeTab === 'requirements' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Screening Requirements</h3>
                  <p className="text-sm text-blue-700">
                    Set up automatic screening criteria to filter applications before they reach your pipeline.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Years of Experience
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Education Level
                    </label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Any</option>
                      <option value="high-school">High School</option>
                      <option value="associate">Associate Degree</option>
                      <option value="bachelor">Bachelor's Degree</option>
                      <option value="master">Master's Degree</option>
                      <option value="phd">PhD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Require work authorization</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Require portfolio/work samples</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Require cover letter</span>
                  </label>
                </div>
              </div>
            )}

            {/* Application Tab */}
            {activeTab === 'application' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Custom Application Questions</h3>
                    <button
                      type="button"
                      onClick={addCustomQuestion}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <Plus size={16} />
                      <span>Add Question</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.customQuestions.map((question, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeCustomQuestion(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Question
                            </label>
                            <input
                              type="text"
                              value={question.question}
                              onChange={(e) => updateCustomQuestion(index, 'question', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter your question"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Type
                            </label>
                            <select
                              value={question.type}
                              onChange={(e) => updateCustomQuestion(index, 'type', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="text">Text</option>
                              <option value="textarea">Long Text</option>
                              <option value="select">Multiple Choice</option>
                              <option value="radio">Single Choice</option>
                              <option value="checkbox">Checkbox</option>
                              <option value="file">File Upload</option>
                            </select>
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={question.required}
                              onChange={(e) => updateCustomQuestion(index, 'required', e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700">Required</span>
                          </label>
                        </div>
                      </div>
                    ))}

                    {formData.customQuestions.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No custom questions</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Add custom questions to gather specific information from applicants.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Save size={16} />
              <span>{isLoading ? 'Saving...' : (job ? 'Update Job' : 'Create Job')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobForm;