/**
 * QField OES Sync Page - v5 with Project Selection
 * /admin/qfield-sync
 * Upload OES reports and trigger automated sync to QFieldCloud
 *
 * Version: 5.0
 * Date: 2025-11-25
 * Features: Project selection, create new projects, auto-layer config, real-time logs
 */

import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

interface LogEntry {
  type: 'log' | 'error' | 'start' | 'complete';
  message?: string;
  timestamp: string;
  success?: boolean;
  stats?: {
    extracted: number;
    matched: number;
    uploaded: number;
    errors: number;
    warnings: number;
  };
}

interface Project {
  id: string;
  name: string;
  owner?: string;
}

export default function QFieldSyncPage() {
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const logViewerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logViewerRef.current) {
      logViewerRef.current.scrollTop = logViewerRef.current.scrollHeight;
    }
  }, [logs]);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await fetch('/api/qfield/projects');
      const data = await response.json();

      if (data.success && data.projects) {
        setProjects(data.projects);
      } else {
        setError('Failed to load projects');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert('Project name is required');
      return;
    }

    setCreatingProject(true);
    try {
      const response = await fetch('/api/qfield/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: newProjectDesc.trim() || `OES Sync - ${newProjectName.trim()}`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      // Reload projects and select the new one
      await loadProjects();
      setSelectedProjectId(data.project.id);
      setShowCreateForm(false);
      setNewProjectName('');
      setNewProjectDesc('');
      alert(`✅ Project "${newProjectName}" created successfully!`);
    } catch (err: any) {
      alert(`❌ Failed to create project: ${err.message}`);
    } finally {
      setCreatingProject(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadSuccess(false);
      setError(null);
    }
  };

  // Handle drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setUploadSuccess(false);
      setError(null);
    }
  };

  // Upload file to VPS
  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/qfield/oes-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadSuccess(true);
      setError(null);
      console.log('Upload successful:', data);
    } catch (err: any) {
      setError(err.message);
      setUploadSuccess(false);
    } finally {
      setUploading(false);
    }
  };

  // Run OES sync
  const handleSync = async () => {
    if (!selectedProjectId) {
      alert('Please select a destination project first');
      return;
    }

    setSyncing(true);
    setLogs([]);
    setStats(null);
    setError(null);

    try {
      const response = await fetch('/api/qfield/oes-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProjectId }),
      });

      if (!response.ok) {
        throw new Error('Failed to start sync');
      }

      // Read Server-Sent Events stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              setLogs((prev) => [...prev, data]);

              if (data.type === 'complete') {
                if (data.stats) {
                  setStats(data.stats);
                }
                if (data.success) {
                  setLastSync(new Date().toISOString());
                } else {
                  setError(data.error || 'Sync failed');
                }
              }
            } catch (e) {
              console.error('Failed to parse log:', e);
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  // Clear logs
  const handleClearLogs = () => {
    setLogs([]);
    setStats(null);
    setError(null);
  };

  return (
    <>
      <Head>
        <title>QField OES Sync v5 | FibreFlow</title>
      </Head>

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">QField OES Sync v5</h1>
            <p className="mt-2 text-gray-600">
              Upload daily OES reports and sync to QFieldCloud automatically
            </p>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Project, Upload & Sync */}
            <div className="lg:col-span-1 space-y-6">
              {/* Project Selection Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">🎯 QFieldCloud Project</h2>

                {/* Project Dropdown */}
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg mb-2"
                  disabled={loadingProjects}
                >
                  <option value="">
                    {loadingProjects ? 'Loading projects...' : 'Select a project...'}
                  </option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} {project.owner ? `(${project.owner})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mb-3">
                  {projects.length} projects available
                </p>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={loadProjects}
                    disabled={loadingProjects}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 disabled:bg-gray-300"
                  >
                    🔄 Refresh
                  </button>
                  <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
                  >
                    ➕ New Project
                  </button>
                </div>

                {/* Create Project Form */}
                {showCreateForm && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      placeholder="Project Name (e.g., OES_2025_01)"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded mb-2 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={newProjectDesc}
                      onChange={(e) => setNewProjectDesc(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded mb-3 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateProject}
                        disabled={creatingProject}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 disabled:bg-gray-300"
                      >
                        {creatingProject ? 'Creating...' : 'Create'}
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewProjectName('');
                          setNewProjectDesc('');
                        }}
                        className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* File Upload Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">📂 Upload OES Report</h2>

                {/* Drag & Drop Area */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {file ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600">
                        Click or drag file here
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Excel (.xlsx, .xls) or CSV
                      </p>
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  {uploading ? 'Uploading...' : 'Upload to VPS'}
                </button>

                {/* Upload Success */}
                {uploadSuccess && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">✅ File uploaded successfully</p>
                  </div>
                )}
              </div>

              {/* Sync Control Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">🚀 Run Sync</h2>

                {lastSync && (
                  <p className="text-sm text-gray-600 mb-4">
                    Last sync: {new Date(lastSync).toLocaleString()}
                  </p>
                )}

                <button
                  onClick={handleSync}
                  disabled={syncing || !selectedProjectId}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium"
                >
                  {syncing ? '⏳ Syncing...' : '🚀 Run OES Sync Now'}
                </button>

                {syncing && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    This may take 2-3 minutes...
                  </p>
                )}

                {!selectedProjectId && (
                  <p className="text-xs text-yellow-600 mt-2 text-center">
                    ⚠️ Select a project first
                  </p>
                )}
              </div>

              {/* Stats Card */}
              {stats && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4">📊 Summary</h2>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Extracted:</span>
                      <span className="text-sm font-medium">{stats.extracted.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Matched:</span>
                      <span className="text-sm font-medium text-green-600">
                        {stats.matched.toLocaleString()}
                      </span>
                    </div>
                    {stats.matched > 0 && stats.extracted > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Match Rate:</span>
                        <span className="text-sm font-medium">
                          {((stats.matched / stats.extracted) * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Warnings:</span>
                      <span className="text-sm font-medium text-yellow-600">{stats.warnings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Errors:</span>
                      <span className="text-sm font-medium text-red-600">{stats.errors}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Logs */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                {/* Log Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold">📜 Live Logs</h2>
                  <button
                    onClick={handleClearLogs}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Clear
                  </button>
                </div>

                {/* Log Viewer */}
                <div
                  ref={logViewerRef}
                  className="p-4 h-[600px] overflow-y-auto bg-gray-900 text-gray-100 font-mono text-sm"
                >
                  {logs.length === 0 ? (
                    <p className="text-gray-500">No logs yet. Upload a file and run sync.</p>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="mb-1">
                        {log.type === 'start' && (
                          <div className="text-blue-400">
                            ▶ Starting OES sync...
                          </div>
                        )}

                        {log.type === 'log' && (
                          <div className="text-gray-300">
                            {log.message}
                          </div>
                        )}

                        {log.type === 'error' && (
                          <div className="text-red-400">
                            ❌ {log.message}
                          </div>
                        )}

                        {log.type === 'complete' && (
                          <div className={log.success ? 'text-green-400' : 'text-red-400'}>
                            {log.success ? '✅ Sync complete!' : '❌ Sync failed'}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="p-4 bg-red-50 border-t border-red-200">
                    <p className="text-sm text-red-800">❌ {error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
