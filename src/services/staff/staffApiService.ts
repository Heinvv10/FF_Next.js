/**
 * Staff API Service
 * Uses API routes instead of direct database access for security
 */

import { StaffMember, StaffDropdownOption, StaffSummary } from '@/types/staff.types';
import { Timestamp } from 'firebase/firestore';

const API_BASE = '/api';

interface DbStaff {
  id?: string;
  employee_id?: string;
  name: string;
  email?: string;
  phone?: string;
  alternate_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  department?: string;
  position?: string;
  level?: string;
  type?: string;
  status?: string;
  salary?: number;
  join_date?: string;
  end_date?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  skills?: string[];
  certifications?: string[];
  notes?: string;
  reports_to?: string;
  project_count?: number;
  max_project_count?: number;
  manager_name?: string;
  hourly_rate?: number;
  contract_type?: string;
  working_hours?: string;
  available_weekends?: boolean;
  available_nights?: boolean;
  time_zone?: string;
  experience_years?: number;
  created_at?: string;
  updated_at?: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Convert ISO date string to Timestamp
 */
function toTimestamp(dateStr?: string): Timestamp {
  if (!dateStr) return Timestamp.now();
  return Timestamp.fromDate(new Date(dateStr));
}

/**
 * Transform database row to StaffMember type
 */
function transformDbToStaffMember(dbStaff: DbStaff): StaffMember {
  return {
    id: dbStaff.id,
    employeeId: dbStaff.employee_id || '',
    name: dbStaff.name,
    email: dbStaff.email || '',
    phone: dbStaff.phone || '',
    alternativePhone: dbStaff.alternate_phone,
    address: dbStaff.address || '',
    city: dbStaff.city || '',
    province: dbStaff.state || '',
    postalCode: dbStaff.postal_code || '',
    department: (dbStaff.department || 'Operations') as any,
    position: dbStaff.position || '',
    level: dbStaff.level as any,
    status: (dbStaff.status || 'active') as any,
    skills: (dbStaff.skills || []) as any[],
    certifications: (dbStaff.certifications || []) as any[],
    notes: dbStaff.notes,
    reportsTo: dbStaff.reports_to,
    currentProjectCount: dbStaff.project_count || 0,
    maxProjectCount: dbStaff.max_project_count || 5,
    managerName: dbStaff.manager_name,
    startDate: toTimestamp(dbStaff.join_date),
    endDate: dbStaff.end_date ? toTimestamp(dbStaff.end_date) : undefined,
    createdAt: toTimestamp(dbStaff.created_at),
    updatedAt: toTimestamp(dbStaff.updated_at),
    // Required fields with defaults
    experienceYears: dbStaff.experience_years || 0,
    specializations: [],
    contractType: (dbStaff.contract_type || 'permanent') as any,
    workingHours: dbStaff.working_hours || '08:00-17:00',
    availableWeekends: dbStaff.available_weekends || false,
    availableNights: dbStaff.available_nights || false,
    timeZone: dbStaff.time_zone || 'Africa/Johannesburg',
    activeProjectIds: [],
    totalProjectsCompleted: 0,
    averageProjectRating: 0,
    onTimeCompletionRate: 0,
    assignedEquipment: [],
    toolsAssigned: [],
    trainingRecords: [],
    createdBy: '',
    lastModifiedBy: '',
    emergencyContactName: dbStaff.emergency_contact_name,
    emergencyContactPhone: dbStaff.emergency_contact_phone,
    hourlyRate: dbStaff.hourly_rate,
    salaryAmount: dbStaff.salary,
  };
}

/**
 * Transform StaffMember to database format
 */
function transformStaffMemberToDb(staff: Partial<StaffMember>): Partial<DbStaff> {
  return {
    id: staff.id,
    employee_id: staff.employeeId,
    name: staff.name,
    email: staff.email,
    phone: staff.phone,
    alternate_phone: staff.alternativePhone,
    address: staff.address,
    city: staff.city,
    state: staff.province,
    postal_code: staff.postalCode,
    department: staff.department as string,
    position: staff.position as string,
    level: staff.level as string,
    status: staff.status as string,
    salary: staff.salaryAmount,
    join_date: staff.startDate instanceof Timestamp
      ? staff.startDate.toDate().toISOString()
      : staff.startDate instanceof Date
        ? staff.startDate.toISOString()
        : (staff.startDate as string) || undefined,
    end_date: staff.endDate instanceof Timestamp
      ? staff.endDate.toDate().toISOString()
      : staff.endDate instanceof Date
        ? staff.endDate.toISOString()
        : (staff.endDate as string) || undefined,
    emergency_contact_name: staff.emergencyContactName,
    emergency_contact_phone: staff.emergencyContactPhone,
    skills: staff.skills as string[],
    certifications: staff.certifications as string[],
    notes: staff.notes,
    reports_to: staff.reportsTo,
    hourly_rate: staff.hourlyRate,
    contract_type: staff.contractType as string,
    working_hours: staff.workingHours,
    available_weekends: staff.availableWeekends,
    available_nights: staff.availableNights,
    time_zone: staff.timeZone,
    experience_years: staff.experienceYears,
  };
}

export const staffApiService = {
  async getAll(filter?: any): Promise<StaffMember[]> {
    const params = new URLSearchParams();
    if (filter) {
      if (filter.search || filter.searchTerm) params.append('search', filter.search || filter.searchTerm);
      if (filter.department) params.append('department', filter.department);
      if (filter.status) params.append('status', filter.status);
      if (filter.position) params.append('position', filter.position);
    }
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE}/staff${queryString}`);
    const dbStaff = await handleResponse<DbStaff[]>(response);
    return dbStaff.map(transformDbToStaffMember);
  },

  async getById(id: string): Promise<StaffMember | null> {
    const response = await fetch(`${API_BASE}/staff?id=${id}`);
    const dbStaff = await handleResponse<DbStaff | null>(response);
    return dbStaff ? transformDbToStaffMember(dbStaff) : null;
  },

  async create(staffData: Partial<StaffMember>): Promise<StaffMember> {
    const dbData = transformStaffMemberToDb(staffData);
    const response = await fetch(`${API_BASE}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbData)
    });
    const dbStaff = await handleResponse<DbStaff>(response);
    return transformDbToStaffMember(dbStaff);
  },

  async update(id: string, updates: Partial<StaffMember>): Promise<StaffMember> {
    const dbUpdates = transformStaffMemberToDb(updates);
    const response = await fetch(`${API_BASE}/staff?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbUpdates)
    });
    const dbStaff = await handleResponse<DbStaff>(response);
    return transformDbToStaffMember(dbStaff);
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/staff?id=${id}`, {
      method: 'DELETE'
    });
    await handleResponse<{ success: boolean; message: string }>(response);
  },

  // Compatibility methods to match existing service interface
  async getActiveStaff(): Promise<StaffDropdownOption[]> {
    const staff = await this.getAll();
    return staff
      .filter(s => s.status === 'active')
      .map(s => ({
        id: s.id || '',
        name: s.name,
        email: s.email,
        position: s.position as string,
        department: s.department as any,
        status: s.status,
        currentProjectCount: s.currentProjectCount,
        maxProjectCount: s.maxProjectCount,
      }));
  },

  async getStaffByDepartment(department: string): Promise<StaffMember[]> {
    const staff = await this.getAll();
    return staff.filter(s => s.department === department);
  },

  async getStaffSummary(): Promise<StaffSummary> {
    const staff = await this.getAll();
    const departments = [...new Set(staff.map(s => s.department).filter(Boolean))] as string[];
    const activeSalaries = staff
      .filter(s => s.status === 'active' && s.salaryAmount)
      .map(s => s.salaryAmount || 0);

    // Group by department
    const staffByDepartment: Record<string, number> = {};
    staff.forEach(s => {
      const dept = (s.department as string) || 'Unknown';
      staffByDepartment[dept] = (staffByDepartment[dept] || 0) + 1;
    });

    // Group by level
    const staffByLevel: Record<string, number> = {};
    staff.forEach(s => {
      const level = (s.level as string) || 'Unknown';
      staffByLevel[level] = (staffByLevel[level] || 0) + 1;
    });

    // Group by contract type
    const staffByContractType: Record<string, number> = {};
    staff.forEach(s => {
      const type = (s.contractType as string) || 'permanent';
      staffByContractType[type] = (staffByContractType[type] || 0) + 1;
    });

    // Aggregate skills
    const skillCounts: Record<string, number> = {};
    staff.forEach(s => {
      (s.skills || []).forEach((skill: any) => {
        const skillName = typeof skill === 'string' ? skill : skill.name || 'Unknown';
        skillCounts[skillName] = (skillCounts[skillName] || 0) + 1;
      });
    });
    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    // Top performers (by rating)
    const topPerformers = staff
      .filter(s => s.averageProjectRating > 0)
      .sort((a, b) => b.averageProjectRating - a.averageProjectRating)
      .slice(0, 5)
      .map(s => ({
        id: s.id || '',
        name: s.name,
        rating: s.averageProjectRating,
        projectsCompleted: s.totalProjectsCompleted,
      }));

    const activeStaff = staff.filter(s => s.status === 'active');
    const availableStaff = activeStaff.filter(s => s.currentProjectCount < s.maxProjectCount);

    return {
      totalStaff: staff.length,
      activeStaff: activeStaff.length,
      inactiveStaff: staff.filter(s => s.status === 'inactive').length,
      onLeaveStaff: staff.filter(s => s.status === 'on_leave').length,
      availableStaff: availableStaff.length,
      monthlyGrowth: 0,
      averageProjectLoad: activeStaff.length > 0
        ? activeStaff.reduce((sum, s) => sum + s.currentProjectCount, 0) / activeStaff.length
        : 0,
      staffByDepartment,
      staffByLevel,
      staffBySkill: skillCounts,
      staffByContractType,
      // Note: averageSalary is computed but not in StaffSummary type - omitted
      averageExperience: staff.length > 0
        ? staff.reduce((sum, s) => sum + (s.experienceYears || 0), 0) / staff.length
        : 0,
      utilizationRate: activeStaff.length > 0
        ? (activeStaff.filter(s => s.currentProjectCount > 0).length / activeStaff.length) * 100
        : 0,
      overallocatedStaff: staff.filter(s => s.currentProjectCount > s.maxProjectCount).length,
      underutilizedStaff: activeStaff.filter(s => s.currentProjectCount === 0).length,
      topPerformers,
      topSkills,
    };
  }
};