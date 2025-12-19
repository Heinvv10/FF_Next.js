// src/modules/ticketing/components/AttachmentUpload.tsx
// Upload and manage file attachments for tickets
'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import type { TicketAttachment } from '../types';

interface AttachmentUploadProps {
  ticketId: string;
  attachments: TicketAttachment[];
  onAttachmentAdded?: () => void;
}

export function AttachmentUpload({ ticketId, attachments, onAttachmentAdded }: AttachmentUploadProps) {
  const { user } = useUser();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ];

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      alert('File size must be less than 10MB');
      return;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('File type not allowed. Please upload images, PDFs, or Office documents.');
      return;
    }

    setSelectedFile(file);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(0);

      // Create FormData
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('ticket_id', ticketId);

      // Upload to API
      const res = await fetch(`/api/ticketing/tickets/${ticketId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setSelectedFile(null);
        setShowUploadForm(false);
        setUploadProgress(100);
        if (onAttachmentAdded) {
          onAttachmentAdded();
        } else {
          window.location.reload();
        }
      } else {
        alert(`Failed to upload file: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('An error occurred while uploading file');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  }

  async function handleDelete(attachmentId: string, filename: string) {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/ticketing/tickets/${ticketId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        if (onAttachmentAdded) {
          onAttachmentAdded();
        } else {
          window.location.reload();
        }
      } else {
        alert(`Failed to delete attachment: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      alert('An error occurred while deleting attachment');
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  function getFileIcon(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
      case 'csv':
        return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      case 'txt':
        return '📃';
      default:
        return '📎';
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Button/Form */}
      {!showUploadForm ? (
        <button
          onClick={() => setShowUploadForm(true)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Upload Attachment
        </button>
      ) : (
        <form onSubmit={handleUpload} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              onChange={handleFileSelect}
              accept={ALLOWED_TYPES.join(',')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Max file size: 10MB. Allowed: Images, PDFs, Office documents
            </p>
          </div>

          {selectedFile && (
            <div className="p-3 bg-white border border-gray-200 rounded-md">
              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
          )}

          {loading && uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowUploadForm(false);
                setSelectedFile(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedFile}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${
                loading || !selectedFile ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </form>
      )}

      {/* Attachments List */}
      <div className="space-y-2">
        {attachments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">No attachments yet</p>
            <p className="text-xs text-gray-400 mt-1">Upload files to attach them to this ticket</p>
          </div>
        ) : (
          attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <div className="flex items-center space-x-3 flex-1">
                <span className="text-2xl">{getFileIcon(attachment.filename)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {attachment.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    Uploaded by {attachment.uploaded_by_name} on{' '}
                    {new Date(attachment.uploaded_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={attachment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Download
                </a>
                {attachment.uploaded_by === user?.id && (
                  <button
                    onClick={() => handleDelete(attachment.id, attachment.filename)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
