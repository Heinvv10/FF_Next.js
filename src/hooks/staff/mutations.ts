/**
 * Staff Mutations
 * Mutation hooks for staff data modification
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '@/services/staffService';
import type { StaffFormData, StaffMember } from '@/types/staff.types';
import { staffKeys } from './queryKeys';
import { log } from '@/lib/logger';

/**
 * Hook to create a new staff member
 */
export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StaffFormData) => staffService.create(data as unknown as Partial<StaffMember>),
    onSuccess: () => {
      // Invalidate and refetch staff queries
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
    onError: (error: Error) => {
      log.error('Failed to create staff member:', { data: error }, 'mutations');
      throw error;
    },
  });
}

/**
 * Hook to create or update a staff member (upsert operation)
 */
export function useCreateOrUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StaffFormData) => staffService.createOrUpdate(data as unknown as Partial<StaffMember>),
    onSuccess: () => {
      // Invalidate and refetch all staff queries since we don't know if it was create or update
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
    onError: (error: Error) => {
      log.error('Failed to create or update staff member:', { data: error }, 'mutations');
      throw error;
    },
  });
}

/**
 * Hook to update a staff member
 */
export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StaffFormData> }) =>
      staffService.update(id, data as unknown as Partial<StaffMember>),
    onSuccess: (_, { id }) => {
      // Invalidate specific staff member and list queries
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
      queryClient.invalidateQueries({ queryKey: staffKeys.active() });
      queryClient.invalidateQueries({ queryKey: staffKeys.projectManagers() });
      queryClient.invalidateQueries({ queryKey: staffKeys.summary() });
    },
    onError: (error: Error) => {
      log.error('Failed to update staff member:', { data: error }, 'mutations');
      throw error;
    },
  });
}

/**
 * Hook to delete a staff member
 */
export function useDeleteStaff() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => staffService.delete(id),
    onSuccess: (_, id) => {
      // Remove staff member from cache and invalidate lists
      queryClient.removeQueries({ queryKey: staffKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
      queryClient.invalidateQueries({ queryKey: staffKeys.active() });
      queryClient.invalidateQueries({ queryKey: staffKeys.projectManagers() });
      queryClient.invalidateQueries({ queryKey: staffKeys.summary() });
    },
    onError: (error: Error) => {
      log.error('Failed to delete staff member:', { data: error }, 'mutations');
      throw error;
    },
  });
}

/**
 * Hook to assign staff to project
 */
export function useAssignStaffToProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => 
      staffService.assignToProject(),
    onSuccess: () => {
      // Invalidate all staff queries
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
    onError: (error: Error) => {
      log.error('Failed to assign staff to project:', { data: error }, 'mutations');
      throw error;
    },
  });
}

/**
 * Hook to update staff project count
 */
export function useUpdateStaffProjectCount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => 
      staffService.updateStaffProjectCount(),
    onSuccess: () => {
      // Invalidate staff queries to show updated counts
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
    onError: (error: Error) => {
      log.error('Failed to update staff project count:', { data: error }, 'mutations');
      throw error;
    },
  });
}