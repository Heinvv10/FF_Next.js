'use client';

import type { NextPage } from 'next';
import { StaffForm } from '../../../src/modules/staff/components/StaffForm';

/**
 * Staff Edit Page
 * StaffForm automatically detects edit mode from URL params (router.query.id)
 */
const StaffEditPage: NextPage = () => {
  return (
    <div className="p-6">
      <StaffForm />
    </div>
  );
};

export default StaffEditPage;