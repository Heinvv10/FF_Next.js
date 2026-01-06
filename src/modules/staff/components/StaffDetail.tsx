'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Edit, Mail, Phone, Calendar, Briefcase, Award, FileText, FolderKanban, User } from 'lucide-react';
import { useStaffMember, useDeleteStaff } from '@/hooks/useStaff';
import { format } from 'date-fns';
import { safeToDate } from '@/utils/dateHelpers';
import { log } from '@/lib/logger';
import { StaffDocumentList } from '@/components/staff/StaffDocumentList';
import { StaffProjectAssignment } from '@/components/staff/StaffProjectAssignment';

type TabType = 'overview' | 'documents' | 'projects';

export function StaffDetail() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { data: staff, isLoading, error } = useStaffMember(id || '');
  const deleteMutation = useDeleteStaff();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    
    try {
      await deleteMutation.mutateAsync(id!);
      router.push('/app/staff');
    } catch (error) {
      alert('Failed to delete staff member');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Staff member not found</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.push('/app/staff')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Staff List
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-medium text-blue-600">
                  {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{staff.name}</h1>
                <p className="text-sm text-gray-500">{staff.employeeId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/app/staff/${id}/edit`)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-4 text-sm font-medium border-b-2 flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="h-4 w-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-3 px-4 text-sm font-medium border-b-2 flex items-center gap-2 ${
                activeTab === 'documents'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="h-4 w-4" />
              Documents
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`py-3 px-4 text-sm font-medium border-b-2 flex items-center gap-2 ${
                activeTab === 'projects'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FolderKanban className="h-4 w-4" />
              Projects
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <StaffDocumentList staffId={id} />
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <StaffProjectAssignment staffId={id} staffName={staff.name} />
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
          {/* Status Badge */}
          <div>
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(staff.status)}`}>
              {staff.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
            </span>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a href={`mailto:${staff.email}`} className="text-blue-600 hover:text-blue-800">
                    {staff.email}
                  </a>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <a href={`tel:${staff.phone}`} className="text-blue-600 hover:text-blue-800">
                    {staff.phone}
                  </a>
                </div>
              </div>

              {staff.alternativePhone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Alternative Phone</p>
                    <a href={`tel:${staff.alternativePhone}`} className="text-blue-600 hover:text-blue-800">
                      {staff.alternativePhone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Job Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Job Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Position</p>
                  <p className="font-medium">{staff.position}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium">
                  {staff.department?.replace('_', ' ').charAt(0).toUpperCase() + (staff.department?.slice(1) || '') || 'Not specified'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Level</p>
                <p className="font-medium">
                  {staff.level ? staff.level.replace('_', ' ').charAt(0).toUpperCase() + staff.level.slice(1) : 'Not specified'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Contract Type</p>
                <p className="font-medium">
                  {staff.contractType?.replace('_', ' ').charAt(0).toUpperCase() + (staff.contractType?.slice(1) || '') || 'Not specified'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium">
                    {(() => {
                      const startDate = staff.startDate;
                      if (startDate) {
                        try {
                          const date = safeToDate(startDate);
                          return format(date, 'dd MMM yyyy');
                        } catch (error) {
                          log.warn('Error formatting start date:', { data: error }, 'StaffDetail');
                          return 'Invalid Date';
                        }
                      }
                      return 'N/A';
                    })()}
                  </p>
                </div>
              </div>

              {staff.endDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">End Date</p>
                    <p className="font-medium">
                      {(() => {
                        const endDate = staff.endDate;
                        if (endDate) {
                          try {
                            const date = safeToDate(endDate);
                            return format(date, 'dd MMM yyyy');
                          } catch (error) {
                            log.warn('Error formatting end date:', { data: error }, 'StaffDetail');
                            return 'Invalid Date';
                          }
                        }
                        return 'N/A';
                      })()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Skills */}
          {staff.skills && Array.isArray(staff.skills) && staff.skills.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {staff.skills.map((skill: string) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full"
                  >
                    <Award className="w-3 h-3 mr-1" />
                    {skill?.replace(/_/g, ' ').charAt(0).toUpperCase() + (skill?.slice(1) || '') || skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Project Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Project Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Current Projects</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {staff.currentProjectCount || 0} / {staff.maxProjectCount || 5}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${((staff.currentProjectCount || 0) / (staff.maxProjectCount || 5)) * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Completed Projects</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {staff.totalProjectsCompleted || 0}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Average Rating</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {(staff.averageProjectRating || 0).toFixed(1)} / 5.0
                </p>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          {(staff.emergencyContactName || staff.emergencyContactPhone) && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h2>
              <div className="bg-red-50 rounded-lg p-4">
                {staff.emergencyContactName && (
                  <p className="font-medium text-gray-900">{staff.emergencyContactName}</p>
                )}
                {staff.emergencyContactPhone && (
                  <p className="text-sm text-gray-600">{staff.emergencyContactPhone}</p>
                )}
              </div>
            </div>
          )}

          {/* Address */}
          {staff.address && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Address</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p>{staff.address}</p>
                <p>{staff.city}, {staff.province} {staff.postalCode}</p>
              </div>
            </div>
          )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}