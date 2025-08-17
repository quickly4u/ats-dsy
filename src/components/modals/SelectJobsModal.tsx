import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useJobs } from '../../hooks/useRecruitmentData';
import type { FilterOptions, Job } from '../../types';

interface SelectJobsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (jobIds: string[]) => Promise<void> | void;
}

const SelectJobsModal: React.FC<SelectJobsModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [filters, setFilters] = useState<FilterOptions>({});
  const { jobs, isLoading, error } = useJobs(filters);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const allSelected = useMemo(() => {
    if (!jobs.length) return false;
    return jobs.every(j => selected[j.id]);
  }, [jobs, selected]);

  const toggleAll = () => {
    if (allSelected) {
      setSelected({});
    } else {
      const map: Record<string, boolean> = {};
      jobs.forEach(j => { map[j.id] = true; });
      setSelected(map);
    }
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelected(prev => ({ ...prev, [id]: checked }));
  };

  const handleConfirm = async () => {
    const ids = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
    if (ids.length === 0) return onClose();
    try {
      setSubmitting(true);
      await onConfirm(ids);
      setSelected({});
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Select jobs</h3>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 rounded">
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or description"
              className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {/* Employment Type */}
            <div>
              <div className="text-xs font-medium text-gray-600 mb-2">Employment Type</div>
              <div className="flex flex-wrap gap-2 text-sm">
                {(['full-time','part-time','contract','internship'] as const).map((et) => {
                  const checked = !!filters.employmentType?.includes(et);
                  return (
                    <label key={et} className="inline-flex items-center gap-1">
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={checked}
                        onChange={(e) => {
                          const prev = filters.employmentType || [];
                          const next = e.target.checked ? Array.from(new Set([...prev, et])) : prev.filter(v => v !== et);
                          setFilters(f => ({ ...f, employmentType: next.length ? next : undefined }));
                        }}
                      />
                      <span className="capitalize">{et.replace('-', ' ')}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <div className="text-xs font-medium text-gray-600 mb-2">Experience Level</div>
              <div className="flex flex-wrap gap-2 text-sm">
                {(['entry','mid','senior','executive'] as const).map((xl) => {
                  const checked = !!filters.experienceLevel?.includes(xl);
                  return (
                    <label key={xl} className="inline-flex items-center gap-1">
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={checked}
                        onChange={(e) => {
                          const prev = filters.experienceLevel || [];
                          const next = e.target.checked ? Array.from(new Set([...prev, xl])) : prev.filter(v => v !== xl);
                          setFilters(f => ({ ...f, experienceLevel: next.length ? next : undefined }));
                        }}
                      />
                      <span className="capitalize">{xl}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Location */}
            <div>
              <div className="text-xs font-medium text-gray-600 mb-2">Location</div>
              <input
                type="text"
                placeholder="e.g. San Francisco"
                className="px-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                onChange={(e) => {
                  const val = e.target.value.trim();
                  setFilters(prev => ({ ...prev, location: val ? [val] : undefined }));
                }}
              />
            </div>
          </div>

          {/* More Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {/* Job Status */}
            <div>
              <div className="text-xs font-medium text-gray-600 mb-2">Job Status</div>
              <div className="flex flex-wrap gap-2 text-sm">
                {(['published','paused','closed','draft'] as const).map((st) => {
                  const checked = !!filters.status?.includes(st);
                  return (
                    <label key={st} className="inline-flex items-center gap-1">
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={checked}
                        onChange={(e) => {
                          const prev = filters.status || [];
                          const next = e.target.checked ? Array.from(new Set([...prev, st])) : prev.filter(v => v !== st);
                          setFilters(f => ({ ...f, status: next.length ? next : undefined }));
                        }}
                      />
                      <span className="capitalize">{st}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Remote Type */}
            <div>
              <div className="text-xs font-medium text-gray-600 mb-2">Remote Type</div>
              <div className="flex flex-wrap gap-2 text-sm">
                {(['remote','hybrid','on-site'] as const).map((rt) => {
                  const checked = !!filters.remoteType?.includes(rt);
                  return (
                    <label key={rt} className="inline-flex items-center gap-1">
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={checked}
                        onChange={(e) => {
                          const prev = filters.remoteType || [];
                          const next = e.target.checked ? Array.from(new Set([...prev, rt])) : prev.filter(v => v !== rt);
                          setFilters(f => ({ ...f, remoteType: next.length ? next : undefined }));
                        }}
                      />
                      <span className="capitalize">{rt}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div />
          </div>

          {error && (
            <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>
          )}

          <div className="flex items-center justify-between mb-2">
            <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
              <input type="checkbox" className="w-4 h-4" checked={allSelected} onChange={toggleAll} />
              <span>Select all</span>
            </label>
            <span className="text-xs text-gray-500">{Object.values(selected).filter(Boolean).length} selected</span>
          </div>

          <div className="max-h-80 overflow-auto divide-y divide-gray-100 border border-gray-200 rounded">
            {isLoading ? (
              <div className="p-4 text-sm text-gray-500">Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No jobs found</div>
            ) : (
              jobs.map((j: Job) => (
                <label key={j.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 mr-3"
                    checked={!!selected[j.id]}
                    onChange={(e) => toggleOne(j.id, e.target.checked)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{j.title}</div>
                    <div className="text-xs text-gray-600 truncate">{j.location} • {j.employmentType} • {j.experienceLevel}</div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Applying...' : 'Apply to Jobs'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectJobsModal;
