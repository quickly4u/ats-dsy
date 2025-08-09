import { useState, useEffect } from 'react';
import type { 
  Job, 
  Candidate, 
  Application, 
  Interview, 
  RecruitmentMetrics,
  FilterOptions
} from '../types';

// Mock data generators
const generateMockJobs = (): Job[] => {
  // Define mockUser first since it's referenced by other objects
  const mockUser = {
    id: '1',
    email: 'john@company.com',
    firstName: 'John',
    lastName: 'Doe',
    company: { id: '1', name: 'TechCorp', slug: 'techcorp', subscriptionPlan: 'professional' as const, createdAt: new Date() },
    roles: [],
    isActive: true,
    createdAt: new Date(),
  };

  const mockClient = {
    id: '1',
    name: 'TechCorp Solutions',
    companyName: 'TechCorp Solutions Inc.',
    industry: 'Technology',
    contactInfo: { email: 'contact@techcorp.com', phone: '+1 (555) 123-4567' },
    address: { street: '123 Tech St', city: 'San Francisco', state: 'CA', country: 'US', zipCode: '94105' },
    contractDetails: { startDate: new Date(), contractType: 'retainer' as const, paymentTerms: 'Net 30' },
    status: 'active' as const,
    totalJobs: 15,
    activeJobs: 8,
    successfulPlacements: 12,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockExternalSpoc = {
    id: '1',
    clientId: '1',
    client: mockClient,
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@techcorp.com',
    designation: 'VP of Engineering',
    isPrimary: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockInternalSpoc = {
    id: '1',
    userId: '1',
    user: mockUser,
    level: 'primary' as const,
    clientIds: ['1'],
    clients: [mockClient],
    isActive: true,
    assignedAt: new Date(),
    assignedBy: '1'
  };

  const departments = [
    { id: '1', name: 'Engineering', isActive: true },
    { id: '2', name: 'Marketing', isActive: true },
    { id: '3', name: 'Sales', isActive: true },
    { id: '4', name: 'Design', isActive: true },
  ];

  return [
    {
      id: '1',
      clientId: '1',
      client: mockClient,
      externalSpocId: '1',
      externalSpoc: mockExternalSpoc,
      primaryInternalSpocId: '1',
      primaryInternalSpoc: mockInternalSpoc,
      assignedRecruiters: [
        {
          id: '1',
          jobId: '1',
          recruiterId: '1',
          recruiter: mockUser,
          assignedBy: '1',
          assignedAt: new Date(),
          isLead: true,
          status: 'active'
        }
      ],
      title: 'Senior Software Engineer',
      department: departments[0],
      description: 'We are looking for a senior software engineer to join our growing team...',
      requirements: 'Bachelor\'s degree in Computer Science, 5+ years of experience...',
      responsibilities: 'Design and implement scalable software solutions...',
      employmentType: 'full-time' as const,
      experienceLevel: 'senior' as const,
      location: 'San Francisco, CA',
      remoteType: 'hybrid' as const,
      salaryMin: 120000,
      salaryMax: 180000,
      status: 'published' as const,
      publishedAt: new Date('2024-01-01'),
      hiringManager: mockUser,
      assignedRecruiter: mockUser,
      applicationsCount: 45,
      viewsCount: 320,
      createdAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      clientId: '1',
      client: mockClient,
      externalSpocId: '1',
      externalSpoc: mockExternalSpoc,
      primaryInternalSpocId: '1',
      primaryInternalSpoc: mockInternalSpoc,
      assignedRecruiters: [
        {
          id: '2',
          jobId: '2',
          recruiterId: '1',
          recruiter: mockUser,
          assignedBy: '1',
          assignedAt: new Date(),
          isLead: true,
          status: 'active'
        }
      ],
      title: 'Product Marketing Manager',
      department: departments[1],
      description: 'Join our marketing team to drive product adoption and growth...',
      requirements: 'MBA preferred, 3+ years in product marketing...',
      responsibilities: 'Develop go-to-market strategies, create marketing content...',
      employmentType: 'full-time' as const,
      experienceLevel: 'mid' as const,
      location: 'New York, NY',
      remoteType: 'remote' as const,
      salaryMin: 80000,
      salaryMax: 120000,
      status: 'published' as const,
      publishedAt: new Date('2024-01-05'),
      hiringManager: mockUser,
      assignedRecruiter: mockUser,
      applicationsCount: 23,
      viewsCount: 180,
      createdAt: new Date('2024-01-05'),
    },
    {
      id: '3',
      clientId: '1',
      client: mockClient,
      externalSpocId: '1',
      externalSpoc: mockExternalSpoc,
      primaryInternalSpocId: '1',
      primaryInternalSpoc: mockInternalSpoc,
      assignedRecruiters: [
        {
          id: '3',
          jobId: '3',
          recruiterId: '1',
          recruiter: mockUser,
          assignedBy: '1',
          assignedAt: new Date(),
          isLead: true,
          status: 'active'
        }
      ],
      title: 'UX Designer',
      department: departments[3],
      description: 'Create intuitive and beautiful user experiences...',
      requirements: 'Portfolio demonstrating UX design skills, 2+ years experience...',
      responsibilities: 'User research, wireframing, prototyping, usability testing...',
      employmentType: 'full-time' as const,
      experienceLevel: 'mid' as const,
      location: 'Austin, TX',
      remoteType: 'hybrid' as const,
      salaryMin: 70000,
      salaryMax: 95000,
      status: 'published' as const,
      publishedAt: new Date('2024-01-10'),
      hiringManager: mockUser,
      assignedRecruiter: mockUser,
      applicationsCount: 67,
      viewsCount: 450,
      createdAt: new Date('2024-01-10'),
    },
  ];
};

const generateMockCandidates = (): Candidate[] => {
  return [
    {
      id: '1',
      email: 'sarah.johnson@email.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      linkedinUrl: 'https://linkedin.com/in/sarahjohnson',
      currentCompany: 'Google',
      currentTitle: 'Senior Software Engineer',
      experienceYears: 6,
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
      summary: 'Experienced full-stack engineer with a passion for building scalable web applications...',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      source: 'LinkedIn',
      tags: ['Featured', 'Senior'],
      rating: 4,
      isBlacklisted: false,
      gdprConsent: true,
      createdAt: new Date('2024-01-02'),
    },
    {
      id: '2',
      email: 'michael.chen@email.com',
      firstName: 'Michael',
      lastName: 'Chen',
      phone: '+1 (555) 234-5678',
      location: 'New York, NY',
      linkedinUrl: 'https://linkedin.com/in/michaelchen',
      currentCompany: 'Facebook',
      currentTitle: 'Product Marketing Manager',
      experienceYears: 4,
      skills: ['Product Marketing', 'Analytics', 'A/B Testing', 'Growth Hacking'],
      summary: 'Results-driven product marketer with experience in B2B and B2C environments...',
      avatar: 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      source: 'Referral',
      tags: ['Referral', 'Hot Lead'],
      rating: 5,
      isBlacklisted: false,
      gdprConsent: true,
      createdAt: new Date('2024-01-03'),
    },
    {
      id: '3',
      email: 'emily.davis@email.com',
      firstName: 'Emily',
      lastName: 'Davis',
      phone: '+1 (555) 345-6789',
      location: 'Austin, TX',
      portfolioUrl: 'https://emilydavis.design',
      currentCompany: 'Airbnb',
      currentTitle: 'Senior UX Designer',
      experienceYears: 5,
      skills: ['UX Design', 'Figma', 'User Research', 'Prototyping', 'Design Systems'],
      summary: 'Creative UX designer with a strong background in user-centered design principles...',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      source: 'Company Website',
      tags: ['Portfolio', 'Local'],
      rating: 4,
      isBlacklisted: false,
      gdprConsent: true,
      createdAt: new Date('2024-01-04'),
    },
  ];
};

// ✅ Removed duplicate useApplications here
// ❗ Kept only the full version below

export const useJobs = (filters?: FilterOptions) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        let mockJobs = generateMockJobs();
        if (filters?.search) {
          mockJobs = mockJobs.filter(job => 
            job.title.toLowerCase().includes(filters.search!.toLowerCase()) ||
            job.description.toLowerCase().includes(filters.search!.toLowerCase())
          );
        }
        if (filters?.status?.length) {
          mockJobs = mockJobs.filter(job => filters.status!.includes(job.status));
        }
        setJobs(mockJobs);
      } catch (err) {
        setError('Failed to fetch jobs');
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
        await new Promise(resolve => setTimeout(resolve, 800));
        let mockCandidates = generateMockCandidates();
        if (filters?.search) {
          mockCandidates = mockCandidates.filter(candidate => 
            `${candidate.firstName} ${candidate.lastName}`.toLowerCase().includes(filters.search!.toLowerCase()) ||
            candidate.email.toLowerCase().includes(filters.search!.toLowerCase()) ||
            candidate.skills.some(skill => skill.toLowerCase().includes(filters.search!.toLowerCase()))
          );
        }
        setCandidates(mockCandidates);
      } catch (err) {
        setError('Failed to fetch candidates');
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
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockJobs = generateMockJobs();
        const mockCandidates = generateMockCandidates();
        
        const mockApplications: Application[] = [
          {
            id: '1',
            job: mockJobs[0],
            candidate: mockCandidates[0],
            currentStage: { id: '2', name: 'Screening', description: 'Initial screening', orderIndex: 2, stageType: 'screening', isDefault: true },
            status: 'in-progress',
            source: 'LinkedIn',
            appliedAt: new Date('2024-01-15'),
            score: 85,
            rating: 4,
            tags: ['Featured', 'High Priority'],
          },
          {
            id: '2',
            job: mockJobs[1],
            candidate: mockCandidates[1],
            currentStage: { id: '5', name: 'Interview', description: 'Technical interview', orderIndex: 5, stageType: 'interview', isDefault: true },
            status: 'in-progress',
            source: 'Referral',
            appliedAt: new Date('2024-01-12'),
            score: 92,
            rating: 5,
            tags: ['Referral'],
          },
          {
            id: '3',
            job: mockJobs[2],
            candidate: mockCandidates[2],
            currentStage: { id: '8', name: 'Offer', description: 'Job offer extended', orderIndex: 8, stageType: 'offer', isDefault: true },
            status: 'in-progress',
            source: 'Company Website',
            appliedAt: new Date('2024-01-08'),
            score: 88,
            rating: 4,
            tags: ['Portfolio'],
          },
        ];
        
        let filteredApplications = mockApplications;
        if (filters?.search) {
          filteredApplications = filteredApplications.filter(app => 
            `${app.candidate.firstName} ${app.candidate.lastName}`.toLowerCase().includes(filters.search!.toLowerCase()) ||
            app.job.title.toLowerCase().includes(filters.search!.toLowerCase())
          );
        }
        
        setApplications(filteredApplications);
      } catch (err) {
        setError('Failed to fetch applications');
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

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockMetrics: RecruitmentMetrics = {
          totalJobs: 12,
          activeJobs: 8,
          totalApplications: 324,
          newApplications: 23,
          interviewsScheduled: 15,
          offersExtended: 5,
          hires: 3,
          averageTimeToHire: 18.5,
          costPerHire: 3200,
          applicationConversionRate: 0.12,
          sourceEffectiveness: {
            'LinkedIn': 0.15,
            'Indeed': 0.08,
            'Company Website': 0.22,
            'Referral': 0.35,
            'Recruiters': 0.18,
          },
        };
        setMetrics(mockMetrics);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return { metrics, isLoading };
};

export const useInterviews = (filters?: FilterOptions) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 600));
        
        const mockJobs = generateMockJobs();
        const mockCandidates = generateMockCandidates();
        const mockUser = {
          id: '1',
          email: 'john@company.com',
          firstName: 'John',
          lastName: 'Doe',
          company: { id: '1', name: 'TechCorp', slug: 'techcorp', subscriptionPlan: 'professional' as const, createdAt: new Date() },
          roles: [],
          isActive: true,
          createdAt: new Date(),
        };
        
        const mockInterviews: Interview[] = [
          {
            id: '1',
            application: {
              id: '1',
              job: mockJobs[0],
              candidate: mockCandidates[0],
              currentStage: { id: '6', name: 'Interview', description: 'Technical interview stage', orderIndex: 6, stageType: 'interview', isDefault: true },
              status: 'in-progress',
              source: 'LinkedIn',
              appliedAt: new Date('2024-01-02'),
              score: 95,
              rating: 5,
              tags: ['Strong Technical Skills'],
            },
            title: 'Technical Interview',
            description: 'Focus on React and Node.js experience',
            scheduledAt: new Date('2024-01-15T10:00:00'),
            durationMinutes: 60,
            location: 'Video Call',
            status: 'scheduled',
            interviewRound: 1,
            participants: [
              {
                id: '1',
                user: mockUser,
                role: 'interviewer',
                isRequired: true,
                status: 'confirmed'
              }
            ],
            feedback: [],
            createdAt: new Date('2024-01-10'),
          },
          {
            id: '2',
            application: {
              id: '2',
              job: mockJobs[1],
              candidate: mockCandidates[1],
              currentStage: { id: '6', name: 'Interview', description: 'HR interview stage', orderIndex: 6, stageType: 'interview', isDefault: true },
              status: 'in-progress',
              source: 'Indeed',
              appliedAt: new Date('2024-01-06'),
              score: 88,
              rating: 4,
              tags: ['Marketing Experience'],
            },
            title: 'HR Interview',
            description: 'Discuss marketing strategy experience',
            scheduledAt: new Date('2024-01-16T14:00:00'),
            durationMinutes: 45,
            location: 'Office - Conference Room A',
            status: 'scheduled',
            interviewRound: 1,
            participants: [
              {
                id: '2',
                user: mockUser,
                role: 'interviewer',
                isRequired: true,
                status: 'confirmed'
              }
            ],
            feedback: [],
            createdAt: new Date('2024-01-12'),
          },
          {
            id: '3',
            application: {
              id: '3',
              job: mockJobs[2],
              candidate: mockCandidates[2],
              currentStage: { id: '6', name: 'Interview', description: 'Design portfolio review', orderIndex: 6, stageType: 'interview', isDefault: true },
              status: 'in-progress',
              source: 'Company Website',
              appliedAt: new Date('2024-01-08'),
              score: 92,
              rating: 5,
              tags: ['Portfolio Review'],
            },
            title: 'Design Portfolio Review',
            description: 'Review UX portfolio and design process',
            scheduledAt: new Date('2024-01-17T11:00:00'),
            durationMinutes: 90,
            location: 'Video Call',
            status: 'scheduled',
            interviewRound: 1,
            participants: [
              {
                id: '3',
                user: mockUser,
                role: 'interviewer',
                isRequired: true,
                status: 'confirmed'
              }
            ],
            feedback: [],
            createdAt: new Date('2024-01-11'),
          },
        ];
        
        let filteredInterviews = mockInterviews;
        if (filters?.search) {
          filteredInterviews = filteredInterviews.filter(interview => 
            `${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`.toLowerCase().includes(filters.search!.toLowerCase()) ||
            interview.application.job.title.toLowerCase().includes(filters.search!.toLowerCase()) ||
            interview.title?.toLowerCase().includes(filters.search!.toLowerCase())
          );
        }
        
        setInterviews(filteredInterviews);
      } catch (err) {
        setError('Failed to fetch interviews');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterviews();
  }, [filters]);

  return { interviews, isLoading, error };
};