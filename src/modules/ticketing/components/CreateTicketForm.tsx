// src/modules/ticketing/components/CreateTicketForm.tsx
// Form for creating new tickets with billing calculation
'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import type { CreateTicketInput, BillableCalculation } from '../types';

interface Project {
  id: string;
  name: string;
}

export function CreateTicketForm() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [billingCalc, setBillingCalc] = useState<BillableCalculation | null>(null);
  const [drLookupResult, setDrLookupResult] = useState<any>(null);

  const [formData, setFormData] = useState<CreateTicketInput>({
    project_id: '',
    title: '',
    description: '',
    priority: 'medium',
    source: 'internal',
    dr_number: '',
    ticket_type: 'incident',
    category: '',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  // Auto-calculate billing when form changes
  useEffect(() => {
    if (formData.project_id && formData.ticket_type && formData.priority) {
      calculateBilling();
    }
  }, [formData.project_id, formData.ticket_type, formData.priority, formData.dr_number]);

  // Auto-lookup DR number when entered
  useEffect(() => {
    if (formData.dr_number && formData.dr_number.length >= 4) {
      lookupDR();
    }
  }, [formData.dr_number]);

  async function loadProjects() {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data.data || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }

  async function calculateBilling() {
    try {
      const res = await fetch('/api/ticketing/billing-calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: formData.project_id,
          ticket_type: formData.ticket_type,
          priority: formData.priority,
          dr_number: formData.dr_number || undefined,
        }),
      });

      const data = await res.json();
      setBillingCalc(data.data);
    } catch (error) {
      console.error('Failed to calculate billing:', error);
    }
  }

  async function lookupDR() {
    try {
      const res = await fetch(`/api/ticketing/dr-lookup?dr_number=${formData.dr_number}`);
      const data = await res.json();
      setDrLookupResult(data.data);

      // Auto-populate project if DR is found
      if (data.data.exists && data.data.project_id && !formData.project_id) {
        setFormData((prev) => ({ ...prev, project_id: data.data.project_id }));
      }
    } catch (error) {
      console.error('Failed to lookup DR:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.title || !formData.project_id) {
      alert('Please fill in required fields');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch('/api/ticketing/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        alert('Ticket created successfully!');
        window.location.href = `/ticketing/${data.data.id}`;
      } else {
        alert(`Failed to create ticket: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to create ticket:', error);
      alert('An error occurred while creating the ticket');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field: keyof CreateTicketInput, value: any) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Ticket</h2>

        {/* Project Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.project_id}
            onChange={(e) => handleChange('project_id', e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* DR Number */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Drop Reference (DR) Number
          </label>
          <input
            type="text"
            value={formData.dr_number}
            onChange={(e) => handleChange('dr_number', e.target.value.toUpperCase())}
            placeholder="e.g., DR001234"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {drLookupResult && (
            <div className="mt-2">
              {drLookupResult.exists ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm font-semibold text-green-800">
                    ✓ DR found: {drLookupResult.address}
                  </p>
                  {drLookupResult.is_guaranteed && (
                    <p className="text-xs text-green-600 mt-1">
                      🎉 Covered under project guarantee (free service)
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-orange-600">
                  ⚠️ DR not found in system. Ticket can still be created.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            required
            placeholder="Brief description of the issue"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={5}
            placeholder="Detailed description of the issue..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Ticket Type & Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ticket Type
            </label>
            <select
              value={formData.ticket_type}
              onChange={(e) => handleChange('ticket_type', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="incident">Incident</option>
              <option value="request">Request</option>
              <option value="change">Change</option>
              <option value="problem">Problem</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              placeholder="e.g., Network, Hardware, Software"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Priority & Source */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source
            </label>
            <select
              value={formData.source}
              onChange={(e) => handleChange('source', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="internal">Internal</option>
              <option value="qcontact">QContact</option>
              <option value="whatsapp_inbound">WhatsApp Inbound</option>
              <option value="email">Email</option>
              <option value="construction">Construction</option>
              <option value="whatsapp_outbound">WhatsApp Outbound</option>
              <option value="adhoc">Ad-hoc</option>
            </select>
          </div>
        </div>

        {/* Billing Calculation Display */}
        {billingCalc && (
          <div className="mb-4">
            <div className={`p-4 rounded-lg border ${
              billingCalc.billing_type === 'guarantee'
                ? 'bg-green-50 border-green-200'
                : billingCalc.billing_type === 'sla'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-orange-50 border-orange-200'
            }`}>
              <h3 className="text-sm font-semibold mb-2">
                Billing Type: {billingCalc.billing_type.toUpperCase()}
              </h3>
              <p className="text-sm text-gray-700 mb-2">{billingCalc.reason}</p>
              {billingCalc.estimated_cost !== null && (
                <p className="text-lg font-bold">
                  Estimated Cost: R{billingCalc.estimated_cost.toFixed(2)}
                </p>
              )}
              {billingCalc.requires_approval && (
                <p className="text-sm text-orange-700 mt-2">
                  ⚠️ This ticket requires billing approval before work can begin
                </p>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => (window.location.href = '/ticketing')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Creating...' : 'Create Ticket'}
          </button>
        </div>
      </div>
    </form>
  );
}
