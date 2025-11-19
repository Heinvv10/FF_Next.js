// ============= Mock Message Data =============
// Sample message data for development/testing

import type { Message } from '../types/messages.types';

export const mockMessages: Message[] = [
  {
    id: 'msg-001',
    threadId: 'thread-001',
    subject: 'RFQ Response - Network Security Equipment',
    content: 'Thank you for the RFQ opportunity. We have reviewed the requirements and are pleased to submit our comprehensive proposal. Our solution includes enterprise-grade firewalls with advanced threat protection capabilities.',
    sender: {
      id: 'contact-001',
      name: 'Sarah Johnson',
      role: 'supplier'
    },
    recipient: {
      id: 'user-001',
      name: 'John Smith',
      role: 'internal'
    },
    timestamp: '2024-01-22T14:30:00Z',
    status: 'read',
    priority: 'high',
    category: 'rfq',
    attachments: 2,
    isRead: true,
    isStarred: true,
    supplierId: 'supplier-001',
    supplierName: 'TechFlow Solutions'
  },
  {
    id: 'msg-002',
    threadId: 'thread-002',
    subject: 'Delivery Schedule Update',
    content: 'We wanted to provide an update on the steel materials delivery. Due to improved production efficiency, we can deliver 2 days ahead of the original schedule.',
    sender: {
      id: 'contact-002',
      name: 'Michael Chen',
      role: 'supplier'
    },
    recipient: {
      id: 'user-002',
      name: 'Project Manager',
      role: 'internal'
    },
    timestamp: '2024-01-22T10:15:00Z',
    status: 'delivered',
    priority: 'medium',
    category: 'delivery',
    attachments: 0,
    isRead: false,
    isStarred: false,
    supplierId: 'supplier-002',
    supplierName: 'Global Materials Inc'
  },
  {
    id: 'msg-003',
    threadId: 'thread-003',
    subject: 'Contract Amendment Request',
    content: 'Following our recent discussion, we would like to propose amendments to the service level agreements to better align with current market conditions.',
    sender: {
      id: 'contact-003',
      name: 'Emma Thompson',
      role: 'supplier'
    },
    recipient: {
      id: 'user-003',
      name: 'Legal Team',
      role: 'internal'
    },
    timestamp: '2024-01-21T16:45:00Z',
    status: 'replied',
    priority: 'high',
    category: 'contract',
    attachments: 1,
    isRead: true,
    isStarred: false,
    supplierId: 'supplier-003',
    supplierName: 'Premium Services Ltd'
  }
];
