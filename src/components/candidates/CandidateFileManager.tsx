import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  File, 
  Download, 
  Trash2, 
  Star, 
  StarOff,
  Eye,
  Plus
} from 'lucide-react';
import FileUpload, { FilePreview } from '../common/FileUpload';
import { useFileUpload } from '../../hooks/useFileUpload';
import LoadingSpinner from '../common/LoadingSpinner';

interface CandidateFileManagerProps {
  candidateId: string;
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
}

const CandidateFileManager: React.FC<CandidateFileManagerProps> = ({
  candidateId,
  companyId,
  isOpen,
  onClose
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('resume');
  const [showUpload, setShowUpload] = useState(false);
  
  const { 
    files, 
    loading, 
    uploading, 
    uploadFile, 
    fetchFiles, 
    deleteFile, 
    setPrimaryFile 
  } = useFileUpload({ candidateId, companyId });

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
    }
  }, [isOpen, fetchFiles]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const result = await uploadFile(selectedFile, uploadCategory, false);
    if (result.success) {
      setSelectedFile(null);
      setShowUpload(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      await deleteFile(fileId);
    }
  };

  const handleSetPrimary = async (fileId: string) => {
    await setPrimaryFile(fileId);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      resume: 'bg-blue-100 text-blue-800',
      cover_letter: 'bg-green-100 text-green-800',
      portfolio: 'bg-purple-100 text-purple-800',
      certificate: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Candidate Files
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Upload File</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload Section */}
          {showUpload && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload New File</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="resume">Resume</option>
                    <option value="cover_letter">Cover Letter</option>
                    <option value="portfolio">Portfolio</option>
                    <option value="certificate">Certificate</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {!selectedFile ? (
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    acceptedTypes={['.pdf', '.doc', '.docx']}
                    maxSize={5}
                    disabled={uploading}
                  />
                ) : (
                  <div className="space-y-2">
                    <FilePreview
                      file={selectedFile}
                      onRemove={() => setSelectedFile(null)}
                      uploading={uploading}
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setSelectedFile(null)}
                        disabled={uploading}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                      >
                        <Upload size={16} />
                        <span>{uploading ? 'Uploading...' : 'Upload'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Files List */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Uploaded Files</h3>
            
            {loading ? (
              <LoadingSpinner text="Loading files..." />
            ) : files.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <File className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No files uploaded</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Upload the candidate's resume and other documents.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <File className="w-5 h-5 text-gray-400 mr-3" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.fileName}
                        </p>
                        {file.isPrimary && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(file.fileCategory)}`}>
                          {file.fileCategory.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.fileSize)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(file.uploadedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => window.open(file.fileUrl, '_blank')}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View file"
                      >
                        <Eye size={16} />
                      </button>
                      
                      <a
                        href={file.fileUrl}
                        download={file.fileName}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                        title="Download file"
                      >
                        <Download size={16} />
                      </a>

                      <button
                        onClick={() => handleSetPrimary(file.id)}
                        className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg"
                        title={file.isPrimary ? "Remove as primary" : "Set as primary"}
                      >
                        {file.isPrimary ? <StarOff size={16} /> : <Star size={16} />}
                      </button>

                      <button
                        onClick={() => handleDelete(file.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete file"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateFileManager;
