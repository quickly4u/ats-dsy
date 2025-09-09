import React, { useCallback, useState } from 'react';
import { Upload, X, File, AlertCircle } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  disabled?: boolean;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  acceptedTypes = ['.pdf', '.doc', '.docx'],
  maxSize = 5,
  disabled = false,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const { error } = useToast();

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      error('File too large', `File size must be less than ${maxSize}MB`);
      return false;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      error('Invalid file type', `Only ${acceptedTypes.join(', ')} files are allowed`);
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragOver
          ? 'border-blue-400 bg-blue-50'
          : disabled
          ? 'border-gray-200 bg-gray-50'
          : 'border-gray-300 hover:border-gray-400'
      } ${className}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleInputChange}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      
      <div className="flex flex-col items-center space-y-2">
        <Upload className={`w-8 h-8 ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
        <div>
          <p className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
            <span className="font-medium">Click to upload</span> or drag and drop
          </p>
          <p className={`text-xs ${disabled ? 'text-gray-300' : 'text-gray-500'}`}>
            {acceptedTypes.join(', ')} up to {maxSize}MB
          </p>
        </div>
      </div>
    </div>
  );
};

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  uploading?: boolean;
  error?: string;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  onRemove,
  uploading = false,
  error
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`flex items-center p-3 border rounded-lg ${
      error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
    }`}>
      <File className={`w-5 h-5 mr-3 ${error ? 'text-red-500' : 'text-gray-400'}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${
          error ? 'text-red-900' : 'text-gray-900'
        }`}>
          {file.name}
        </p>
        <p className={`text-xs ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {formatFileSize(file.size)}
        </p>
        {error && (
          <div className="flex items-center mt-1">
            <AlertCircle className="w-3 h-3 text-red-500 mr-1" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}
      </div>
      {uploading && (
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
      )}
      <button
        onClick={onRemove}
        disabled={uploading}
        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default FileUpload;
