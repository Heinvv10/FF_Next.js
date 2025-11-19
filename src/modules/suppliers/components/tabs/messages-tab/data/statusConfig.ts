// ============= Message Status Configuration =============
// Status icon and color configuration

import { Clock, CheckCircle, Reply, type LucideIcon } from 'lucide-react';

export interface StatusConfig {
  label: string;
  icon: LucideIcon;
  color: string;
}

type MessageStatusKey = 'sent' | 'delivered' | 'read' | 'replied';

export const statusConfig: Record<MessageStatusKey, StatusConfig> = {
  sent: { label: 'Sent', icon: Clock, color: 'text-blue-600' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-green-600' },
  read: { label: 'Read', icon: CheckCircle, color: 'text-green-600' },
  replied: { label: 'Replied', icon: Reply, color: 'text-purple-600' }
};
