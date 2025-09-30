/**
 * Contractor Edit Hook
 * Custom hook for contractor edit functionality
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { contractorClientService } from '@/services/contractor/contractorClientService';
import { ContractorFormData, Contractor } from '@/types/contractor.types';
import toast from 'react-hot-toast';
import { log } from '@/lib/logger';

export function useContractorEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ContractorFormData>({
    companyName: '',
    registrationNumber: '',
    businessType: 'pty_ltd',
    industryCategory: '',
    
    contactPerson: '',
    email: '',
    phone: '',
    alternatePhone: '',
    
    physicalAddress: '',
    postalAddress: '',
    city: '',
    province: '',
    postalCode: '',
    
    creditRating: '',
    paymentTerms: '',
    bankName: '',
    accountNumber: '',
    branchCode: '',
    
    status: 'pending',
    complianceStatus: 'pending',
    
    notes: '',
    tags: [],
  });

  useEffect(() => {
    const loadContractor = async () => {
      if (!id) {
        navigate('/app/contractors');
        return;
      }

      try {
        const contractorData = await contractorClientService.getById(id);
        if (!contractorData) {
          toast.error('Contractor not found');
          navigate('/app/contractors');
          return;
        }

        setContractor(contractorData);
        const updateData: ContractorFormData = {
          companyName: contractorData.companyName,
          registrationNumber: contractorData.registrationNumber,
          businessType: contractorData.businessType,
          industryCategory: contractorData.industryCategory,
          
          contactPerson: contractorData.contactPerson,
          email: contractorData.email,
          phone: contractorData.phone || '',
          alternatePhone: contractorData.alternatePhone || '',
          
          physicalAddress: contractorData.physicalAddress || '',
          postalAddress: contractorData.postalAddress || '',
          city: contractorData.city || '',
          province: contractorData.province || '',
          postalCode: contractorData.postalCode || '',
          
          creditRating: contractorData.creditRating || '',
          paymentTerms: contractorData.paymentTerms || '',
          bankName: contractorData.bankName || '',
          accountNumber: contractorData.accountNumber || '',
          branchCode: contractorData.branchCode || '',
          
          status: contractorData.status,
          complianceStatus: contractorData.complianceStatus,
          
          notes: contractorData.notes || '',
          tags: contractorData.tags || [],
        };
        
        // Add optional fields only if they exist
        if (contractorData.yearsInBusiness !== undefined) {
          updateData.yearsInBusiness = contractorData.yearsInBusiness;
        }
        if (contractorData.employeeCount !== undefined) {
          updateData.employeeCount = contractorData.employeeCount;
        }
        if (contractorData.annualTurnover !== undefined) {
          updateData.annualTurnover = contractorData.annualTurnover;
        }
        
        setFormData(updateData);
      } catch (error) {
        log.error('Failed to load contractor:', { data: error }, 'useContractorEdit');
        toast.error('Failed to load contractor data');
        navigate('/app/contractors');
      } finally {
        setIsLoading(false);
      }
    };

    loadContractor();
  }, [id, navigate]);

  const handleInputChange = (field: keyof ContractorFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleSubmit = async () => {
    if (!id) return;
    
    setIsSubmitting(true);
    
    try {
      await contractorClientService.update(id, formData);
      toast.success('Contractor updated successfully!');
      navigate('/app/contractors');
    } catch (error) {
      log.error('Failed to update contractor:', { data: error }, 'useContractorEdit');
      toast.error('Failed to update contractor. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    id,
    contractor,
    formData,
    isLoading,
    isSubmitting,
    handleInputChange,
    handleTagsChange,
    handleSubmit,
    navigate
  };
}