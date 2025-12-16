/**
 * FibreFlow Dashboard Page
 *
 * Real-time monitoring for the FibreFlow Proactive AI System (Jules Level 4)
 */

import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import FibreFlowDashboard from '../src/components/FibreFlowDashboard';

const FibreFlowPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>FibreFlow Dashboard | Proactive AI System</title>
        <meta name="description" content="Real-time monitoring for FibreFlow Proactive AI System - Jules Level 4" />
      </Head>
      <FibreFlowDashboard />
    </>
  );
};

export default FibreFlowPage;
