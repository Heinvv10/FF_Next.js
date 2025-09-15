'use client';

import type { NextPage } from 'next';
import { StaffForm } from '../../../src/modules/staff/components/StaffForm';

const StaffEditPage: NextPage = () => {
  return (
    <div className="p-6">
      <StaffForm isEditMode />
    </div>
  );
};

export default StaffEditPage;