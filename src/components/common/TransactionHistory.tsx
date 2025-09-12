import { useState } from 'react';
import { History, ChevronDown, ChevronRight, User, Clock, Eye, EyeOff } from 'lucide-react';
import { useAuditLogs, getChangeDescription, getChangedFields, getFieldChangeDetails, formatAuditValue } from '../../hooks/useAuditLogs';
import { formatDistanceToNow } from 'date-fns';

interface TransactionHistoryProps {
  tableName: string;
  recordId: string;
  className?: string;
}

export function TransactionHistory({ tableName, recordId, className = '' }: TransactionHistoryProps) {
  const { auditLogs, loading, error } = useAuditLogs(tableName, recordId);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState<Set<string>>(new Set());

  const toggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const toggleDetails = (logId: string) => {
    const newDetails = new Set(showDetails);
    if (newDetails.has(logId)) {
      newDetails.delete(logId);
    } else {
      newDetails.add(logId);
    }
    setShowDetails(newDetails);
  };

  const formatUserName = (user: any) => {
    if (!user) return 'System';
    return `${user.first_name} ${user.last_name}`.trim() || user.email;
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return 'text-green-600 bg-green-50';
      case 'UPDATE':
        return 'text-blue-600 bg-blue-50';
      case 'DELETE':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5" />
          <h3 className="text-lg font-medium">Transaction History</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5" />
          <h3 className="text-lg font-medium">Transaction History</h3>
        </div>
        <div className="text-red-600 text-sm">Error loading transaction history: {error}</div>
      </div>
    );
  }

  if (auditLogs.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5" />
          <h3 className="text-lg font-medium">Transaction History</h3>
        </div>
        <div className="text-gray-500 text-sm">No transaction history available.</div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <History className="h-5 w-5" />
        <h3 className="text-lg font-medium">Transaction History</h3>
        <span className="text-sm text-gray-500">({auditLogs.length} changes)</span>
      </div>

      <div className="space-y-3">
        {auditLogs.map((log) => {
          const isExpanded = expandedLogs.has(log.id);
          const showDetailView = showDetails.has(log.id);
          const changedFields = log.operation === 'UPDATE' && log.old_data && log.new_data 
            ? getChangedFields(log.old_data, log.new_data) 
            : [];
          
          return (
            <div key={log.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleExpanded(log.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                    
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOperationColor(log.operation)}`}>
                      {log.operation}
                    </span>
                    
                    <span className="text-sm font-medium">
                      {getChangeDescription(log)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{formatUserName(log.changed_by_user)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span title={new Date(log.changed_at).toLocaleString()}>
                        {formatDistanceToNow(new Date(log.changed_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 border-t border-gray-200 bg-white">
                  {log.operation === 'UPDATE' && changedFields.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          Changed Fields ({changedFields.length})
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDetails(log.id);
                          }}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          {showDetailView ? (
                            <>
                              <EyeOff className="h-3 w-3" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3" />
                              Show Details
                            </>
                          )}
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {changedFields.map((field) => {
                          const fieldChange = getFieldChangeDetails(log, field.toLowerCase().replace(/ /g, '_'));
                          
                          return (
                            <div key={field} className="bg-gray-50 rounded p-3">
                              <div className="font-medium text-sm text-gray-900 mb-1">
                                {field}
                              </div>
                              
                              {showDetailView ? (
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                  <div>
                                    <div className="text-gray-500 mb-1">Previous Value:</div>
                                    <div className="bg-red-50 border border-red-200 rounded p-2 font-mono">
                                      {formatAuditValue(fieldChange.oldValue)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500 mb-1">New Value:</div>
                                    <div className="bg-green-50 border border-green-200 rounded p-2 font-mono">
                                      {formatAuditValue(fieldChange.newValue)}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-gray-600">
                                  Changed from "{formatAuditValue(fieldChange.oldValue)}" to "{formatAuditValue(fieldChange.newValue)}"
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {log.operation === 'INSERT' && log.new_data && showDetailView && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Record Created</h4>
                      <pre className="bg-green-50 border border-green-200 rounded p-3 text-xs overflow-x-auto">
                        {JSON.stringify(log.new_data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {log.operation === 'DELETE' && log.old_data && showDetailView && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Record Deleted</h4>
                      <pre className="bg-red-50 border border-red-200 rounded p-3 text-xs overflow-x-auto">
                        {JSON.stringify(log.old_data, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    <strong>Timestamp:</strong> {new Date(log.changed_at).toLocaleString()}
                    <br />
                    <strong>Operation ID:</strong> {log.id}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
