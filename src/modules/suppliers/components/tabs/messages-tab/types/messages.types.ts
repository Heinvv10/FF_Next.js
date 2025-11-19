// ============= Message Types =============
// Type definitions for messaging system

export type MessageRole = 'supplier' | 'internal';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'replied';
export type MessagePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MessageCategory = 'general' | 'rfq' | 'contract' | 'quality' | 'delivery' | 'payment' | 'compliance';

export interface MessageParticipant {
  id: string;
  name: string;
  role: MessageRole;
  avatar?: string;
}

export interface Message {
  id: string;
  threadId: string;
  subject: string;
  content: string;
  sender: MessageParticipant;
  recipient: Omit<MessageParticipant, 'avatar'>;
  timestamp: string;
  status: MessageStatus;
  priority: MessagePriority;
  category: MessageCategory;
  attachments: number;
  isRead: boolean;
  isStarred: boolean;
  supplierId: string;
  supplierName: string;
}

export interface MessageThread {
  id: string;
  subject: string;
  participants: MessageParticipant[];
  lastMessage: Message;
  messageCount: number;
  unreadCount: number;
  isArchived: boolean;
  supplierId: string;
  supplierName: string;
}
