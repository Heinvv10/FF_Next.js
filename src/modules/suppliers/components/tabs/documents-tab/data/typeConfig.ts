// ============= Document Type Configuration =============
// Document type configuration for categorization

import {
  FileText,
  Award,
  Shield,
  type LucideIcon
} from 'lucide-react';

export interface DocumentTypeConfig {
  label: string;
  icon: LucideIcon;
  color: string;
}

type DocumentTypeKey = 'contract' | 'certificate' | 'compliance' | 'insurance' | 'financial' | 'quality' | 'safety';

export const typeConfig: Record<DocumentTypeKey, DocumentTypeConfig> = {
  contract: { label: 'Contract', icon: FileText, color: 'bg-blue-100 text-blue-800' },
  certificate: { label: 'Certificate', icon: Award, color: 'bg-green-100 text-green-800' },
  compliance: { label: 'Compliance', icon: Shield, color: 'bg-purple-100 text-purple-800' },
  insurance: { label: 'Insurance', icon: Shield, color: 'bg-indigo-100 text-indigo-800' },
  financial: { label: 'Financial', icon: FileText, color: 'bg-yellow-100 text-yellow-800' },
  quality: { label: 'Quality', icon: Award, color: 'bg-green-100 text-green-800' },
  safety: { label: 'Safety', icon: Shield, color: 'bg-red-100 text-red-800' }
};
