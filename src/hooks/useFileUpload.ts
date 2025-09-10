import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';

interface UploadedFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  fileCategory: string;
  isPrimary: boolean;
  uploadedAt: string;
}

interface UseFileUploadOptions {
  candidateId: string;
  companyId: string;
}

export const useFileUpload = ({ candidateId, companyId }: UseFileUploadOptions) => {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const uploadFile = async (
    file: File, 
    category: string = 'resume',
    isPrimary: boolean = false
  ): Promise<{ success: boolean; fileId?: string; error?: string }> => {
    try {
      setUploading(true);

      // Generate unique file path
      const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const fileName = `${companyId}/${candidateId}/${Date.now()}_${safeName}`;
      const storagePath = fileName; // within 'candidate-files' bucket

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('candidate-files')
        .upload(storagePath, file, { upsert: false });
      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from('candidate-files')
        .getPublicUrl(storagePath);
      const fileUrl = publicUrl.publicUrl;

      // Save file metadata to database
      const { data: fileData, error: dbError } = await supabase
        .from('candidate_files')
        .insert({
          candidate_id: candidateId,
          company_id: companyId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_url: fileUrl,
          storage_path: storagePath,
          file_category: category,
          is_primary: isPrimary,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('candidate-files').remove([storagePath]);
        throw new Error(`Database error: ${dbError.message}`);
      }

      success('File uploaded successfully', `${file.name} has been uploaded`);
      
      // Refresh file list
      await fetchFiles();
      
      return { success: true, fileId: fileData.id };
    } catch (err: any) {
      error('Upload failed', err.message);
      return { success: false, error: err.message };
    } finally {
      setUploading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('candidate_files')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setFiles(data.map(file => ({
        id: file.id,
        fileName: file.file_name,
        fileType: file.file_type,
        fileSize: file.file_size,
        fileUrl: file.file_url,
        fileCategory: file.file_category,
        isPrimary: file.is_primary,
        uploadedAt: file.created_at
      })));
    } catch (err: any) {
      error('Failed to load files', err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId: string): Promise<boolean> => {
    try {
      // Get file info first
      const { data: fileData, error: fetchError } = await supabase
        .from('candidate_files')
        .select('storage_path')
        .eq('id', fileId)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('candidate-files')
        .remove([fileData.storage_path]);

      if (storageError) {
        console.warn('Storage deletion failed:', storageError.message);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('candidate_files')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        throw new Error(dbError.message);
      }

      success('File deleted', 'File has been removed successfully');
      await fetchFiles();
      return true;
    } catch (err: any) {
      error('Delete failed', err.message);
      return false;
    }
  };

  const setPrimaryFile = async (fileId: string): Promise<boolean> => {
    try {
      // First, unset all primary files for this candidate
      await supabase
        .from('candidate_files')
        .update({ is_primary: false })
        .eq('candidate_id', candidateId);

      // Set the selected file as primary
      const { error } = await supabase
        .from('candidate_files')
        .update({ is_primary: true })
        .eq('id', fileId);

      if (error) {
        throw new Error(error.message);
      }

      success('Primary file updated', 'Primary resume has been set');
      await fetchFiles();
      return true;
    } catch (err: any) {
      error('Update failed', err.message);
      return false;
    }
  };

  return {
    files,
    loading,
    uploading,
    uploadFile,
    fetchFiles,
    deleteFile,
    setPrimaryFile
  };
};
