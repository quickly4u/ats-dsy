import { useState, useEffect } from 'react';
import type { 
  Job, 
  Candidate, 
  Application, 
  Interview, 
  RecruitmentMetrics,
  FilterOptions
} from '../types';
import { supabase, getCurrentUserCompanyId } from '../lib/supabase';

// Mock data generators removed - now using real Supabase data

export const useJobs = (filters?: FilterOptions) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true);
        
        // Get current user's company ID
        const companyId = await getCurrentUserCompanyId();
        if (!companyId) {
          throw new Error('User company not found');
        }
        
        // Fetch jobs from Supabase filtered by company_id
        const { data: jobRows, error: jobError } = await supabase
          .from('jobs')
          .select(`
            id,
            title,
            description,
            requirements,
            responsibilities,
            employment_type,
            experience_level,
            location,
            remote_type,
            salary_min,
            salary_max,
            status,
            published_at,
            expires_at,
            created_at,
            client_id,
            company_id
          `)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });

        if (jobError) {
          throw jobError;
        }

        // Transform to Job type (simplified without complex relations for now)
        let result: Job[] = (jobRows || []).map((j: any) => ({
          id: j.id,
          clientId: j.client_id || '',
          client: {
            id: j.client_id || '',
            name: 'Client Name', // Would need separate client fetch
            companyName: 'Company Name',
            industry: 'Technology',
            contactInfo: { email: '', phone: '' },
            address: { street: '', city: '', state: '', country: '', zipCode: '' },
            contractDetails: {
              startDate: new Date(),
              endDate: undefined,
              contractType: 'retainer',
              paymentTerms: '',
              isExclusive: false,
              includesBackgroundCheck: false,
              hasReplacementGuarantee: false,
              replacementGuaranteeDays: undefined,
              hasConfidentialityAgreement: false,
              additionalTerms: undefined,
            },
            status: 'active',
            totalJobs: 0,
            activeJobs: 0,
            successfulPlacements: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          externalSpocId: '',
          externalSpoc: {
            id: '', clientId: '', client: {} as any, firstName: '', lastName: '', 
            email: '', designation: '', isPrimary: false, isActive: true, 
            createdAt: new Date(), updatedAt: new Date()
          },
          primaryInternalSpocId: '',
          primaryInternalSpoc: {
            id: '', userId: '', user: {} as any, level: 'primary', clientIds: [], 
            clients: [], isActive: true, assignedAt: new Date(), assignedBy: ''
          },
          assignedRecruiters: [],
          title: j.title,
          department: { id: '', name: 'General', isActive: true },
          description: j.description,
          requirements: j.requirements,
          responsibilities: j.responsibilities,
          employmentType: j.employment_type,
          experienceLevel: j.experience_level,
          location: j.location,
          remoteType: j.remote_type,
          salaryMin: j.salary_min,
          salaryMax: j.salary_max,
          status: j.status,
          publishedAt: j.published_at ? new Date(j.published_at) : undefined,
          expiresAt: j.expires_at ? new Date(j.expires_at) : undefined,
          hiringManager: {
            id: '', email: '', firstName: '', lastName: '', company: {} as any,
            roles: [], isActive: true, createdAt: new Date()
          },
          applicationsCount: 0, // Would need separate count query
          viewsCount: 0,
          createdAt: j.created_at ? new Date(j.created_at) : new Date(),
        }));

        // Apply filters
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          result = result.filter(job => 
            job.title.toLowerCase().includes(q) ||
            job.description.toLowerCase().includes(q)
          );
        }
        if (filters?.status?.length) {
          result = result.filter(job => filters.status!.includes(job.status));
        }
        if (filters?.employmentType?.length) {
          result = result.filter(job => filters.employmentType!.includes(job.employmentType));
        }
        if (filters?.experienceLevel?.length) {
          result = result.filter(job => filters.experienceLevel!.includes(job.experienceLevel));
        }
        if (filters?.remoteType?.length) {
          result = result.filter(job => filters.remoteType!.includes(job.remoteType));
        }
        if (filters?.location?.length) {
          const locs = filters.location.map(l => l.toLowerCase());
          result = result.filter(job => locs.some(l => job.location?.toLowerCase().includes(l)));
        }

        setJobs(result);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching jobs:', err);
        setError(`Failed to fetch jobs: ${err.message}`);
        setJobs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [filters]);

  return { jobs, isLoading, error };
};

export const useCandidates = (filters?: FilterOptions) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setIsLoading(true);
        
        // Get current user's company ID
        const companyId = await getCurrentUserCompanyId();
        if (!companyId) {
          throw new Error('User company not found');
        }
        
        // Fetch candidates from Supabase with basic fields only, filtered by company_id
        const { data: candidateRows, error: candidateError } = await supabase
          .from('candidates')
          .select(`
            id,
            email,
            first_name,
            last_name,
            phone,
            location,
            linkedin_url,
            portfolio_url,
            current_company,
            current_title,
            experience_years,
            summary,
            avatar,
            resume_url,
            source,
            rating,
            is_blacklisted,
            gdpr_consent,
            created_at,
            company_id
          `)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });

        if (candidateError) {
          throw candidateError;
        }

        // Fetch skills separately to avoid complex joins
        const candidateIds = candidateRows?.map(c => c.id) || [];
        let skillsByCandidate: Record<string, string[]> = {};
        
        if (candidateIds.length > 0) {
          const { data: skillRows, error: skillError } = await supabase
            .from('candidate_skills')
            .select('candidate_id, skill')
            .in('candidate_id', candidateIds);
          
          if (!skillError && skillRows) {
            skillsByCandidate = skillRows.reduce((acc: Record<string, string[]>, row: any) => {
              if (!acc[row.candidate_id]) acc[row.candidate_id] = [];
              acc[row.candidate_id].push(row.skill);
              return acc;
            }, {});
          }
        }

        // Transform to our Candidate type
        let result: Candidate[] = (candidateRows || []).map((c: any) => ({
          id: c.id,
          email: c.email,
          firstName: c.first_name,
          lastName: c.last_name,
          phone: c.phone || undefined,
          location: c.location || undefined,
          linkedinUrl: c.linkedin_url || undefined,
          portfolioUrl: c.portfolio_url || undefined,
          currentCompany: c.current_company || undefined,
          currentTitle: c.current_title || undefined,
          experienceYears: c.experience_years || undefined,
          skills: skillsByCandidate[c.id] || [],
          summary: c.summary || undefined,
          avatar: c.avatar || undefined,
          resumeUrl: c.resume_url || undefined,
          source: c.source || 'Unknown',
          tags: [], // Tags might be in a separate table
          rating: c.rating || undefined,
          isBlacklisted: !!c.is_blacklisted,
          gdprConsent: !!c.gdpr_consent,
          createdAt: c.created_at ? new Date(c.created_at) : new Date(),
        }));

        // Apply filters
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          result = result.filter(candidate => 
            `${candidate.firstName} ${candidate.lastName}`.toLowerCase().includes(q) ||
            candidate.email.toLowerCase().includes(q) ||
            candidate.skills.some(skill => skill.toLowerCase().includes(q))
          );
        }
        if (filters?.location?.length) {
          const locs = filters.location.map(l => l.toLowerCase());
          result = result.filter(c => locs.some(l => (c.location || '').toLowerCase().includes(l)));
        }
        if (filters?.experienceLevel?.length) {
          const levelMatches = (years?: number) => {
            if (years == null) return false;
            const has = (lvl: string) => filters.experienceLevel!.includes(lvl);
            return (
              (has('entry') && years <= 2) ||
              (has('mid') && years >= 3 && years <= 5) ||
              (has('senior') && years >= 6 && years <= 9) ||
              (has('executive') && years >= 10)
            );
          };
          result = result.filter(c => levelMatches(c.experienceYears));
        }
        if (filters?.skills?.length) {
          const wanted = filters.skills.map(s => s.toLowerCase());
          result = result.filter(c => c.skills.some(s => wanted.some(w => s.toLowerCase().includes(w))));
        }
        if (typeof filters?.minRating === 'number') {
          result = result.filter(c => (c.rating ?? -Infinity) >= (filters.minRating as number));
        }

        setCandidates(result);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching candidates:', err);
        setError(`Failed to fetch candidates: ${err.message}`);
        setCandidates([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidates();
  }, [filters]);

  return { candidates, isLoading, error };
};

export const useApplications = (filters?: FilterOptions) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setIsLoading(true);
        
        // Get current user's company ID
        const companyId = await getCurrentUserCompanyId();
        if (!companyId) {
          throw new Error('User company not found');
        }
        
        // Fetch applications with separate queries to avoid complex joins, filtered by company_id
        const { data: applicationRows, error: applicationError } = await supabase
          .from('applications')
          .select(`
            id,
            status,
            source,
            applied_at,
            score,
            rating,
            rejection_reason,
            salary_offered,
            notes,
            job_id,
            candidate_id,
            stage_id,
            company_id
          `)
          .eq('company_id', companyId)
          .order('applied_at', { ascending: false });

        if (applicationError) {
          throw applicationError;
        }

        if (!applicationRows || applicationRows.length === 0) {
          setApplications([]);
          return;
        }

        // Get unique IDs for separate queries
        const jobIds = [...new Set(applicationRows.map(app => app.job_id).filter(Boolean))];
        const candidateIds = [...new Set(applicationRows.map(app => app.candidate_id).filter(Boolean))];
        const stageIds = [...new Set(applicationRows.map(app => app.stage_id).filter(Boolean))];

        // Fetch jobs (already filtered by company_id through applications)
        const { data: jobRows, error: jobError } = await supabase
          .from('jobs')
          .select(`
            id,
            title,
            description,
            requirements,
            responsibilities,
            employment_type,
            experience_level,
            location,
            remote_type,
            salary_min,
            salary_max,
            status,
            published_at,
            expires_at,
            created_at,
            client_id,
            company_id
          `)
          .in('id', jobIds)
          .eq('company_id', companyId);

        if (jobError) {
          console.warn('Error fetching jobs:', jobError);
        }

        // Fetch candidates (already filtered by company_id through applications)
        const { data: candidateRows, error: candidateError } = await supabase
          .from('candidates')
          .select(`
            id,
            email,
            first_name,
            last_name,
            phone,
            location,
            linkedin_url,
            portfolio_url,
            current_company,
            current_title,
            experience_years,
            summary,
            avatar,
            resume_url,
            source,
            rating,
            is_blacklisted,
            gdpr_consent,
            created_at,
            company_id
          `)
          .in('id', candidateIds)
          .eq('company_id', companyId);

        if (candidateError) {
          console.warn('Error fetching candidates:', candidateError);
        }

        // Fetch stages (already filtered by company_id through applications)
        const { data: stageRows, error: stageError } = await supabase
          .from('stages')
          .select(`
            id,
            name,
            description,
            order_index,
            stage_type,
            is_default,
            company_id
          `)
          .in('id', stageIds)
          .eq('company_id', companyId);

        if (stageError) {
          console.warn('Error fetching stages:', stageError);
        }

        // Create lookup maps
        const jobsMap = new Map((jobRows || []).map(job => [job.id, job]));
        const candidatesMap = new Map((candidateRows || []).map(candidate => [candidate.id, candidate]));
        const stagesMap = new Map((stageRows || []).map(stage => [stage.id, stage]));

        // Transform to Application type
        const result: Application[] = applicationRows.map((app: any) => {
          const jobRow = jobsMap.get(app.job_id);
          const candidateRow = candidatesMap.get(app.candidate_id);
          const stageRow = stagesMap.get(app.stage_id);

          // Create job object
          const job: Job = jobRow ? {
            id: jobRow.id,
            clientId: jobRow.client_id || '',
            client: {
              id: jobRow.client_id || '',
              name: 'Client Name', // Would need separate client fetch
              companyName: 'Company Name',
              industry: 'Technology',
              contactInfo: { email: '', phone: '' },
              address: { street: '', city: '', state: '', country: '', zipCode: '' },
              contractDetails: {
                startDate: new Date(),
                endDate: undefined,
                contractType: 'retainer',
                paymentTerms: '',
                isExclusive: false,
                includesBackgroundCheck: false,
                hasReplacementGuarantee: false,
                replacementGuaranteeDays: undefined,
                hasConfidentialityAgreement: false,
                additionalTerms: undefined,
              },
              status: 'active',
              totalJobs: 0,
              activeJobs: 0,
              successfulPlacements: 0,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            externalSpocId: '',
            externalSpoc: {
              id: '', clientId: '', client: {} as any, firstName: '', lastName: '', 
              email: '', designation: '', isPrimary: false, isActive: true, 
              createdAt: new Date(), updatedAt: new Date()
            },
            primaryInternalSpocId: '',
            primaryInternalSpoc: {
              id: '', userId: '', user: {} as any, level: 'primary', clientIds: [], 
              clients: [], isActive: true, assignedAt: new Date(), assignedBy: ''
            },
            assignedRecruiters: [],
            title: jobRow.title,
            department: { id: '', name: 'General', isActive: true },
            description: jobRow.description,
            requirements: jobRow.requirements,
            responsibilities: jobRow.responsibilities,
            employmentType: jobRow.employment_type,
            experienceLevel: jobRow.experience_level,
            location: jobRow.location,
            remoteType: jobRow.remote_type,
            salaryMin: jobRow.salary_min,
            salaryMax: jobRow.salary_max,
            status: jobRow.status,
            publishedAt: jobRow.published_at ? new Date(jobRow.published_at) : undefined,
            expiresAt: jobRow.expires_at ? new Date(jobRow.expires_at) : undefined,
            hiringManager: {
              id: '', email: '', firstName: '', lastName: '', company: {} as any,
              roles: [], isActive: true, createdAt: new Date()
            },
            applicationsCount: 0,
            viewsCount: 0,
            createdAt: jobRow.created_at ? new Date(jobRow.created_at) : new Date(),
          } : {} as Job;

          // Create candidate object
          const candidate: Candidate = candidateRow ? {
            id: candidateRow.id,
            email: candidateRow.email,
            firstName: candidateRow.first_name,
            lastName: candidateRow.last_name,
            phone: candidateRow.phone,
            location: candidateRow.location,
            linkedinUrl: candidateRow.linkedin_url,
            portfolioUrl: candidateRow.portfolio_url,
            currentCompany: candidateRow.current_company,
            currentTitle: candidateRow.current_title,
            experienceYears: candidateRow.experience_years,
            skills: [], // Would need separate skills fetch
            summary: candidateRow.summary,
            avatar: candidateRow.avatar,
            resumeUrl: candidateRow.resume_url,
            source: candidateRow.source || 'Unknown',
            tags: [],
            rating: candidateRow.rating,
            isBlacklisted: !!candidateRow.is_blacklisted,
            gdprConsent: !!candidateRow.gdpr_consent,
            createdAt: candidateRow.created_at ? new Date(candidateRow.created_at) : new Date(),
          } : {} as Candidate;

          // Create stage object
          const currentStage = stageRow ? {
            id: stageRow.id,
            name: stageRow.name,
            description: stageRow.description,
            orderIndex: stageRow.order_index,
            stageType: stageRow.stage_type,
            isDefault: !!stageRow.is_default,
          } : {
            id: '',
            name: 'Applied',
            orderIndex: 1,
            stageType: 'application',
            isDefault: true
          };

          return {
            id: app.id,
            job,
            candidate,
            currentStage,
            status: app.status,
            source: app.source || 'Unknown',
            appliedAt: app.applied_at ? new Date(app.applied_at) : new Date(),
            score: app.score,
            rating: app.rating,
            rejectionReason: app.rejection_reason,
            salaryOffered: app.salary_offered,
            notes: app.notes,
            tags: [],
          } as Application;
        });

        // Apply filters
        let filteredApplications = result;
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          filteredApplications = result.filter(app => 
            `${app.candidate.firstName} ${app.candidate.lastName}`.toLowerCase().includes(q) ||
            app.job.title.toLowerCase().includes(q)
          );
        }

        setApplications(filteredApplications);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching applications:', err);
        setError(`Failed to fetch applications: ${err.message}`);
        setApplications([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [filters]);

  return { applications, isLoading, error };
};

export const useRecruitmentMetrics = () => {
  const [metrics, setMetrics] = useState<RecruitmentMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        
        // Get current user's company ID
        const companyId = await getCurrentUserCompanyId();
        if (!companyId) {
          throw new Error('User company not found');
        }
        
        // Fetch real metrics from Supabase filtered by company_id
        const [jobsResult, applicationsResult, interviewsResult] = await Promise.all([
          supabase.from('jobs').select('id, status').eq('company_id', companyId),
          supabase.from('applications').select('id, status, applied_at, source').eq('company_id', companyId),
          supabase.from('interviews').select('id, status').eq('company_id', companyId)
        ]);

        const jobs = jobsResult.data || [];
        const applications = applicationsResult.data || [];
        const interviews = interviewsResult.data || [];

        // Calculate metrics from real data
        const totalJobs = jobs.length;
        const activeJobs = jobs.filter(job => job.status === 'published').length;
        const totalApplications = applications.length;
        
        // New applications in last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const newApplications = applications.filter(app => 
          new Date(app.applied_at) > sevenDaysAgo
        ).length;

        const interviewsScheduled = interviews.filter(interview => 
          interview.status === 'scheduled'
        ).length;

        const offersExtended = applications.filter(app => 
          app.status === 'offer'
        ).length;

        const hires = applications.filter(app => 
          app.status === 'hired'
        ).length;

        // Calculate source effectiveness
        const sourceStats = applications.reduce((acc, app) => {
          const source = app.source || 'Unknown';
          acc[source] = (acc[source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const sourceEffectiveness = Object.entries(sourceStats).reduce((acc, [source, count]) => {
          acc[source] = count / totalApplications;
          return acc;
        }, {} as Record<string, number>);

        const calculatedMetrics: RecruitmentMetrics = {
          totalJobs,
          activeJobs,
          totalApplications,
          newApplications,
          interviewsScheduled,
          offersExtended,
          hires,
          averageTimeToHire: 18.5, // Would need more complex calculation
          costPerHire: 3200, // Would need cost data
          applicationConversionRate: totalApplications > 0 ? hires / totalApplications : 0,
          sourceEffectiveness,
        };

        setMetrics(calculatedMetrics);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching metrics:', err);
        setError(`Failed to fetch metrics: ${err.message}`);
        setMetrics(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return { metrics, isLoading, error };
};

export const useInterviews = (filters?: FilterOptions) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setIsLoading(true);
        
        // Get current user's company ID
        const companyId = await getCurrentUserCompanyId();
        if (!companyId) {
          throw new Error('User company not found');
        }
        
        // Fetch interviews from Supabase filtered by company_id
        const { data: interviewRows, error: interviewError } = await supabase
          .from('interviews')
          .select(`
            id,
            title,
            description,
            scheduled_at,
            duration_minutes,
            location,
            status,
            interview_round,
            created_at,
            application_id,
            company_id
          `)
          .eq('company_id', companyId)
          .order('scheduled_at', { ascending: false });

        if (interviewError) {
          throw interviewError;
        }

        if (!interviewRows || interviewRows.length === 0) {
          setInterviews([]);
          return;
        }

        // Get application IDs to fetch related data
        const applicationIds = [...new Set(interviewRows.map(interview => interview.application_id).filter(Boolean))];

        // Fetch applications with related data (already filtered by company_id through interviews)
        const { data: applicationRows, error: applicationError } = await supabase
          .from('applications')
          .select(`
            id,
            status,
            source,
            applied_at,
            score,
            rating,
            job_id,
            candidate_id,
            stage_id,
            company_id
          `)
          .in('id', applicationIds)
          .eq('company_id', companyId);

        if (applicationError) {
          console.warn('Error fetching applications for interviews:', applicationError);
        }

        // Create applications map
        const applicationsMap = new Map((applicationRows || []).map(app => [app.id, app]));

        // Transform to Interview type
        const result: Interview[] = interviewRows.map((interview: any) => {
          const applicationRow = applicationsMap.get(interview.application_id);

          // Create a simplified application object
          const application: Application = applicationRow ? {
            id: applicationRow.id,
            job: {
              id: applicationRow.job_id || '',
              title: 'Job Title', // Would need separate job fetch
              clientId: '',
              client: {} as any,
              externalSpocId: '',
              externalSpoc: {} as any,
              primaryInternalSpocId: '',
              primaryInternalSpoc: {} as any,
              assignedRecruiters: [],
              department: { id: '', name: 'General', isActive: true },
              description: '',
              requirements: '',
              responsibilities: '',
              employmentType: 'full-time',
              experienceLevel: 'mid',
              location: '',
              remoteType: 'hybrid',
              status: 'published',
              hiringManager: {} as any,
              applicationsCount: 0,
              viewsCount: 0,
              createdAt: new Date(),
            },
            candidate: {
              id: applicationRow.candidate_id || '',
              email: '',
              firstName: 'Candidate',
              lastName: 'Name',
              skills: [],
              tags: [],
              isBlacklisted: false,
              gdprConsent: true,
              source: applicationRow.source || 'Unknown',
              createdAt: new Date(),
            },
            currentStage: {
              id: applicationRow.stage_id || '',
              name: 'Interview',
              orderIndex: 6,
              stageType: 'interview',
              isDefault: true,
            },
            status: applicationRow.status,
            source: applicationRow.source || 'Unknown',
            appliedAt: applicationRow.applied_at ? new Date(applicationRow.applied_at) : new Date(),
            score: applicationRow.score,
            rating: applicationRow.rating,
            tags: [],
          } : {} as Application;

          return {
            id: interview.id,
            application,
            title: interview.title,
            description: interview.description,
            scheduledAt: interview.scheduled_at ? new Date(interview.scheduled_at) : new Date(),
            durationMinutes: interview.duration_minutes || 60,
            location: interview.location,
            status: interview.status,
            interviewRound: interview.interview_round || 1,
            participants: [], // Would need separate participants fetch
            feedback: [], // Would need separate feedback fetch
            createdAt: interview.created_at ? new Date(interview.created_at) : new Date(),
          } as Interview;
        });

        // Apply filters
        let filteredInterviews = result;
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          filteredInterviews = result.filter(interview => 
            `${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`.toLowerCase().includes(q) ||
            interview.application.job.title.toLowerCase().includes(q) ||
            interview.title?.toLowerCase().includes(q)
          );
        }
        
        setInterviews(filteredInterviews);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching interviews:', err);
        setError(`Failed to fetch interviews: ${err.message}`);
        setInterviews([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterviews();
  }, [filters]);

  return { interviews, isLoading, error };
};

export const useClients = (filters?: FilterOptions) => {
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoading(true);
        
        // Get current user's company ID
        const companyId = await getCurrentUserCompanyId();
        if (!companyId) {
          throw new Error('User company not found');
        }
        
        const { data: clientRows, error: clientError } = await supabase
          .from('clients')
          .select(`
            id,
            name,
            company_name,
            industry,
            website,
            logo,
            description,
            status,
            contact_email,
            contact_phone,
            address_street,
            address_city,
            address_state,
            address_country,
            address_zip,
            contract_start_date,
            contract_end_date,
            contract_type,
            payment_terms,
            contract_details,
            created_at,
            updated_at,
            company_id
          `)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });

        if (clientError) {
          throw clientError;
        }

        let result = (clientRows || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          companyName: c.company_name,
          industry: c.industry || '',
          website: c.website || undefined,
          logo: c.logo || undefined,
          description: c.description || undefined,
          status: (c.status ?? 'active'),
          totalJobs: 0,
          activeJobs: 0,
          successfulPlacements: 0,
          address: {
            street: c.address_street || '',
            city: c.address_city || '',
            state: c.address_state || '',
            country: c.address_country || '',
            zipCode: c.address_zip || ''
          },
          contactInfo: {
            email: c.contact_email || '',
            phone: c.contact_phone || ''
          },
          contractDetails: (() => {
            const cd = c.contract_details || {};
            const start = cd.startDate || c.contract_start_date;
            const end = cd.endDate || c.contract_end_date;
            return {
              startDate: start ? new Date(start) : new Date(),
              endDate: end ? new Date(end) : undefined,
              contractType: cd.contractType || c.contract_type || 'retainer',
              paymentTerms: cd.paymentTerms || c.payment_terms || 'Net 30',
              isExclusive: !!cd.isExclusive,
              includesBackgroundCheck: !!cd.includesBackgroundCheck,
              hasReplacementGuarantee: !!cd.hasReplacementGuarantee,
              replacementGuaranteeDays: typeof cd.replacementGuaranteeDays === 'number'
                ? cd.replacementGuaranteeDays
                : (cd.replacementGuaranteeDays ? parseInt(String(cd.replacementGuaranteeDays), 10) : undefined),
              hasConfidentialityAgreement: !!cd.hasConfidentialityAgreement,
              additionalTerms: cd.additionalTerms || undefined,
            };
          })(),
          createdAt: c.created_at ? new Date(c.created_at) : new Date(),
          updatedAt: c.updated_at ? new Date(c.updated_at) : new Date(),
        }));

        if (filters?.search) {
          const q = filters.search.toLowerCase();
          result = result.filter(client => 
            client.name.toLowerCase().includes(q) ||
            client.companyName.toLowerCase().includes(q) ||
            client.industry.toLowerCase().includes(q)
          );
        }

        setClients(result);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching clients:', err);
        setError(`Failed to fetch clients: ${err.message}`);
        setClients([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, [filters, reloadToken]);

  const refetch = () => setReloadToken((t) => t + 1);

  return { clients, isLoading, error, refetch };
};

export const useTeamMembers = (filters?: FilterOptions) => {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setIsLoading(true);
        
        const { data: userRows, error: userError } = await supabase
          .from('users')
          .select(`
            id,
            email,
            first_name,
            last_name,
            avatar,
            is_active,
            created_at
          `)
          .order('created_at', { ascending: false });

        if (userError) {
          throw userError;
        }

        let result = (userRows || []).map((u: any) => ({
          id: u.id,
          email: u.email,
          firstName: u.first_name || '',
          lastName: u.last_name || '',
          avatar: u.avatar,
          role: 'Team Member', // Would need separate role table
          department: 'General', // Would need separate department table
          isActive: !!u.is_active,
          createdAt: u.created_at ? new Date(u.created_at) : new Date(),
        }));

        if (filters?.search) {
          const q = filters.search.toLowerCase();
          result = result.filter(member => 
            `${member.firstName} ${member.lastName}`.toLowerCase().includes(q) ||
            member.email.toLowerCase().includes(q)
          );
        }

        setTeamMembers(result);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching team members:', err);
        setError(`Failed to fetch team members: ${err.message}`);
        setTeamMembers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamMembers();
  }, [filters]);

  return { teamMembers, isLoading, error };
};

export const useRecentActivity = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setIsLoading(true);
        
        // Fetch recent applications, interviews, and other activities
        const [applicationsResult, interviewsResult] = await Promise.all([
          supabase
            .from('applications')
            .select('id, applied_at, candidate_id, job_id')
            .order('applied_at', { ascending: false })
            .limit(10),
          supabase
            .from('interviews')
            .select('id, scheduled_at, title, application_id')
            .order('scheduled_at', { ascending: false })
            .limit(10)
        ]);

        const applications = applicationsResult.data || [];
        const interviews = interviewsResult.data || [];

        // Transform to activity format
        const activities = [
          ...applications.map(app => ({
            id: `app-${app.id}`,
            type: 'application',
            title: 'New Application',
            description: 'New application received',
            timestamp: new Date(app.applied_at),
            priority: 'medium'
          })),
          ...interviews.map(interview => ({
            id: `int-${interview.id}`,
            type: 'interview',
            title: 'Interview Scheduled',
            description: interview.title || 'Interview scheduled',
            timestamp: new Date(interview.scheduled_at),
            priority: 'high'
          }))
        ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);

        setActivities(activities);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching recent activity:', err);
        setError(`Failed to fetch recent activity: ${err.message}`);
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentActivity();
  }, []);

  return { activities, isLoading, error };
};