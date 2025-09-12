import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  User as UserIcon,
  Briefcase,
  GitBranch,
  Star,
  ArrowLeft,
  History,
  Paperclip,
  Mail,
  Calendar,
  Save
} from 'lucide-react';
import { supabase, getCurrentUserCompanyId } from '../../lib/supabase';
import { AuditInfo } from '../common/AuditInfo';
import { TransactionHistory } from '../common/TransactionHistory';
import { useCustomStages } from '../../hooks/useCustomStages';

interface ResponseRow {
  id: string;
  answer_text: string | null;
  answer_multi: string[] | null;
  file_url: string | null;
  job_question: {
    id: string;
    question: string;
    question_type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'file';
    is_required: boolean;
    options?: string[] | null;
    order_index?: number | null;
  } | null;
}

const ApplicationProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'responses' | 'files' | 'history'>('overview');
  const [application, setApplication] = useState<any | null>(null);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [changeNote, setChangeNote] = useState<string>('');

  const { stages, isLoading: stagesLoading } = useCustomStages(companyId);

  useEffect(() => {
    (async () => {
      const cid = await getCurrentUserCompanyId();
      if (cid) setCompanyId(cid);
    })();
  }, []);

  useEffect(() => {
    if (!id || !companyId) return;
    const load = async () => {
      try {
        setLoading(true);
        const { data: row, error } = await supabase
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
            candidate:candidates ( id, first_name, last_name, email ),
            job:jobs ( id, title, client:clients ( id, name ) ),
            stage:custom_stages ( id, name, stage_type )
          `)
          .eq('id', id)
          .eq('company_id', companyId)
          .maybeSingle();
        if (error) throw error;
        if (!row) { setApplication(null); return; }

        const candidateRow = (row as any).candidate as any;
        const jobRow = (row as any).job as any;
        const clientRow = jobRow ? (Array.isArray(jobRow.client) ? jobRow.client[0] : jobRow.client) as any : null;
        const stageRow = (row as any).stage as any;

        const app = {
          id: (row as any).id,
          status: (row as any).status,
          source: (row as any).source,
          appliedAt: (row as any).applied_at,
          score: (row as any).score,
          rating: (row as any).rating,
          rejectionReason: (row as any).rejection_reason,
          salaryOffered: (row as any).salary_offered,
          notes: (row as any).notes,
          candidate: candidateRow ? {
            id: candidateRow.id,
            firstName: candidateRow.first_name,
            lastName: candidateRow.last_name,
            email: candidateRow.email
          } : null,
          job: jobRow ? {
            id: jobRow.id,
            title: jobRow.title,
            client: clientRow ? { id: clientRow.id, name: clientRow.name } : null
          } : null,
          stage: stageRow ? { id: stageRow.id, name: stageRow.name, stageType: stageRow.stage_type } : null
        };
        setApplication(app);
        setSelectedStatus((row as any).status || 'new');
        setSelectedStageId(stageRow?.id || '');
      } catch (e) {
        console.error('Failed to load application', e);
        setApplication(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, companyId]);

  const handleApplyChanges = async () => {
    if (!id || !companyId || !application) return;
    try {
      const updates: any = {};
      const changes: string[] = [];

      if (selectedStatus && selectedStatus !== application.status) {
        updates.status = selectedStatus;
        changes.push(`Status: ${application.status || '—'} → ${selectedStatus}`);
      }
      if (selectedStageId && selectedStageId !== (application.stage?.id || '')) {
        updates.stage_id = selectedStageId;
        const newStage = stages.find(s => s.id === selectedStageId);
        changes.push(`Stage: ${application.stage?.name || '—'} → ${newStage?.name || '—'}`);
      }

      // If no status/stage change but a note is present, still record the note
      const timestamp = new Date().toLocaleString();
      const noteLine = changeNote?.trim() ? `Note: ${changeNote.trim()}` : '';
      if (changes.length || noteLine) {
        const entry = `[${timestamp}] ${changes.join(' | ')}${changes.length && noteLine ? ' | ' : ''}${noteLine}`.trim();
        const existing = application.notes || '';
        const newNotes = existing ? `${existing}\n${entry}` : entry;
        updates.notes = newNotes;
      }

      if (Object.keys(updates).length === 0) {
        alert('No changes to apply');
        return;
      }

      const { error } = await supabase
        .from('applications')
        .update(updates)
        .eq('id', id)
        .eq('company_id', companyId);
      if (error) throw error;

      // Refresh local state
      setApplication((prev: any) => prev ? ({
        ...prev,
        status: updates.status ?? prev.status,
        stage: updates.stage_id ? (() => {
          const ns = stages.find(s => s.id === updates.stage_id);
          return ns ? { id: ns.id, name: ns.name, stageType: ns.stageType } : prev.stage;
        })() : prev.stage,
        notes: updates.notes ?? prev.notes
      }) : prev);

      setChangeNote('');
      alert('Application updated');
    } catch (e) {
      console.error('Failed to update application', e);
      alert('Failed to update application');
    }
  };

  useEffect(() => {
    if (!id || !companyId) return;
    const load = async () => {
      const { data, error } = await supabase
        .from('application_question_responses')
        .select(`
          id,
          answer_text,
          answer_multi,
          file_url,
          job_question:job_application_questions ( id, question, question_type, is_required, options, order_index )
        `)
        .eq('application_id', id)
        .order('id');
      if (!error) setResponses((data as any) || []);
    };
    load();
  }, [id, companyId]);

  useEffect(() => {
    if (!id || !companyId) return;
    const loadFiles = async () => {
      const { data, error } = await supabase
        .from('application_files')
        .select('id, file_name, file_url, file_category, created_at')
        .eq('application_id', id)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (!error) setFiles(data || []);
    };
    loadFiles();
  }, [id, companyId]);

  const renderStars = (rating?: number | null) => {
    const stars = [] as JSX.Element[];
    const filled = rating || 0;
    for (let i = 1; i <= 5; i++) {
      stars.push(<Star key={i} size={16} className={`${i <= filled ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />);
    }
    return <div className="flex items-center space-x-1">{stars}</div>;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-3 text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-700">Application not found.</p>
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
              onClick={() => navigate('/applications')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Applications"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {application.job?.title || 'Application'}
              </h2>
              <p className="text-sm text-gray-600">
                {application.candidate ? `${application.candidate.firstName} ${application.candidate.lastName} • ${application.candidate.email}` : 'Candidate'}
              </p>
              {application.id && (
                <div className="mt-2">
                  <AuditInfo tableName="applications" recordId={application.id} className="text-xs" />
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Stage</div>
            <div className="font-medium text-gray-900 flex items-center gap-2">
              <GitBranch size={16} className="text-gray-500" /> {application.stage?.name || 'Applied'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: FileText },
              { id: 'responses', label: 'Responses', icon: FileText },
              { id: 'files', label: 'Files', icon: Paperclip },
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
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Actions: Change Status/Stage with Note */}
              <div className="bg-white border rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Update Application</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Status</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                      {['new','in-progress','interview','offer','hired','rejected','withdrawn'].map(s => (
                        <option key={s} value={s}>{s.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Stage</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={selectedStageId}
                      onChange={(e) => setSelectedStageId(e.target.value)}
                      disabled={stagesLoading}
                    >
                      <option value="">Select stage</option>
                      {stages.sort((a,b) => a.orderIndex - b.orderIndex).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleApplyChanges}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      <Save size={16} className="mr-2" />
                      Apply Changes
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm text-gray-600 mb-2">Add Note</label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    rows={3}
                    placeholder="Add a note about this change (optional)"
                    value={changeNote}
                    onChange={(e) => setChangeNote(e.target.value)}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Changes are tracked automatically in History.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <UserIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Candidate
                </h4>
                {application.candidate ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-900">
                      <UserIcon size={16} className="text-gray-400" />
                      <span>{application.candidate.firstName} {application.candidate.lastName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Mail size={16} className="text-gray-400" />
                      <span>{application.candidate.email}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-600 text-sm">No candidate info</div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                  Job
                </h4>
                {application.job ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-900">
                      <Briefcase size={16} className="text-gray-400" />
                      <span>{application.job.title}</span>
                    </div>
                    {application.job.client && (
                      <div className="text-gray-900">Client: <span className="font-medium">{application.job.client.name}</span></div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-600 text-sm">No job info</div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-xs text-gray-500">Applied At</div>
                  <div className="text-gray-900 flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : '—'}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-xs text-gray-500">Rating</div>
                  <div className="flex items-center gap-2">
                    {renderStars(application.rating)}
                    {application.rating ? <span className="text-sm text-gray-600">({application.rating}/5)</span> : null}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-xs text-gray-500">Score</div>
                  <div className="text-gray-900">{application.score ?? '—'}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'responses' && (
            <div className="space-y-4">
              {responses.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No responses</h3>
                  <p className="mt-1 text-sm text-gray-500">This application has no recorded answers.</p>
                </div>
              ) : (
                responses
                  .sort((a, b) => (a.job_question?.order_index ?? 0) - (b.job_question?.order_index ?? 0))
                  .map((r) => (
                    <div key={r.id} className="border rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">Question</div>
                      <div className="font-medium text-gray-900">{r.job_question?.question || 'Question'}</div>
                      <div className="mt-3 text-sm text-gray-500">Answer</div>
                      <div className="mt-1 text-gray-900">
                        {(() => {
                          const type = r.job_question?.question_type;
                          if (type === 'checkbox') {
                            const arr = r.answer_multi || [];
                            return arr.length ? (
                              <div className="flex flex-wrap gap-2">
                                {arr.map((v, i) => (
                                  <span key={i} className="px-2 py-1 bg-gray-100 rounded-full text-sm text-gray-800">{v}</span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-600">No selection</span>
                            );
                          }
                          if (type === 'file') {
                            return r.file_url ? (
                              <a href={r.file_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Open file</a>
                            ) : (
                              <span className="text-gray-600">No file</span>
                            );
                          }
                          const v = r.answer_text;
                          return v ? <div className="text-gray-900">{v}</div> : <span className="text-gray-600">No answer</span>;
                        })()}
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-3">
              {files.length === 0 ? (
                <div className="text-gray-600 text-sm">No files uploaded for this application.</div>
              ) : (
                files.map((f) => (
                  <div key={f.id} className="flex items-center justify-between border rounded-lg p-3 bg-white">
                    <div className="flex items-center gap-3">
                      <Paperclip size={18} className="text-gray-500" />
                      <div>
                        <div className="text-gray-900 text-sm font-medium">{f.file_name}</div>
                        <div className="text-xs text-gray-500">{f.file_category || 'Other'} • {new Date(f.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <a href={f.file_url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline">Open</a>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'history' && application.id && (
            <TransactionHistory tableName="applications" recordId={application.id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationProfilePage;
