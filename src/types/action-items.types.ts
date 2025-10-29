/**
 * Action Items Types
 * Extracted from Fireflies meeting summaries
 */

export type ActionItemStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type ActionItemPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ActionItem {
  id: string;
  meeting_id: number;

  // Core fields
  description: string;
  assignee_name?: string;
  assignee_email?: string;
  status: ActionItemStatus;
  priority: ActionItemPriority;

  // Timestamps
  due_date?: string;
  completed_date?: string;
  mentioned_at?: string; // e.g., "16:17" - timestamp in meeting

  // Tracking
  created_at: string;
  updated_at: string;
  created_by?: string;
  completed_by?: string;

  // Metadata
  tags?: string[];
  notes?: string;

  // Joined data (from meetings table)
  meeting_title?: string;
  meeting_date?: string;
}

export interface ActionItemCreateInput {
  meeting_id: number;
  description: string;
  assignee_name?: string;
  assignee_email?: string;
  status?: ActionItemStatus;
  priority?: ActionItemPriority;
  due_date?: string;
  mentioned_at?: string;
  tags?: string[];
  notes?: string;
}

export interface ActionItemUpdateInput {
  description?: string;
  assignee_name?: string;
  assignee_email?: string;
  status?: ActionItemStatus;
  priority?: ActionItemPriority;
  due_date?: string;
  completed_date?: string;
  tags?: string[];
  notes?: string;
}

export interface ActionItemFilters {
  status?: ActionItemStatus | ActionItemStatus[];
  assignee_name?: string;
  meeting_id?: number;
  priority?: ActionItemPriority;
  search?: string;
  overdue?: boolean;
}

export interface ActionItemStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
}

// For parsing Fireflies action items text
export interface ParsedActionItem {
  assignee: string;
  description: string;
  mentioned_at?: string;
}
