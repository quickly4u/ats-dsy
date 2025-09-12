import React, { useEffect, useState } from 'react';
import { X, FileText, Image as ImageIcon, File, History } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AuditInfo } from '../common/AuditInfo';
import { TransactionHistory } from '../common/TransactionHistory';

interface Props {
  applicationId: string;
  isOpen: boolean;
  onClose: () => void;
}

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

const ApplicationDetailsModal: React.FC<Props> = ({ applicationId, isOpen, onClose }) => {
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'responses' | 'history'>('responses');

  useEffect(() => {
    if (!isOpen || !applicationId) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from('application_question_responses')
          .select(`
            id,
            answer_text,
            answer_multi,
            file_url,
            job_question:job_application_questions ( id, question, question_type, is_required, options, order_index )
          `)
          .eq('application_id', applicationId)
          .order('id');
        if (error) throw error;
        setResponses((data as any) || []);
      } catch (e: any) {
        console.error('Failed to load responses:', e);
        setError(e?.message || 'Failed to load responses');
        setResponses([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [applicationId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Application Details</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={20} />
            </button>
          </div>
          
          <AuditInfo tableName="applications" recordId={applicationId} className="text-xs mb-4" />
          
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('responses')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'responses'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Responses
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'history'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <History className="w-4 h-4 inline mr-2" />
              History
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'responses' && (
            <>
              {loading && (
                <div className="text-gray-600">Loading responses...</div>
              )}
              {error && (
                <div className="text-red-600">{error}</div>
              )}

              {!loading && !error && responses.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No responses</h3>
                  <p className="mt-1 text-sm text-gray-500">This application has no recorded answers.</p>
                </div>
              )}

              <div className="space-y-4">
                {responses
                  .sort((a, b) => (a.job_question?.order_index ?? 0) - (b.job_question?.order_index ?? 0))
                  .map((r) => (
                  <div key={r.id} className="border rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">Question</div>
                    <div className="font-medium text-gray-900">{r.job_question?.question || 'Question'}</div>

                    <div className="mt-3 text-sm text-gray-500">Answer</div>
                    <div className="mt-1">
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
                          if (r.file_url) {
                            const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(r.file_url);
                            const isPdf = /\.pdf(\?.*)?$/i.test(r.file_url);
                            return (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  {isImage ? <ImageIcon size={16} className="text-gray-500" /> : <File size={16} className="text-gray-500" />}
                                  <a href={r.file_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Open file</a>
                                </div>
                                {isImage && (
                                  <img src={r.file_url} alt="uploaded" className="max-h-48 rounded border" />
                                )}
                                {isPdf && (
                                  <iframe src={r.file_url} className="w-full h-64 border rounded" />
                                )}
                              </div>
                            );
                          }
                          return <span className="text-gray-600">No file</span>;
                        }
                        // text-like
                        const v = r.answer_text;
                        return v ? <div className="text-gray-900">{v}</div> : <span className="text-gray-600">No answer</span>;
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {activeTab === 'history' && (
            <TransactionHistory tableName="applications" recordId={applicationId} />
          )}
        </div>

        <div className="p-4 border-t flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailsModal;
