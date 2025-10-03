/**
 * Contractors Page - Main contractors portal page
 * Entry point for the contractors module
 */

import React from 'react';
import { GetServerSideProps } from 'next';
import { ContractorsDashboard } from '@/modules/contractors/ContractorsDashboard';
import { AppLayout } from '@/components/layout/AppLayout';
import { verifyAuth } from '@/lib/auth';
import { log } from '@/lib/logger';

interface ContractorsPageProps {
  user: any;
}

export default function ContractorsPage({ user }: ContractorsPageProps) {
  return (
    <AppLayout user={user}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Contractors Portal</h1>
          <p className="text-gray-600 mt-2">Manage contractor relationships, compliance, and performance</p>
        </div>

        <ContractorsDashboard />
      </div>
    </AppLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const auth = await verifyAuth(context);

    if (!auth.user) {
      return {
        redirect: {
          destination: '/sign-in',
          permanent: false,
        },
      };
    }

    return {
      props: {
        user: auth.user,
      },
    };
  } catch (error) {
    log.error('Error in contractors page getServerSideProps:', error);

    return {
      redirect: {
        destination: '/sign-in',
        permanent: false,
      },
    };
  }
};