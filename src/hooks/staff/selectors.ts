/**
 * Staff Selectors
 * Helper hooks for staff selection in forms and dropdowns
 */

import { StaffDropdownOption } from '@/types/staff.types';
import { useActiveStaff, useProjectManagers } from './queries';

/**
 * Helper hook for staff selection in forms
 */
export function useStaffSelection() {
  const { data, isLoading } = useActiveStaff();
  const activeStaff: StaffDropdownOption[] = (data as StaffDropdownOption[]) || [];

  const getStaffById = (id: string): StaffDropdownOption | undefined => {
    return activeStaff.find((staff: StaffDropdownOption) => staff.id === id);
  };

  const searchStaff = (searchTerm: string): StaffDropdownOption[] => {
    if (!searchTerm) return activeStaff;

    const term = searchTerm.toLowerCase();
    return activeStaff.filter((staff: StaffDropdownOption) =>
      staff.name.toLowerCase().includes(term) ||
      staff.email.toLowerCase().includes(term) ||
      staff.position.toLowerCase().includes(term)
    );
  };

  return {
    staff: activeStaff,
    isLoading,
    getStaffById,
    searchStaff,
  };
}

/**
 * Helper hook for project manager selection
 */
export function useProjectManagerSelection() {
  const { data, isLoading } = useProjectManagers();
  const projectManagers: StaffDropdownOption[] = (data as StaffDropdownOption[]) || [];

  const getProjectManagerById = (id: string): StaffDropdownOption | undefined => {
    return projectManagers.find((manager: StaffDropdownOption) => manager.id === id);
  };

  const searchProjectManagers = (searchTerm: string): StaffDropdownOption[] => {
    if (!searchTerm) return projectManagers;

    const term = searchTerm.toLowerCase();
    return projectManagers.filter((manager: StaffDropdownOption) =>
      manager.name.toLowerCase().includes(term) ||
      manager.email.toLowerCase().includes(term) ||
      manager.position.toLowerCase().includes(term)
    );
  };

  const getAvailableProjectManagers = (): StaffDropdownOption[] => {
    // Filter for project managers who aren't over their project limit
    return projectManagers.filter((manager: StaffDropdownOption) =>
      manager.currentProjectCount < manager.maxProjectCount
    );
  };

  return {
    projectManagers,
    isLoading,
    getProjectManagerById,
    searchProjectManagers,
    getAvailableProjectManagers,
  };
}