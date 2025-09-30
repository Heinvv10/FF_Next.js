/**
 * DocumentManagement Component - Contractor document management system
 * Following FibreFlow patterns and keeping under 250 lines
 */

import { useState, useEffect } from 'react';
import { Upload, File, CheckCircle, AlertTriangle, X, Eye, Download, Plus } from 'lucide-react';
import { contractorClientService } from '@/services/contractor/contractorClientService';
import { ContractorDocument, DocumentType } from '@/types/contractor.types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { log } from '@/lib/logger';

interface DocumentManagementProps {
  contractorId: string;
  contractorName: string;
}

export function DocumentManagement({ contractorId, contractorName }: DocumentManagementProps) {
  const [documents, setDocuments] = useState<ContractorDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [contractorId]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await contractorService.documents.getByContractor(contractorId);
      setDocuments(docs);
    } catch (error) {
      log.error('Failed to load documents:', { data: error }, 'DocumentManagement');
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'rejected':
        return <X className="w-5 h-5 text-red-600" />;
      default:
        return <File className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocumentTypeLabel = (type: DocumentType) => {
    const labels: Record<DocumentType, string> = {
      // Company Registration & Legal
      cipc_registration: 'CIPC Registration',
      directors_ids: 'Directors IDs',
      
      // Tax & Revenue Compliance
      vat_certificate: 'VAT Certificate',
      tax_clearance: 'Tax Clearance Certificate',
      
      // B-BBEE & Transformation
      bee_certificate: 'BEE Certificate',
      
      // Banking & Financial Verification
      bank_account_proof: 'Bank Account Proof',
      bank_confirmation_letter: 'Bank Confirmation Letter',
      
      // Labour & Workers Compensation
      coid_registration: 'COID Registration',
      
      // Insurance Coverage
      public_liability_insurance: 'Public Liability Insurance',
      
      // Safety, Health, Environment & Quality
      sheq_documentation: 'SHEQ Documentation',
      
      // Technical Competency & Staffing
      key_staff_credentials: 'Key Staff Credentials',
      
      // Past Project Experience
      past_project_experience: 'Past Project Experience',
      
      // Legal Agreements & Contracts
      signed_msa: 'Signed MSA',
      ncnda: 'NCNDA',
      
      // Legacy document types (for backward compatibility)
      company_registration: 'Company Registration',
      bank_statement: 'Bank Statement',
      insurance: 'Insurance Certificate',
      safety_certificate: 'Safety Certificate',
      technical_certification: 'Technical Certification',
      financial_statement: 'Financial Statement',
      reference_letter: 'Reference Letter',
      id_document: 'ID Document',
      other: 'Other Document'
    };
    return labels[type] || type.replace('_', ' ');
  };

  const isDocumentExpiring = (document: ContractorDocument): boolean => {
    if (!document.expiryDate) return false;
    const expiryDate = new Date(document.expiryDate);
    const today = new Date();
    const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysToExpiry <= 30;
  };

  const getExpiryStatus = (document: ContractorDocument) => {
    if (!document.expiryDate) return null;
    
    const expiryDate = new Date(document.expiryDate);
    const today = new Date();
    const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysToExpiry < 0) {
      return { status: 'expired', text: 'Expired', color: 'text-red-600' };
    } else if (daysToExpiry <= 30) {
      return { status: 'expiring', text: `${daysToExpiry} days`, color: 'text-yellow-600' };
    } else {
      return { status: 'valid', text: expiryDate.toLocaleDateString(), color: 'text-gray-600' };
    }
  };

  const requiredDocuments: DocumentType[] = [
    'company_registration',
    'tax_clearance',
    'bank_statement',
    'insurance',
    'safety_certificate'
  ];

  const getMissingDocuments = () => {
    return requiredDocuments.filter(reqDoc => 
      !documents.some(doc => doc.documentType === reqDoc && doc.verificationStatus !== 'rejected')
    );
  };

  const expiringDocuments = documents.filter(isDocumentExpiring);
  const missingDocuments = getMissingDocuments();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" label="Loading documents..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Document Management</h2>
          <p className="text-gray-600">Manage documents for {contractorName}</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Document
        </button>
      </div>

      {/* Alerts */}
      {(expiringDocuments.length > 0 || missingDocuments.length > 0) && (
        <div className="space-y-3">
          {missingDocuments.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Missing Required Documents</span>
              </div>
              <ul className="text-red-700 text-sm space-y-1">
                {missingDocuments.map(docType => (
                  <li key={docType}>• {getDocumentTypeLabel(docType)}</li>
                ))}
              </ul>
            </div>
          )}

          {expiringDocuments.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Documents Expiring Soon</span>
              </div>
              <ul className="text-yellow-700 text-sm space-y-1">
                {expiringDocuments.map(doc => (
                  <li key={doc.id}>• {getDocumentTypeLabel(doc.documentType)} - {getExpiryStatus(doc)?.text}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Documents ({documents.length})
          </h3>
        </div>

        {documents.length === 0 ? (
          <div className="p-12 text-center">
            <File className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No documents uploaded yet</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Upload your first document
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {documents.map((document) => {
              const expiryStatus = getExpiryStatus(document);
              return (
                <div key={document.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <File className="w-8 h-8 text-gray-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {getDocumentTypeLabel(document.documentType)}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Uploaded: {new Date(document.createdAt).toLocaleDateString()}</span>
                          {expiryStatus && (
                            <span className={expiryStatus.color}>
                              Expires: {expiryStatus.text}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(document.verificationStatus)}`}>
                        {getStatusIcon(document.verificationStatus)}
                        <span className="ml-1">{document.verificationStatus.toUpperCase()}</span>
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="View document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Download document"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {document.rejectionReason && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-700">
                        <strong>Rejection Reason:</strong> {document.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Upload Document</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Document upload functionality will be implemented here</p>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}