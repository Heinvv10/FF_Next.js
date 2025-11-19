// ============= Message Helper Functions =============
// Utility functions for message formatting and conversion

import type { Message, MessageThread } from '../types/messages.types';

export const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffHours = Math.abs(now.getTime() - date.getTime()) / 36e5;

  if (diffHours < 24) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const messagesToThreads = (messages: Message[]): MessageThread[] => {
  return messages.map(message => ({
    id: message.threadId,
    subject: message.subject,
    participants: [message.sender, message.recipient],
    lastMessage: message,
    messageCount: 1,
    unreadCount: message.isRead ? 0 : 1,
    isArchived: false,
    supplierId: message.supplierId,
    supplierName: message.supplierName
  }));
};
