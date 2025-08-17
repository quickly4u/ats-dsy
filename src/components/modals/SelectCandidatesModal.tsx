import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useCandidates } from '../../hooks/useRecruitmentData';
import type { Candidate, FilterOptions } from '../../types';

interface SelectCandidatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (candidateIds: string[]) => Promise<void> | void;
}

const SelectCandidatesModal: React.FC<SelectCandidatesModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [filters, setFilters] = useState<FilterOptions>({});
  const { candidates, isLoading, error } = useCandidates(filters);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const allSelected = useMemo(() => {
    if (!candidates.length) return false;
    return candidates.every(c => selected[c.id]);
  }, [candidates, selected]);

  const toggleAll = () => {
    if (allSelected) {
      setSelected({});
    } else {
      const map: Record<string, boolean> = {};
      candidates.forEach(c => { map[c.id] = true; });
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
          <h3 className="text-lg font-semibold">Select candidates</h3>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 rounded">
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or skills"
              className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {/* Location */}
            <div>
              <div className="text-xs font-medium text-gray-600 mb-2">Location</div>
              <input
                type="text"
                placeholder="e.g. Bengaluru"
                className="px-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                onChange={(e) => {
                  const val = e.target.value.trim();
                  setFilters(prev => ({ ...prev, location: val ? [val] : undefined }));
                }}
              />
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
          </div>

          {/* More Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {/* Skills */}
            <div>
              <div className="text-xs font-medium text-gray-600 mb-2">Skills (comma-separated)</div>
              <input
                type="text"
                placeholder="e.g. React, Node.js, SQL"
                className="px-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                onChange={(e) => {
                  const list = e.target.value
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean);
                  setFilters(prev => ({ ...prev, skills: list.length ? list : undefined }));
                }}
              />
            </div>

            {/* Minimum Rating */}
            <div>
              <div className="text-xs font-medium text-gray-600 mb-2">Min. Rating</div>
              <input
                type="number"
                min={0}
                max={5}
                step={0.5}
                placeholder="e.g. 3"
                className="px-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                onChange={(e) => {
                  const val = e.target.value;
                  const num = val === '' ? undefined : Number(val);
                  setFilters(prev => ({ ...prev, minRating: num }));
                }}
              />
            </div>
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
              <div className="p-4 text-sm text-gray-500">Loading candidates...</div>
            ) : candidates.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No candidates found</div>
            ) : (
              candidates.map((c: Candidate) => (
                <label key={c.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 mr-3"
                    checked={!!selected[c.id]}
                    onChange={(e) => toggleOne(c.id, e.target.checked)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{c.firstName} {c.lastName}</div>
                    <div className="text-xs text-gray-600 truncate">{c.email} • {c.currentTitle || '—'}</div>
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
            {submitting ? 'Adding...' : 'Add Applicants'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectCandidatesModal;
