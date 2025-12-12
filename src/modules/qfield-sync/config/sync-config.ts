/**
 * QField Sync Configuration
 * Central configuration for QFieldCloud to FibreFlow synchronization
 */

import { QFieldSyncConfig, FieldMapping } from '../types/qfield-sync.types';

// Field mapping between QFieldCloud and FibreFlow database
export const FIBER_CABLE_FIELD_MAPPING: FieldMapping[] = [
  { source: 'cable_id', target: 'cable_id', transform: 'none' },
  { source: 'cable_type', target: 'cable_type', transform: 'uppercase' },
  { source: 'cable_size', target: 'cable_size', transform: 'number' },
  { source: 'fiber_count', target: 'fiber_count', transform: 'number' },
  { source: 'start_pole', target: 'start_location', transform: 'none' },
  { source: 'end_pole', target: 'end_location', transform: 'none' },
  { source: 'geometry', target: 'route_map', transform: 'json' },
  { source: 'calculated_length', target: 'length', transform: 'number' },
  { source: 'status', target: 'status', transform: 'lowercase' },
  { source: 'installed_by', target: 'installed_by', transform: 'none' },
  { source: 'installation_date', target: 'installation_date', transform: 'date' },
  { source: 'splice_complete', target: 'splicing_complete', transform: 'boolean' },
  { source: 'test_complete', target: 'testing_complete', transform: 'boolean' },
  { source: 'notes', target: 'notes', transform: 'none' },
];

// Status mapping between systems
export const STATUS_MAPPING = {
  // QField -> FibreFlow
  qfieldToFibreflow: {
    'field_planned': 'pending',
    'field_progress': 'in_progress',
    'field_complete': 'completed',
    'field_issue': 'issues',
  },
  // FibreFlow -> QField
  fibreflowToQfield: {
    'pending': 'field_planned',
    'planned': 'field_planned',
    'in_progress': 'field_progress',
    'completed': 'field_complete',
    'issues': 'field_issue',
  }
};

// Default configuration
export const DEFAULT_SYNC_CONFIG: QFieldSyncConfig = {
  qfieldcloud: {
    url: process.env.NEXT_PUBLIC_QFIELD_URL || 'https://qfield.fibreflow.app',
    projectId: process.env.NEXT_PUBLIC_QFIELD_PROJECT_ID || '',
    apiKey: process.env.QFIELD_API_KEY || '',
    pollingInterval: 300, // 5 minutes
  },
  fibreflow: {
    databaseUrl: process.env.DATABASE_URL || '',
    targetTable: 'sow_fibre',
  },
  mapping: FIBER_CABLE_FIELD_MAPPING,
  syncMode: 'automatic',
  syncDirection: 'bidirectional',
  autoResolveConflicts: false,
};

// QFieldCloud API endpoints
export const QFIELD_API_ENDPOINTS = {
  projects: '/api/v1/projects',
  project: (id: string) => `/api/v1/projects/${id}`,
  layers: (projectId: string) => `/api/v1/projects/${projectId}/layers`,
  features: (projectId: string, layerId: string) => `/api/v1/projects/${projectId}/layers/${layerId}/features`,
  sync: (projectId: string) => `/api/v1/projects/${projectId}/sync`,
};

// Sync intervals (in milliseconds)
export const SYNC_INTERVALS = {
  REAL_TIME: 30000,       // 30 seconds
  FREQUENT: 300000,       // 5 minutes
  NORMAL: 900000,         // 15 minutes
  SLOW: 3600000,          // 1 hour
};

// Error messages
export const ERROR_MESSAGES = {
  CONNECTION_FAILED: 'Failed to connect to QFieldCloud',
  INVALID_CREDENTIALS: 'Invalid API credentials',
  PROJECT_NOT_FOUND: 'QFieldCloud project not found',
  LAYER_NOT_FOUND: 'Required layer not found in project',
  SYNC_IN_PROGRESS: 'A sync operation is already in progress',
  TRANSFORMATION_FAILED: 'Failed to transform data',
  DATABASE_ERROR: 'Database operation failed',
  NETWORK_ERROR: 'Network connection error',
};

// Success messages
export const SUCCESS_MESSAGES = {
  SYNC_COMPLETED: 'Synchronization completed successfully',
  CONNECTION_ESTABLISHED: 'Connected to QFieldCloud',
  RECORDS_SYNCED: (count: number) => `${count} records synchronized`,
  CONFLICTS_RESOLVED: 'All conflicts resolved',
};

// Validation rules for fiber cable data
export const FIBER_CABLE_VALIDATION = {
  cable_id: {
    required: true,
    pattern: /^[A-Z0-9-]+$/,
    message: 'Cable ID must contain only uppercase letters, numbers, and hyphens',
  },
  cable_type: {
    required: true,
    options: ['SM', 'MM', 'HYBRID', '48-core SM', '24-core SM', '96-core SM'],
    message: 'Invalid cable type',
  },
  length: {
    required: true,
    min: 1,
    max: 10000,
    message: 'Cable length must be between 1 and 10,000 meters',
  },
  fiber_count: {
    required: true,
    options: [4, 8, 12, 24, 48, 96, 144, 288],
    message: 'Invalid fiber count',
  },
  status: {
    required: true,
    options: ['pending', 'planned', 'in_progress', 'completed', 'issues'],
    message: 'Invalid status',
  },
};

// Layer configuration for QFieldCloud
export const QFIELD_LAYERS = {
  FIBER_CABLES: {
    name: 'fiber_cables',
    type: 'LineString',
    fields: [
      { name: 'cable_id', type: 'string', alias: 'Cable ID' },
      { name: 'cable_type', type: 'string', alias: 'Cable Type' },
      { name: 'cable_size', type: 'integer', alias: 'Cable Size' },
      { name: 'fiber_count', type: 'integer', alias: 'Fiber Count' },
      { name: 'start_pole', type: 'string', alias: 'Start Pole' },
      { name: 'end_pole', type: 'string', alias: 'End Pole' },
      { name: 'status', type: 'string', alias: 'Status' },
      { name: 'installed_by', type: 'string', alias: 'Installed By' },
      { name: 'installation_date', type: 'date', alias: 'Installation Date' },
      { name: 'splice_complete', type: 'boolean', alias: 'Splicing Complete' },
      { name: 'test_complete', type: 'boolean', alias: 'Testing Complete' },
      { name: 'notes', type: 'string', alias: 'Notes' },
    ],
  },
  POLES: {
    name: 'poles',
    type: 'Point',
    fields: [
      { name: 'pole_id', type: 'string', alias: 'Pole ID' },
      { name: 'pole_number', type: 'string', alias: 'Pole Number' },
      { name: 'latitude', type: 'double', alias: 'Latitude' },
      { name: 'longitude', type: 'double', alias: 'Longitude' },
      { name: 'height', type: 'double', alias: 'Height' },
      { name: 'material', type: 'string', alias: 'Material' },
      { name: 'status', type: 'string', alias: 'Status' },
    ],
  },
  SPLICE_CLOSURES: {
    name: 'splice_closures',
    type: 'Point',
    fields: [
      { name: 'closure_id', type: 'string', alias: 'Closure ID' },
      { name: 'type', type: 'string', alias: 'Type' },
      { name: 'cable_id', type: 'string', alias: 'Cable ID' },
      { name: 'latitude', type: 'double', alias: 'Latitude' },
      { name: 'longitude', type: 'double', alias: 'Longitude' },
      { name: 'splice_date', type: 'date', alias: 'Splice Date' },
      { name: 'technician', type: 'string', alias: 'Technician' },
    ],
  },
};

// Sync priority levels
export const SYNC_PRIORITY = {
  HIGH: 1,    // Critical data, sync immediately
  NORMAL: 2,  // Regular data, sync on schedule
  LOW: 3,     // Non-critical, sync when idle
};

// Maximum retry attempts for failed syncs
export const MAX_RETRY_ATTEMPTS = 3;

// Batch size for bulk operations
export const BATCH_SIZE = {
  SMALL: 10,
  MEDIUM: 50,
  LARGE: 100,
  MAX: 500,
};

export default DEFAULT_SYNC_CONFIG;