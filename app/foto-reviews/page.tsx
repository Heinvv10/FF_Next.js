// Foto Reviews Dashboard Page
// Human-in-the-Loop review system for AI-generated feedback

import React from 'react';
import { FotoReviewsDashboard } from '@/modules/foto-reviews/components';

export const metadata = {
  title: 'Foto Reviews | FibreFlow',
  description: 'Review AI-generated feedback before sending to WhatsApp',
};

export default function FotoReviewsPage() {
  return <FotoReviewsDashboard />;
}
