import React, { useEffect, useRef, useState } from 'react';
import { 
  X, 
  Save, 
  User, 
  Briefcase,
  GraduationCap,
  Plus,
  Upload,
  Star,
  Sparkles
} from 'lucide-react';
import type { Candidate } from '../../types';
import { useFileUpload } from '../../hooks/useFileUpload';
import { getCurrentUserCompanyId } from '../../lib/supabase';

interface CandidateFormProps {
  candidate?: Candidate;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    candidateData: Partial<Candidate>,
    extras?: {
      resumeFile?: File;
      education?: { institution: string; degree: string; field: string; startDate: string; endDate: string }[];
    }
  ) => void;
}

const CandidateForm: React.FC<CandidateFormProps> = ({ candidate, isOpen, onClose, onSave }) => {
  const [companyId, setCompanyId] = useState<string>('');
  useEffect(() => { (async () => { const id = await getCurrentUserCompanyId(); if (id) setCompanyId(id); })(); }, []);
  const { uploadFile, uploading } = useFileUpload({ candidateId: candidate?.id || '', companyId: companyId || '' });
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [pendingResumeFile, setPendingResumeFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: candidate?.firstName || '',
    lastName: candidate?.lastName || '',
    email: candidate?.email || '',
    phone: candidate?.phone || '',
    location: candidate?.location || '',
    city: (candidate as any)?.city || '',
    state: (candidate as any)?.state || '',
    linkedinUrl: candidate?.linkedinUrl || '',
    currentCompany: candidate?.currentCompany || '',
    currentTitle: candidate?.currentTitle || '',
    experienceYears: candidate?.experienceYears || '',
    summary: candidate?.summary || '',
    source: candidate?.source || 'manual',
    skills: candidate?.skills || [],
    workExperience: [] as { company: string; title: string; startDate: string; endDate: string; description: string }[],
    education: [] as { institution: string; degree: string; field: string; startDate: string; endDate: string }[],
    languages: [] as { language: string; proficiency: string }[],
    certifications: [] as { name: string; issuer: string; date: string; url: string }[]
  });

  const [activeTab, setActiveTab] = useState('documents');
  const [currentSkill, setCurrentSkill] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const experiences = formData.workExperience.map(exp => ({
      company: exp.company,
      title: exp.title,
      location: (exp as any).location || '',
      startDate: exp.startDate,
      endDate: exp.endDate,
      description: exp.description
    }));
    const education = formData.education.map(edu => ({
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      startDate: edu.startDate,
      endDate: edu.endDate
    }));
    const payload: Partial<Candidate> = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone || undefined,
      location: formData.location || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      linkedinUrl: formData.linkedinUrl || undefined,
      currentCompany: formData.currentCompany || undefined,
      currentTitle: formData.currentTitle || undefined,
      experienceYears: formData.experienceYears ? Number(formData.experienceYears) : undefined,
      summary: formData.summary || undefined,
      source: formData.source,
      skills: formData.skills,
      experiences
    } as any;
    onSave(
      payload,
      {
        ...(pendingResumeFile ? { resumeFile: pendingResumeFile } : {}),
        ...(education.length ? { education } : {})
      }
    );
    onClose();
  };

  const addSkill = () => {
    if (currentSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()]
      }));
      setCurrentSkill('');
    }
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  // Tags removed as per requirements

  const addWorkExperience = () => {
    setFormData(prev => ({
      ...prev,
      workExperience: [...prev.workExperience, {
        company: '',
        title: '',
        location: '',
        startDate: '',
        endDate: '',
        description: ''
      }]
    }));
  };

  const updateWorkExperience = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeWorkExperience = (index: number) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, {
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: ''
      }]
    }));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const handleParseResume = async () => {
    console.log('🚀 handleParseResume called');
    
    if (!pendingResumeFile) {
      console.log('❌ No resume file attached');
      alert('Please upload a resume first');
      return;
    }

    console.log('📄 Resume file:', pendingResumeFile.name, pendingResumeFile.type, pendingResumeFile.size);
    setIsParsing(true);
    
    try {
      const formDataPayload = new FormData();
      formDataPayload.append('file', pendingResumeFile);
      
      console.log('📤 Sending request to webhook...');
      console.log('🔗 URL: https://n8n.srv1025472.hstgr.cloud/webhook/14605853-ee86-4549-9634-9e8ed45ecac3');

      const response = await fetch('https://n8n.srv1025472.hstgr.cloud/webhook/14605853-ee86-4549-9634-9e8ed45ecac3', {
        method: 'POST',
        body: formDataPayload,
      });

      console.log('📥 Response received:', response.status, response.statusText);

      if (!response.ok) {
        console.error('❌ Response not OK:', response.status, response.statusText);
        throw new Error(`Failed to parse resume: ${response.status} ${response.statusText}`);
      }

      const rawData = await response.json();
      console.log('✅ Raw data received:', rawData);
      
      // Extract data from array (webhook returns array with single object)
      const data = Array.isArray(rawData) ? rawData[0] : rawData;
      console.log('📋 Extracted data:', data);
      
      // Parse skills from comma-separated string to array
      const skillsString = data['Skills of the candidate '] || data['Skills of the candidate'] || '';
      const parsedSkills = skillsString 
        ? skillsString.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
        : [];
      
      // Parse education entries (Education 0, Education 1, etc.)
      const parsedEducation: any[] = [];
      for (let i = 0; i < 10; i++) {
        const eduKey = `Education ${i}`;
        const edu = data[eduKey];
        if (edu && Object.keys(edu).length > 0) {
          // Convert graduation year to proper date format
          const gradYear = edu['Graduation Year'] || '';
          let endDate = '';
          if (gradYear) {
            // Extract year from strings like "July 2023" or "2023"
            const yearMatch = gradYear.match(/\d{4}/);
            if (yearMatch) {
              // Use July 1st as default graduation date
              endDate = `${yearMatch[0]}-07-01`;
            }
          }
          
          parsedEducation.push({
            institution: edu['Graduation Institution '] || edu['Graduation Institution'] || '',
            degree: edu['Graduation Degree of the candidate'] || '',
            field: edu['Field of Study'] || '',
            startDate: '',
            endDate: endDate
          });
        }
      }
      
      // Parse work experience entries (Experience 0, Experience 1, etc.)
      const parsedExperience: any[] = [];
      
      // Experience 0 has different field names
      const exp0 = data['Experience 0 '] || data['Experience 0'];
      if (exp0 && Object.keys(exp0).length > 0) {
        parsedExperience.push({
          company: exp0['Company_0'] || '',
          title: exp0['Company_0 Job tittle'] || '',
          location: exp0['Company_0 city'] || '',
          startDate: exp0['Company_0 job start date'] || '',
          endDate: exp0['Company_0 job end date'] || '',
          description: exp0['Experience description of Company_0 '] || exp0['Experience description of Company_0'] || ''
        });
      }
      
      // Experience 1 (Second Company)
      const exp1 = data['Experience 1'];
      if (exp1 && Object.keys(exp1).length > 0) {
        parsedExperience.push({
          company: exp1['Second Company name'] || '',
          title: exp1['Second Company Job tittle'] || '',
          location: exp1['Second Company city'] || '',
          startDate: exp1['Second Company job start date'] || '',
          endDate: exp1['Second Company job end date'] || '',
          description: exp1['Experience description of Second Company'] || ''
        });
      }
      
      // Experience 2 (Third Company)
      const exp2 = data['Experience 2'];
      if (exp2 && Object.keys(exp2).length > 0) {
        parsedExperience.push({
          company: exp2['Third Company name'] || '',
          title: exp2['Third Company Job tittle'] || '',
          location: exp2['Third Company city'] || '',
          startDate: exp2['Third Company job start date'] || '',
          endDate: exp2['Third Company job end date'] || '',
          description: exp2['Experience description of Third Company'] || ''
        });
      }
      
      // Experience 3 (Fourth Company)
      const exp3 = data['Experience 3'];
      if (exp3 && Object.keys(exp3).length > 0) {
        parsedExperience.push({
          company: exp3['Fourth Company name'] || '',
          title: exp3['Fourth Company Job tittle'] || '',
          location: exp3['Fourth Company city'] || '',
          startDate: exp3['Fourth Company job start date'] || '',
          endDate: exp3['Fourth Company job end date'] || '',
          description: exp3['Experience description of Fourth Company'] || ''
        });
      }
      
      console.log('🎓 Parsed education:', parsedEducation);
      console.log('💼 Parsed experience:', parsedExperience);
      console.log('🔧 Parsed skills:', parsedSkills);
      
      // Autofill form with parsed data
      setFormData(prev => ({
        ...prev,
        firstName: data['First name'] || prev.firstName,
        lastName: data['Last Name'] || prev.lastName,
        email: data['Email Address'] || prev.email,
        phone: data['Phone Number'] || prev.phone,
        location: prev.location, // Keep existing location
        city: data['City'] || prev.city,
        state: data['State'] || prev.state,
        linkedinUrl: data['Linkedin '] || data['Linkedin'] || prev.linkedinUrl,
        currentCompany: data['Current Company'] || prev.currentCompany,
        currentTitle: data['Job tittle'] || prev.currentTitle,
        experienceYears: data['Years of Experience'] || prev.experienceYears,
        summary: data['Summary'] || prev.summary,
        skills: parsedSkills.length > 0 ? parsedSkills : prev.skills,
        workExperience: parsedExperience.length > 0 ? parsedExperience : prev.workExperience,
        education: parsedEducation.length > 0 ? parsedEducation : prev.education,
      }));

      console.log('✅ Form data updated successfully');
      alert('Resume parsed successfully! Form has been autofilled.');
      setActiveTab('basic'); // Switch to basic info tab to show parsed data
    } catch (error) {
      console.error('❌ Error parsing resume:', error);
      alert(`Failed to parse resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsParsing(false);
      console.log('🏁 Parsing complete');
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'documents', label: 'Documents', icon: Upload },
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Star }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            {candidate ? 'Edit Candidate' : 'Add New Candidate'}
          </h2>
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
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="john.doe@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="San Francisco"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="California"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Full address or additional location info"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.experienceYears}
                      onChange={(e) => setFormData(prev => ({ ...prev, experienceYears: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      value={formData.linkedinUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://linkedin.com/in/johndoe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Company
                    </label>
                    <input
                      type="text"
                      value={formData.currentCompany}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentCompany: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Google"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Title
                    </label>
                    <input
                      type="text"
                      value={formData.currentTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentTitle: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Senior Software Engineer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Source
                    </label>
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="manual">Manual Entry</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="indeed">Indeed</option>
                      <option value="referral">Referral</option>
                      <option value="company-website">Company Website</option>
                      <option value="job-board">Job Board</option>
                      <option value="social-media">Social Media</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Professional Summary
                  </label>
                  <textarea
                    rows={4}
                    value={formData.summary}
                    onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief summary of the candidate's background, skills, and career objectives..."
                  />
                </div>
              </div>
            )}

            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Work Experience</h3>
                  <button
                    type="button"
                    onClick={addWorkExperience}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>Add Experience</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.workExperience.map((exp, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Experience {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeWorkExperience(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Company
                          </label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Company name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Job Title
                          </label>
                          <input
                            type="text"
                            value={exp.title}
                            onChange={(e) => updateWorkExperience(index, 'title', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Job title"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location
                          </label>
                          <input
                            type="text"
                            value={(exp as any).location || ''}
                            onChange={(e) => updateWorkExperience(index, 'location', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="City, Country"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={exp.startDate}
                            onChange={(e) => updateWorkExperience(index, 'startDate', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={exp.endDate}
                            onChange={(e) => updateWorkExperience(index, 'endDate', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={exp.description}
                          onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Key responsibilities and achievements..."
                        />
                      </div>
                    </div>
                  ))}

                  {formData.workExperience.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No work experience added</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Add the candidate's work history and experience.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Education Tab */}
            {activeTab === 'education' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Education</h3>
                  <button
                    type="button"
                    onClick={addEducation}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>Add Education</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.education.map((edu, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Education {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeEducation(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Institution
                          </label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="University name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Degree
                          </label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Bachelor's, Master's, etc."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Field of Study
                          </label>
                          <input
                            type="text"
                            value={edu.field}
                            onChange={(e) => updateEducation(index, 'field', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Computer Science, Business, etc."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Graduation Year
                          </label>
                          <input
                            type="date"
                            value={edu.endDate}
                            onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {formData.education.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No education added</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Add the candidate's educational background.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div className="space-y-6">
                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={currentSkill}
                      onChange={(e) => setCurrentSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add a skill"
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center space-x-1"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(index)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tags section removed */}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resume/CV
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <input
                        ref={resumeInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files && e.target.files[0];
                          if (!file) return;
                          if (candidate?.id && companyId) {
                            await uploadFile(file, 'resume', true);
                          } else {
                            setPendingResumeFile(file);
                          }
                          e.currentTarget.value = '';
                        }}
                      />
                      <div className="mt-4 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => { resumeInputRef.current?.click(); }}
                          disabled={uploading}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                        >
                          {uploading ? 'Uploading...' : (pendingResumeFile ? 'Change Attached Resume' : 'Upload Resume')}
                        </button>
                        
                        {pendingResumeFile && (
                          <button
                            type="button"
                            onClick={handleParseResume}
                            disabled={isParsing || uploading}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 font-medium"
                          >
                            <Sparkles size={18} />
                            {isParsing ? 'Parsing Resume...' : 'Autofill with Parser'}
                          </button>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        PDF, DOC, or DOCX up to 10MB
                      </p>
                      {!candidate?.id && pendingResumeFile && (
                        <p className="mt-2 text-xs text-gray-600">Attached: <strong>{pendingResumeFile.name}</strong> (will upload on Save)</p>
                      )}
                    </div>
                  </div>

                  {/* Additional Documents section removed */}
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Save size={16} />
              <span>{candidate ? 'Update Candidate' : 'Add Candidate'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CandidateForm;