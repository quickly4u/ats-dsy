import { Clock, User } from 'lucide-react';
import { useAuditInfo } from '../../hooks/useAuditLogs';
import { formatDistanceToNow } from 'date-fns';

interface AuditInfoProps {
  tableName: string;
  recordId: string;
  className?: string;
}

export function AuditInfo({ tableName, recordId, className = '' }: AuditInfoProps) {
  const { auditInfo, loading } = useAuditInfo(tableName, recordId);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (!auditInfo) return null;

  const formatUserName = (user: any) => {
    if (!user) return 'Unknown User';
    return `${user.first_name} ${user.last_name}`.trim() || user.email;
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      relative: formatDistanceToNow(date, { addSuffix: true }),
      absolute: date.toLocaleString()
    };
  };

  const createdTime = formatDateTime(auditInfo.created_at);
  const updatedTime = formatDateTime(auditInfo.updated_at);
  const isUpdated = auditInfo.created_at !== auditInfo.updated_at;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1" title={`Created ${createdTime.absolute}`}>
          <User className="h-4 w-4" />
          <span>Created by {formatUserName(auditInfo.created_by_user)}</span>
          <Clock className="h-4 w-4 ml-2" />
          <span>{createdTime.relative}</span>
        </div>
      </div>
      
      {isUpdated && (
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1" title={`Updated ${updatedTime.absolute}`}>
            <User className="h-4 w-4" />
            <span>Updated by {formatUserName(auditInfo.updated_by_user)}</span>
            <Clock className="h-4 w-4 ml-2" />
            <span>{updatedTime.relative}</span>
          </div>
        </div>
      )}
    </div>
  );
}
