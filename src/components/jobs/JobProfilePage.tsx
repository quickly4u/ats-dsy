import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Users,
  Calendar,
  ArrowLeft,
  History,
  FileText,
  GitBranch
} from 'lucide-react';
import { supabase, getCurrentUserCompanyId } from '../../lib/supabase';
import { AuditInfo } from '../common/AuditInfo';
import { TransactionHistory } from '../common/TransactionHistory';

const JobProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'history'>('overview');
  const [job, setJob] = useState<any | null>(null);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const cid = await getCurrentUserCompanyId();
      if (cid) setCompanyId(cid);
    })();
  }, []);

  useEffect(() => {
    if (!id || !companyId) return;
    const loadJob = async () => {
      try {
        setLoading(true);
        const { data: row, error } = await supabase
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
            client:clients ( id, name )
          `)
          .eq('id', id)
          .eq('company_id', companyId)
          .maybeSingle();
        if (error) throw error;
        if (!row) { setJob(null); return; }
        const clientRow = (row as any)?.client ? (Array.isArray((row as any).client) ? (row as any).client[0] : (row as any).client) : null;
        setJob({
          id: (row as any).id,
          title: (row as any).title,
          description: (row as any).description,
          requirements: (row as any).requirements,
          responsibilities: (row as any).responsibilities,
          employmentType: (row as any).employment_type,
          experienceLevel: (row as any).experience_level,
          location: (row as any).location,
          remoteType: (row as any).remote_type,
          salaryMin: (row as any).salary_min,
          salaryMax: (row as any).salary_max,
          status: (row as any).status,
          publishedAt: (row as any).published_at,
          expiresAt: (row as any).expires_at,
          client: clientRow ? { id: clientRow.id, name: clientRow.name } : null,
        });
      } catch (e) {
        console.error('Failed to load job', e);
        setJob(null);
      } finally {
        setLoading(false);
      }
    };
    loadJob();
  }, [id, companyId]);

  useEffect(() => {
    if (!id || !companyId) return;
    const loadApplications = async () => {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          applied_at,
          score,
          rating,
          candidate:candidates ( id, first_name, last_name, email ),
          stage:custom_stages ( name, stage_type )
        `)
        .eq('job_id', id)
        .eq('company_id', companyId)
        .order('applied_at', { ascending: false });
      if (!error) setApplications((data as any) || []);
    };
    loadApplications();
  }, [id, companyId]);

  const formatCurrency = (n?: number | null) => {
    if (n == null) return '—';
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n); } catch { return String(n); }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-3 text-gray-600">Loading job...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-700">Job not found.</p>
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
              onClick={() => navigate('/jobs')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Jobs"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {job.title}
              </h2>
              <p className="text-sm text-gray-600">
                {job.client ? job.client.name : 'Job'}
              </p>
              {job.id && (
                <div className="mt-2">
                  <AuditInfo tableName="jobs" recordId={job.id} className="text-xs" />
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Status</div>
            <div className="font-medium text-gray-900 flex items-center gap-2">
              <GitBranch size={16} className="text-gray-500" /> {job.status}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Briefcase },
              { id: 'applications', label: 'Applications', icon: Users },
              { id: 'history', label: 'History', icon: History },
            ].map((tab) => {
              const Icon = tab.icon as any;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
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
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-xs text-gray-500">Client</div>
                  <div className="text-gray-900 flex items-center gap-2">
                    <Building2 size={16} className="text-gray-400" />
                    {job.client?.name || '—'}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-xs text-gray-500">Location</div>
                  <div className="text-gray-900 flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    {job.location || '—'}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-xs text-gray-500">Salary Range</div>
                  <div className="text-gray-900 flex items-center gap-2">
                    <DollarSign size={16} className="text-gray-400" />
                    {formatCurrency(job.salaryMin)} - {formatCurrency(job.salaryMax)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Description
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{job.description || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Requirements
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{job.requirements || '—'}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  Timeline
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">Published</div>
                    <div className="text-gray-900">{job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Expires</div>
                    <div className="text-gray-900">{job.expiresAt ? new Date(job.expiresAt).toLocaleDateString() : '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Status</div>
                    <div className="text-gray-900">{job.status}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-3">
              {applications.length === 0 ? (
                <div className="text-gray-600 text-sm">No applications yet for this job.</div>
              ) : (
                applications.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between border rounded-lg p-4 bg-white">
                    <div>
                      <div className="text-gray-900 text-sm font-medium">{a.candidate ? `${a.candidate.first_name} ${a.candidate.last_name}` : 'Candidate'}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <GitBranch size={14} className="text-gray-400" /> {a.stage?.name || 'Applied'}
                        <span>•</span>
                        <Calendar size={14} className="text-gray-400" /> {a.applied_at ? new Date(a.applied_at).toLocaleDateString() : '—'}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">Status: {a.status}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'history' && job.id && (
            <TransactionHistory tableName="jobs" recordId={job.id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default JobProfilePage;
