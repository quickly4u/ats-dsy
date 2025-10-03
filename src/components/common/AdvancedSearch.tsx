import React, { useState } from 'react';
import { Search, Filter, X, Plus, Minus } from 'lucide-react';

export interface SearchCriterion {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in';
  value: string | number | string[];
  secondValue?: string | number; // For 'between' operator
}

export interface AdvancedSearchProps {
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select';
    options?: Array<{ value: string; label: string }>;
  }>;
  onSearch: (criteria: SearchCriterion[]) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  fields,
  onSearch,
  onClear,
  placeholder = 'Search...',
  className = '',
}) => {
  const [quickSearch, setQuickSearch] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [criteria, setCriteria] = useState<SearchCriterion[]>([
    { field: fields[0]?.key || '', operator: 'contains', value: '' }
  ]);

  const operators = {
    text: [
      { value: 'contains', label: 'Contains' },
      { value: 'equals', label: 'Equals' },
      { value: 'startsWith', label: 'Starts with' },
      { value: 'endsWith', label: 'Ends with' },
    ],
    number: [
      { value: 'equals', label: 'Equals' },
      { value: 'greaterThan', label: 'Greater than' },
      { value: 'lessThan', label: 'Less than' },
      { value: 'between', label: 'Between' },
    ],
    date: [
      { value: 'equals', label: 'On' },
      { value: 'greaterThan', label: 'After' },
      { value: 'lessThan', label: 'Before' },
      { value: 'between', label: 'Between' },
    ],
    select: [
      { value: 'equals', label: 'Is' },
      { value: 'in', label: 'Is any of' },
    ],
  };

  const addCriterion = () => {
    setCriteria([...criteria, { field: fields[0]?.key || '', operator: 'contains', value: '' }]);
  };

  const removeCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const updateCriterion = (index: number, updates: Partial<SearchCriterion>) => {
    const newCriteria = [...criteria];
    newCriteria[index] = { ...newCriteria[index], ...updates };

    // Reset operator if field type changes
    if (updates.field) {
      const field = fields.find(f => f.key === updates.field);
      if (field) {
        const availableOps = operators[field.type as keyof typeof operators] || operators.text;
        newCriteria[index].operator = availableOps[0].value as any;
      }
    }

    setCriteria(newCriteria);
  };

  const handleQuickSearch = (value: string) => {
    setQuickSearch(value);
    if (value.trim()) {
      // Quick search searches across all text fields
      const textFields = fields.filter(f => f.type === 'text');
      onSearch(textFields.map(field => ({
        field: field.key,
        operator: 'contains',
        value: value
      })));
    } else {
      onClear();
    }
  };

  const handleAdvancedSearch = () => {
    const validCriteria = criteria.filter(c => c.value !== '' && c.value !== null);
    onSearch(validCriteria);
  };

  const handleClearAll = () => {
    setQuickSearch('');
    setCriteria([{ field: fields[0]?.key || '', operator: 'contains', value: '' }]);
    onClear();
  };

  const getFieldOperators = (fieldKey: string) => {
    const field = fields.find(f => f.key === fieldKey);
    return field ? operators[field.type as keyof typeof operators] || operators.text : operators.text;
  };

  const getFieldType = (fieldKey: string): 'text' | 'number' | 'date' | 'select' => {
    const field = fields.find(f => f.key === fieldKey);
    return field?.type || 'text';
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Quick Search */}
      <div className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder={placeholder}
              value={quickSearch}
              onChange={(e) => handleQuickSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {quickSearch && (
              <button
                onClick={handleClearAll}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
              showAdvanced
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter size={18} />
            <span>Advanced</span>
          </button>
        </div>
      </div>

      {/* Advanced Search */}
      {showAdvanced && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="space-y-3">
            {criteria.map((criterion, index) => {
              const fieldType = getFieldType(criterion.field);
              const field = fields.find(f => f.key === criterion.field);

              return (
                <div key={index} className="flex items-center gap-2">
                  {/* Field Selector */}
                  <select
                    value={criterion.field}
                    onChange={(e) => updateCriterion(index, { field: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {fields.map(field => (
                      <option key={field.key} value={field.key}>{field.label}</option>
                    ))}
                  </select>

                  {/* Operator Selector */}
                  <select
                    value={criterion.operator}
                    onChange={(e) => updateCriterion(index, { operator: e.target.value as any })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {getFieldOperators(criterion.field).map(op => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>

                  {/* Value Input */}
                  <div className="flex-1 flex items-center gap-2">
                    {fieldType === 'select' ? (
                      <select
                        value={criterion.value as string}
                        onChange={(e) => updateCriterion(index, { value: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select...</option>
                        {field?.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <>
                        <input
                          type={fieldType}
                          value={criterion.value as string}
                          onChange={(e) => updateCriterion(index, { value: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter value..."
                        />
                        {criterion.operator === 'between' && (
                          <>
                            <span className="text-gray-500">and</span>
                            <input
                              type={fieldType}
                              value={criterion.secondValue as string || ''}
                              onChange={(e) => updateCriterion(index, { secondValue: e.target.value })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter second value..."
                            />
                          </>
                        )}
                      </>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeCriterion(index)}
                    disabled={criteria.length === 1}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus size={18} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={addCriterion}
              className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
            >
              <Plus size={16} />
              <span>Add Criterion</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Clear All
              </button>
              <button
                onClick={handleAdvancedSearch}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
