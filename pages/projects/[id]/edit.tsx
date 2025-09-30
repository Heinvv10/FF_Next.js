import { GetServerSideProps } from 'next';
import { getAuth } from '../../../lib/auth-mock';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, X } from 'lucide-react';
import type { FormData } from '@/modules/projects/components/ProjectWizard/types';
import { Priority } from '@/types/project.types';
import { useActiveClients } from '@/hooks/useClients';
import { useProjectManagers } from '@/hooks/useStaff';

export default function EditProjectPage() {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      priority: Priority.MEDIUM,
    }
  });

  // Fetch clients and project managers
  const { data: clients = [], isLoading: isClientsLoading } = useActiveClients();
  const { data: projectManagers = [], isLoading: isProjectManagersLoading } = useProjectManagers();

  useEffect(() => {
    if (id) {
      fetch(`/api/projects/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success || data.data) {
            const projectData = data.data || data;
            setProject(projectData);

            // Populate form with existing data
            form.reset({
              name: projectData.name || projectData.project_name || '',
              clientId: projectData.client_id || projectData.clientId || '',
              description: projectData.description || '',
              notes: projectData.description || '',
              projectManagerId: projectData.project_manager || projectData.projectManagerId || '',
              location: projectData.location || '',
              startDate: projectData.start_date ? new Date(projectData.start_date).toISOString().split('T')[0] : '',
              durationMonths: projectData.duration_months || 12,
              status: projectData.status || 'planning',
              priority: projectData.priority || Priority.MEDIUM,
              budget: {
                totalBudget: projectData.budget || 0
              }
            });
          } else {
            console.error('Failed to fetch project:', data.error);
          }
        })
        .catch(err => {
          console.error('Error fetching project:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, form]);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      const projectData = {
        name: formData.name,
        projectName: formData.name,
        projectCode: project?.project_code || `PRJ-${Date.now()}`,
        clientId: formData.clientId,
        description: formData.description || formData.notes || '',
        projectType: project?.project_type || 'installation',
        status: formData.status || 'planning',
        priority: formData.priority,
        startDate: formData.startDate,
        endDate: formData.endDate || formData.startDate,
        budget: formData.budget?.totalBudget || 0,
        projectManager: formData.projectManagerId,
        location: formData.location || null
      };

      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      const data = await response.json();

      if (data.success || data.data) {
        router.push('/projects');
      } else {
        console.error('Failed to update project:', data.error);
        alert(`Failed to update project: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert(`Error updating project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/projects');
  };

  if (loading || !id) return <div>Loading...</div>;

  const selectedClient = clients?.find((c: any) => c.id === form.watch('clientId'));
  const selectedProjectManager = projectManagers?.find((pm: any) => pm.id === form.watch('projectManagerId'));

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
        <p className="text-gray-600">Update project information and settings</p>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="bg-white shadow-lg rounded-lg p-6 space-y-6">
        {/* Basic Information Section */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                {...form.register('name', { required: true })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter project name"
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">Project name is required</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client *
              </label>
              <select
                {...form.register('clientId', { required: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isClientsLoading}
              >
                <option value="">Select a client</option>
                {clients?.map((client: any) => (
                  <option key={client.id} value={client.id}>
                    {client.company_name || client.companyName}
                  </option>
                ))}
              </select>
              {form.formState.errors.clientId && (
                <p className="text-red-500 text-sm mt-1">Client is required</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...form.register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Project description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                {...form.register('location')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Project location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Manager *
              </label>
              <select
                {...form.register('projectManagerId', { required: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProjectManagersLoading}
              >
                <option value="">Select a project manager</option>
                {projectManagers?.map((pm: any) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.projectManagerId && (
                <p className="text-red-500 text-sm mt-1">Project manager is required</p>
              )}
            </div>
          </div>
        </div>

        {/* Project Details Section */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Project Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                {...form.register('status', { required: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority *
              </label>
              <select
                {...form.register('priority', { required: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={Priority.LOW}>Low</option>
                <option value={Priority.MEDIUM}>Medium</option>
                <option value={Priority.HIGH}>High</option>
                <option value={Priority.CRITICAL}>Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget
              </label>
              <input
                {...form.register('budget.totalBudget', { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                {...form.register('startDate', { required: true })}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (Months)
              </label>
              <input
                {...form.register('durationMonths', { valueAsNumber: true, min: 1 })}
                type="number"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="12"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { userId } = getAuth(ctx.req);

  if (!userId) {
    return {
      redirect: {
        destination: '/sign-in',
        permanent: false,
      },
    };
  }

  return { props: {} };
};