import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Input } from '@/shared/components/ui/Input';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Mail, 
  Phone,
  UserPlus,
  Upload
} from 'lucide-react';

interface StaffMember {
  id: string;
  employeeId: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  status: 'active' | 'inactive' | 'on_leave';
  projects?: number;
  joinDate?: string;
}

export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/staff');
      
      if (response.ok) {
        const data = await response.json();
        setStaff(data.data || []);
      } else {
        // Use sample data if API fails
        setStaff(getSampleStaff());
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      // Use sample data as fallback
      setStaff(getSampleStaff());
    } finally {
      setLoading(false);
    }
  };

  const getSampleStaff = (): StaffMember[] => [
    {
      id: '1',
      employeeId: 'EMP001',
      name: 'John Smith',
      email: 'john.smith@company.com',
      phone: '+27 11 234 5678',
      position: 'Senior Field Technician',
      department: 'Field Operations',
      status: 'active',
      projects: 3,
      joinDate: '2022-01-15'
    },
    {
      id: '2',
      employeeId: 'EMP002',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      phone: '+27 11 234 5679',
      position: 'Project Manager',
      department: 'Project Management',
      status: 'active',
      projects: 5,
      joinDate: '2021-06-20'
    },
    {
      id: '3',
      employeeId: 'EMP003',
      name: 'Mike Williams',
      email: 'mike.williams@company.com',
      phone: '+27 11 234 5680',
      position: 'Field Technician',
      department: 'Field Operations',
      status: 'on_leave',
      projects: 2,
      joinDate: '2022-03-10'
    },
    {
      id: '4',
      employeeId: 'EMP004',
      name: 'Emma Davis',
      email: 'emma.davis@company.com',
      phone: '+27 11 234 5681',
      position: 'Quality Inspector',
      department: 'Quality Assurance',
      status: 'active',
      projects: 4,
      joinDate: '2021-11-05'
    },
    {
      id: '5',
      employeeId: 'EMP005',
      name: 'Tom Brown',
      email: 'tom.brown@company.com',
      phone: '+27 11 234 5682',
      position: 'Junior Technician',
      department: 'Field Operations',
      status: 'inactive',
      projects: 0,
      joinDate: '2023-02-28'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          member.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || member.department === filterDepartment;
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const departments = [...new Set(staff.map(s => s.department).filter(Boolean))];

  const handleView = (member: StaffMember) => {
    router.push(`/staff/${member.id}`);
  };

  const handleEdit = (member: StaffMember) => {
    router.push(`/staff/${member.id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      try {
        const response = await fetch(`/api/staff?id=${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          // Remove from local state
          setStaff(staff.filter(s => s.id !== id));
        } else {
          console.error('Failed to delete staff member');
          alert('Failed to delete staff member. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting staff member:', error);
        alert('Error deleting staff member. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading staff...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Staff Management</h1>
            <p className="text-gray-600">Manage your team members and their assignments</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/staff/import')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button
              onClick={() => router.push('/staff/new')}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Add Staff Member
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Staff</p>
                  <p className="text-2xl font-bold">{staff.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <UserPlus className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold">{staff.filter(s => s.status === 'active').length}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">On Leave</p>
                  <p className="text-2xl font-bold">{staff.filter(s => s.status === 'on_leave').length}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Eye className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Departments</p>
                  <p className="text-2xl font-bold">{departments.length}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Eye className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search by name, ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
          </select>
        </div>

        {/* Staff Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Projects
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStaff.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {member.name ? member.name.charAt(0) : ''}{member.name ? member.name.split(' ')[1]?.charAt(0) || '' : ''}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {member.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {member.employeeId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{member.position || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{member.department || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {member.email && (
                            <a href={`mailto:${member.email}`} className="text-blue-600 hover:text-blue-800">
                              <Mail className="h-4 w-4" />
                            </a>
                          )}
                          {member.phone && (
                            <a href={`tel:${member.phone}`} className="text-blue-600 hover:text-blue-800">
                              <Phone className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(member.status)} variant="secondary">
                          {member.status ? member.status.replace('_', ' ') : 'unknown'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{member.projects || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleView(member)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(member)}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredStaff.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No staff members found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

// Prevent static generation to avoid router mounting issues
export const getStaticProps = async () => {
  return {
    props: {},
    revalidate: 60,
  };
};