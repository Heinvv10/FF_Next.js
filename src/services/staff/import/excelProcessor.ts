/**
 * Excel Processor
 * Handles Excel file parsing and export operations
 */

import * as XLSX from 'xlsx';
import { StaffImportRow, StaffImportResult, StaffMember } from '@/types/staff.types';
import { processImportRows } from './rowProcessor';
import { safeToDate } from '@/utils/dateHelpers';

/**
 * Import staff from Excel file
 */
export async function importFromExcel(file: File, overwriteExisting: boolean = true): Promise<StaffImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          reject(new Error('Excel file has no sheets'));
          return;
        }
        const worksheet = workbook.Sheets[firstSheetName];
        if (!worksheet) {
          reject(new Error('Could not read worksheet'));
          return;
        }

        // Convert to JSON - use type assertion to handle xlsx type issues
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          raw: false,
          dateNF: 'yyyy/mm/dd'
        });
        
        // Map Excel columns to staff fields
        const rows: StaffImportRow[] = jsonData.map((row: any) => ({
          employeeId: row['Employee ID'] || row['employee id'] || '',
          name: row['Name'] || row['name'] || '',
          email: row['Email'] || row['email'] || '',
          phone: row['Phone'] || row['phone'] || '',
          position: row['Position'] || row['position'] || 'Staff',
          department: row['Department'] || row['department'] || row['Primary Group'] || 'Operations',
          managerName: row['Reports To'] || row['reports to'] || '',
          skills: row['Skills'] || row['skills'] || '',
          alternativePhone: row['Alternative Phone'] || row['alternative phone'] || '',
          address: row['Address'] || row['address'] || '',
          city: row['City'] || row['city'] || '',
          province: row['Province'] || row['province'] || '',
          postalCode: row['Postal Code'] || row['postal code'] || '',
          emergencyContactName: row['Emergency Contact Name'] || '',
          emergencyContactPhone: row['Emergency Contact Phone'] || '',
          startDate: row['Start Date'] || row['start date'] || '',
          contractType: row['Contract Type'] || '',
          workingHours: row['Working Hours'] || ''
        }));
        
        const result = await processImportRows(rows, overwriteExisting);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read Excel file'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Export staff to Excel file
 */
export function exportToExcel(staff: StaffMember[]): void {
  // Define columns for export (not currently used)
  // const columns = [
  //   { header: 'Employee ID', key: 'employeeId', width: 15 },
  //   { header: 'Name', key: 'name', width: 20 },
  //   { header: 'Email', key: 'email', width: 25 },
  //   { header: 'Phone', key: 'phone', width: 15 },
  //   { header: 'Position', key: 'position', width: 20 },
  //   { header: 'Department', key: 'department', width: 20 },
  //   { header: 'Status', key: 'status', width: 10 },
  //   { header: 'Start Date', key: 'joinDate', width: 15 },
  //   { header: 'Manager', key: 'managerName', width: 20 },
  //   { header: 'Alternative Phone', key: 'alternativePhone', width: 15 },
  //   { header: 'Contract Type', key: 'contractType', width: 15 },
  // ];
  
  // Prepare data for export
  const exportData = staff.map(member => ({
    'Employee ID': member.employeeId || '',
    'Name': member.name,
    'Email': member.email,
    'Phone': member.phone,
    'Position': member.position || '',
    'Department': member.department || '',
    'Status': member.status,
    'Start Date': member.startDate ? safeToDate(member.startDate).toLocaleDateString() : '',
    'Manager': member.managerName || '',
    'Alternative Phone': member.alternativePhone || '',
    'Contract Type': member.contractType || ''
  }));
  
  // Create workbook and worksheet
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Staff');
  
  // Generate filename with current date
  const fileName = `staff_export_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  // Save the file
  XLSX.writeFile(wb, fileName);
}