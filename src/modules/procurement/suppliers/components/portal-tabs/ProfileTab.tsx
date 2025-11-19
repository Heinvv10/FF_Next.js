import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { VelocityButton } from '@/components/ui/VelocityButton';
import type { Supplier } from '@/types/supplier/base.types';

export interface ProfileTabProps {
  supplier: Supplier | null;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ supplier }) => {
  const [editing, setEditing] = useState(false);
  const [profileData] = useState(supplier);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Company Profile</h2>
        <VelocityButton
          onClick={() => setEditing(!editing)}
          variant={editing ? 'outline' : 'solid'}
        >
          {editing ? 'Cancel' : 'Edit Profile'}
        </VelocityButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input
                type="text"
                value={profileData?.name || ''}
                readOnly={!editing}
                className={`mt-1 block w-full px-3 py-2 border rounded-lg ${
                  editing ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-200 bg-gray-50'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Registration Number</label>
              <input
                type="text"
                value={profileData?.code || ''}
                readOnly={!editing}
                className={`mt-1 block w-full px-3 py-2 border rounded-lg ${
                  editing ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-200 bg-gray-50'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Business Type</label>
              <select
                value={profileData?.businessType || ''}
                disabled={!editing}
                className={`mt-1 block w-full px-3 py-2 border rounded-lg ${
                  editing ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <option value="manufacturer">Manufacturer</option>
                <option value="distributor">Distributor</option>
                <option value="service_provider">Service Provider</option>
                <option value="contractor">Contractor</option>
              </select>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Primary Contact</label>
              <input
                type="text"
                value={profileData?.primaryContact?.name || ''}
                readOnly={!editing}
                className={`mt-1 block w-full px-3 py-2 border rounded-lg ${
                  editing ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-200 bg-gray-50'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={profileData?.primaryContact?.email || ''}
                readOnly={!editing}
                className={`mt-1 block w-full px-3 py-2 border rounded-lg ${
                  editing ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-200 bg-gray-50'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={profileData?.primaryContact?.phone || ''}
                readOnly={!editing}
                className={`mt-1 block w-full px-3 py-2 border rounded-lg ${
                  editing ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-200 bg-gray-50'
                }`}
              />
            </div>
          </div>
        </GlassCard>
      </div>

      {editing && (
        <div className="flex justify-end space-x-3">
          <VelocityButton variant="outline" onClick={() => setEditing(false)}>
            Cancel
          </VelocityButton>
          <VelocityButton onClick={() => setEditing(false)}>
            Save Changes
          </VelocityButton>
        </div>
      )}
    </div>
  );
};
