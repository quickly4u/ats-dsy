import { supabase, getCurrentUserCompanyId } from './supabase';

export interface JobRequiredSkill {
  id?: string;
  job_id: string;
  skill_name: string;
  is_mandatory: boolean;
  experience_level?: string;
  created_at?: string;
  updated_at?: string;
}

// Save job required skills
export const saveJobRequiredSkills = async (jobId: string, skills: Omit<JobRequiredSkill, 'id' | 'job_id' | 'created_at' | 'updated_at'>[]) => {
  try {
    console.log('Saving skills for job:', jobId, 'Skills:', skills);
    
    // Validate skill names before processing
    const validSkills = skills.filter(skill => 
      skill.skill_name && 
      typeof skill.skill_name === 'string' && 
      skill.skill_name.trim().length > 0 &&
      !skill.skill_name.includes('@') // Basic email check
    );

    if (validSkills.length !== skills.length) {
      console.warn('Some skills were filtered out due to invalid names:', 
        skills.filter(s => !validSkills.includes(s)));
    }

    // Use RPC function for atomic delete and insert
    const { data, error } = await supabase.rpc('replace_job_skills', {
      p_job_id: jobId,
      p_skills: validSkills.map(skill => ({
        skill_name: skill.skill_name.trim(),
        is_mandatory: skill.is_mandatory,
        experience_level: skill.experience_level
      }))
    });

    if (error) {
      console.error('RPC error:', error);
      // Fallback to manual delete/insert if RPC doesn't exist
      if (error.code === '42883') { // function does not exist
        return await saveJobRequiredSkillsFallback(jobId, validSkills);
      }
      throw error;
    }

    console.log('Successfully replaced skills via RPC');
    return data || [];
  } catch (error) {
    console.error('Error saving job required skills:', error);
    throw error;
  }
};

// Fallback function with improved delete/insert logic
const saveJobRequiredSkillsFallback = async (jobId: string, skills: Omit<JobRequiredSkill, 'id' | 'job_id' | 'created_at' | 'updated_at'>[]) => {
  // Delete with a small delay to ensure completion
  const { error: deleteError } = await supabase
    .from('job_required_skills')
    .delete()
    .eq('job_id', jobId);

  if (deleteError) {
    console.error('Delete error:', deleteError);
    throw deleteError;
  }

  // Small delay to ensure delete is committed
  await new Promise(resolve => setTimeout(resolve, 100));

  // Insert new skills if any
  if (skills.length > 0) {
    const skillsToInsert = skills.map(skill => ({
      job_id: jobId,
      skill_name: skill.skill_name.trim(),
      is_mandatory: skill.is_mandatory,
      experience_level: skill.experience_level
    }));

    console.log('Inserting skills:', skillsToInsert);

    const { data, error } = await supabase
      .from('job_required_skills')
      .insert(skillsToInsert)
      .select();

    if (error) {
      console.error('Insert error:', error);
      throw error;
    }

    console.log('Successfully inserted', data?.length || 0, 'skills');
    return data;
  }

  return [];
};

// Get job required skills
export const getJobRequiredSkills = async (jobId: string): Promise<JobRequiredSkill[]> => {
  try {
    const { data, error } = await supabase
      .from('job_required_skills')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching job required skills:', error);
    throw error;
  }
};

// Get job spokes data using the view we created
export const getJobSpokesData = async (jobId: string) => {
  try {
    const { data, error } = await supabase
      .from('job_spokes_view')
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching job spokes data:', error);
    throw error;
  }
};

// Get active clients (for dropdowns)
export const getActiveClients = async () => {
  try {
    const companyId = await getCurrentUserCompanyId();
    if (!companyId) {
      throw new Error('User company not found');
    }

    const { data, error } = await supabase
      .from('clients')
      .select('id, name, status')
      .eq('status', 'active')
      .eq('company_id', companyId)
      .order('name');

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching active clients:', error);
    throw error;
  }
};

// Get external spocs for a client
export const getExternalSpocs = async (clientId: string) => {
  try {
    const companyId = await getCurrentUserCompanyId();
    if (!companyId) {
      throw new Error('User company not found');
    }

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('client_id', clientId)
      .eq('company_id', companyId)
      .eq('contact_type', 'external')
      .eq('is_active', true)
      .order('first_name');

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching external spocs:', error);
    throw error;
  }
};

// Get internal spocs for current company
export const getInternalSpocs = async () => {
  try {
    const companyId = await getCurrentUserCompanyId();
    if (!companyId) {
      throw new Error('User company not found');
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('first_name');

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching internal spocs:', error);
    throw error;
  }
};

// Create a new job
export const createJob = async (jobData: any) => {
  try {
    const companyId = await getCurrentUserCompanyId();
    if (!companyId) {
      throw new Error('User company not found');
    }

    const payload = {
      title: jobData.title,
      description: jobData.description,
      requirements: jobData.requirements,
      responsibilities: jobData.responsibilities,
      employment_type: jobData.employmentType,
      experience_level: jobData.experienceLevel,
      location: jobData.location,
      remote_type: jobData.remoteType,
      salary_min: typeof jobData.salaryMin === 'number' ? jobData.salaryMin : null,
      salary_max: typeof jobData.salaryMax === 'number' ? jobData.salaryMax : null,
      status: jobData.status || 'draft',
      expires_at: jobData.expiresAt ? new Date(jobData.expiresAt).toISOString() : null,
      company_id: companyId, // Always use current user's company
      client_id: jobData.clientId || null,
      external_spoc_id: jobData.externalSpocId || null,
      primary_internal_spoc_id: jobData.primaryInternalSpocId || null,
      secondary_internal_spoc_id: jobData.secondaryInternalSpocId || null,
      hiring_manager_id: jobData.hiringManagerId || null,
      min_experience_years: typeof jobData.minExperienceYears === 'number' ? jobData.minExperienceYears : null,
      education_level: jobData.educationLevel || null,
    };

    const { data, error } = await supabase
      .from('jobs')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

// Update an existing job
export const updateJob = async (jobId: string, jobData: any) => {
  try {
    const companyId = await getCurrentUserCompanyId();
    if (!companyId) {
      throw new Error('User company not found');
    }

    const payload: any = {
      title: jobData.title,
      description: jobData.description,
      requirements: jobData.requirements,
      responsibilities: jobData.responsibilities,
      employment_type: jobData.employmentType,
      experience_level: jobData.experienceLevel,
      location: jobData.location,
      remote_type: jobData.remoteType,
      salary_min: typeof jobData.salaryMin === 'number' ? jobData.salaryMin : null,
      salary_max: typeof jobData.salaryMax === 'number' ? jobData.salaryMax : null,
      status: jobData.status || 'draft',
      expires_at: jobData.expiresAt ? new Date(jobData.expiresAt).toISOString() : null,
      client_id: jobData.clientId || null,
      external_spoc_id: jobData.externalSpocId || null,
      primary_internal_spoc_id: jobData.primaryInternalSpocId || null,
      secondary_internal_spoc_id: jobData.secondaryInternalSpocId || null,
      hiring_manager_id: jobData.hiringManagerId || null,
      min_experience_years: typeof jobData.minExperienceYears === 'number' ? jobData.minExperienceYears : null,
      education_level: jobData.educationLevel || null,
    };

    const { data, error } = await supabase
      .from('jobs')
      .update(payload)
      .eq('id', jobId)
      .eq('company_id', companyId) // Ensure we only update jobs from current company
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating job:', error);
    throw error;
  }
};

// ---------------------------------------------
// Job Application Questions
// ---------------------------------------------

export interface JobApplicationQuestion {
  id?: string;
  job_id: string;
  company_id?: string;
  question: string;
  question_type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'file';
  is_required: boolean;
  options?: string[] | null;
  order_index?: number;
  created_at?: string;
  updated_at?: string;
}

export const getJobApplicationQuestions = async (jobId: string): Promise<JobApplicationQuestion[]> => {
  try {
    const { data, error } = await supabase
      .from('job_application_questions')
      .select('*')
      .eq('job_id', jobId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching job application questions:', error);
    throw error;
  }
};

type SimpleQuestion = { question: string; type: string; required: boolean; options?: string[] };

export const saveJobApplicationQuestions = async (jobId: string, questions: SimpleQuestion[]) => {
  try {
    // First, attempt to use the RPC for atomic replace
    const payload = (questions || []).map((q, idx) => ({
      question: (q.question || '').trim(),
      type: (q.type || 'text'),
      required: !!q.required,
      options: q.options && q.options.length ? q.options : undefined,
      order_index: idx
    }));

    const { error } = await supabase.rpc('replace_job_questions', {
      p_job_id: jobId,
      p_questions: payload
    });

    if (error) {
      console.warn('RPC replace_job_questions failed, attempting fallback. Error:', error);

      // Fallback: delete existing then insert new
      const { error: delErr } = await supabase
        .from('job_application_questions')
        .delete()
        .eq('job_id', jobId);
      if (delErr) throw delErr;

      if (payload.length > 0) {
        const { error: insErr } = await supabase
          .from('job_application_questions')
          .insert(payload.map((q) => ({
            job_id: jobId,
            question: q.question,
            question_type: q.type,
            is_required: q.required,
            options: q.options ?? null,
            order_index: q.order_index
          })));
        if (insErr) throw insErr;
      }
    }

    return true;
  } catch (error) {
    console.error('Error saving job application questions:', error);
    throw error;
  }
};
