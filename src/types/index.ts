export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  company: Company;
  roles: Role[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  industry?: string;
  size?: string;
  subscriptionPlan: 'free' | 'professional' | 'enterprise';
  createdAt: Date;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  isSystem: boolean;
}

export interface Job {
  id: string;
  clientId: string;
  client: Client;
  externalSpocId: string;
  externalSpoc: ExternalSPOC;
  primaryInternalSpocId: string;
  primaryInternalSpoc: InternalSPOC;
  secondaryInternalSpocId?: string;
  secondaryInternalSpoc?: InternalSPOC;
  assignedRecruiters: JobAssignment[];
  title: string;
  department: Department;
  description: string;
  requirements: string;
  responsibilities: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  location: string;
  remoteType: 'remote' | 'hybrid' | 'on-site';
  salaryMin?: number;
  salaryMax?: number;
  status: 'draft' | 'published' | 'paused' | 'closed';
  publishedAt?: Date;
  expiresAt?: Date;
  hiringManager: User;
  assignedRecruiter?: User;
  // Screening fields
  minExperienceYears?: number;
  educationLevel?: string;
  applicationsCount: number;
  viewsCount: number;
  createdAt: Date;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  manager?: User;
  budget?: number;
  isActive: boolean;
}

export interface Experience {
  id?: string;
  company: string;
  title: string;
  location?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  description?: string;
}

export interface Candidate {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  currentCompany?: string;
  currentTitle?: string;
  experienceYears?: number;
  skills: string[];
  experiences?: Experience[];
  summary?: string;
  avatar?: string;
  resumeUrl?: string;
  source: string;
  tags: string[];
  rating?: number;
  isBlacklisted: boolean;
  gdprConsent: boolean;
  createdAt: Date;
}

export interface Application {
  id: string;
  job: Job;
  candidate: Candidate;
  currentStage: JobStage;
  status: 'new' | 'in-progress' | 'rejected' | 'hired' | 'withdrawn';
  source: string;
  appliedAt: Date;
  coverLetter?: string;
  score?: number;
  rating?: number;
  rejectionReason?: string;
  salaryOffered?: number;
  notes?: string;
  tags: string[];
}

export interface JobStage {
  id: string;
  name: string;
  description?: string;
  orderIndex: number;
  stageType: 'application' | 'screening' | 'interview' | 'assessment' | 'offer' | 'hired';
  isDefault: boolean;
}

export interface CustomStage {
  id: string;
  companyId: string;
  parentId?: string | null;
  name: string;
  description?: string;
  color: string;
  orderIndex: number;
  stageType: string;
  isDefault: boolean;
  isActive: boolean;
  canBeDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Interview {
  id: string;
  application: Application;
  title: string;
  description?: string;
  scheduledAt: Date;
  durationMinutes: number;
  location?: string;
  meetingUrl?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  interviewRound: number;
  participants: InterviewParticipant[];
  feedback: InterviewFeedback[];
  createdAt: Date;
}

export interface InterviewParticipant {
  id: string;
  user: User;
  role: 'interviewer' | 'candidate' | 'observer';
  isRequired: boolean;
  status: 'pending' | 'confirmed' | 'declined';
  joinedAt?: Date;
}

export interface InterviewFeedback {
  id: string;
  participant: InterviewParticipant;
  overallRating: number;
  technicalRating: number;
  communicationRating: number;
  culturalFitRating: number;
  recommendation: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire';
  strengths: string;
  weaknesses: string;
  detailedFeedback: string;
  isSubmitted: boolean;
  submittedAt?: Date;
}

export interface RecruitmentMetrics {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  newApplications: number;
  interviewsScheduled: number;
  offersExtended: number;
  hires: number;
  averageTimeToHire: number;
  costPerHire: number;
  applicationConversionRate: number;
  sourceEffectiveness: Record<string, number>;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: Date;
  entityType?: string;
  entityId?: string;
}

export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FilterOptions {
  search?: string;
  status?: string[];
  department?: string[];
  location?: string[];
  experienceLevel?: string[];
  employmentType?: string[];
  remoteType?: string[];
  skills?: string[];
  minRating?: number;
  dateRange?: {
    from: Date;
    to: Date;
  };
  salaryRange?: {
    min: number;
    max: number;
  };
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth?: number;
  }[];
}

export interface Client {
  id: string;
  name: string;
  companyName: string;
  industry: string;
  website?: string;
  logo?: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  contactInfo: {
    email: string;
    phone: string;
  };
  contractDetails: {
    startDate: Date;
    endDate?: Date;
    contractType: 'retainer' | 'contingency' | 'hybrid';
    paymentTerms: string;
    isExclusive: boolean;
    includesBackgroundCheck: boolean;
    hasReplacementGuarantee: boolean;
    replacementGuaranteeDays?: number;
    hasConfidentialityAgreement: boolean;
    additionalTerms?: string;
  };
  status: 'active' | 'inactive' | 'pending';
  totalJobs: number;
  activeJobs: number;
  successfulPlacements: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExternalSPOC {
  id: string;
  clientId: string;
  client: Client;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation: string;
  department?: string;
  isPrimary: boolean;
  avatar?: string;
  linkedinUrl?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InternalSPOC {
  id: string;
  userId: string;
  user: User;
  level: 'primary' | 'secondary';
  clientIds: string[];
  clients: Client[];
  isActive: boolean;
  assignedAt: Date;
  assignedBy: string;
}

export interface JobAssignment {
  id: string;
  jobId: string;
  recruiterId: string;
  recruiter: User;
  assignedBy: string;
  assignedAt: Date;
  isLead: boolean;
  status: 'active' | 'completed' | 'reassigned';
  notes?: string;
}