import { useState, useEffect } from 'react';
import { SupplierCrudService } from '@/services/suppliers';
import type { Supplier } from '@/types/supplier/base.types';
import type { SupplierSession, SupplierStats, RFQInvitation } from '../types/portal.types';
import { log } from '@/lib/logger';

export const useSupplierAuth = () => {
  const [supplierSession, setSupplierSession] = useState<SupplierSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [stats, setStats] = useState<SupplierStats | null>(null);
  const [rfqInvitations, setRFQInvitations] = useState<RFQInvitation[]>([]);
  const [authEmail, setAuthEmail] = useState('');
  const [authStep, setAuthStep] = useState<'email' | 'verification'>('email');
  const [verificationCode, setVerificationCode] = useState('');

  // Initialize supplier session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Check for existing session or demo mode
        const mockSession: SupplierSession = {
          supplierId: 'supplier-001',
          supplierName: 'TechCorp Solutions',
          supplierEmail: 'contact@techcorp.com',
          authenticated: true
        };

        setSupplierSession(mockSession);

        // Load supplier data
        const supplierData = await SupplierCrudService.getById(mockSession.supplierId).catch(() => {
          // Return mock data if service call fails
          return {
            id: mockSession.supplierId,
            name: mockSession.supplierName,
            phone: '+27-11-555-0124',
            email: mockSession.supplierEmail,
            code: 'TECH001',
            status: 'active' as const,
            businessType: 'manufacturer' as const,
            categories: ['electronics', 'components'],
            rating: { overall: 4.2, totalReviews: 15 },
            primaryContact: {
              name: 'John Smith',
              email: mockSession.supplierEmail,
              phone: '+27-11-555-0123'
            },
            contact: {
              name: 'John Smith',
              email: mockSession.supplierEmail,
              phone: '+27-11-555-0123'
            },
            addresses: {
              physical: {
                street1: '123 Business Park',
                city: 'Johannesburg',
                state: 'Gauteng',
                postalCode: '2001',
                country: 'South Africa'
              }
            },
            createdBy: 'system',
            createdAt: '2024-01-01',
            isActive: true,
            isPreferred: true
          } as Supplier;
        });

        setSupplier(supplierData);

        // Load dashboard stats
        setStats({
          activeRFQs: 5,
          completedQuotes: 23,
          averageScore: 4.2,
          complianceStatus: 'compliant',
          documentsExpiring: 2,
          winRate: 68
        });

        // Load RFQ invitations
        setRFQInvitations([
          {
            id: 'rfq-001',
            rfqNumber: 'RFQ-2024-001',
            title: 'Fiber Optic Cables - Q1 2024',
            description: 'Supply of single-mode fiber optic cables for network expansion project',
            dueDate: '2024-09-15',
            status: 'pending',
            projectName: 'Network Expansion Phase 2',
            estimatedValue: 150000,
            urgency: 'high'
          },
          {
            id: 'rfq-002',
            rfqNumber: 'RFQ-2024-002',
            title: 'Network Equipment Maintenance',
            description: 'Annual maintenance contract for network infrastructure',
            dueDate: '2024-09-20',
            status: 'pending',
            projectName: 'Infrastructure Maintenance',
            estimatedValue: 85000,
            urgency: 'medium'
          }
        ]);

      } catch (error) {
        log.error('Failed to initialize supplier session:', { data: error }, 'useSupplierAuth');
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, []);

  const handleAuthentication = async (_email: string) => {
    setLoading(true);
    try {
      // In production, this would send a magic link to the supplier's email
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAuthStep('verification');
    } catch (error) {
      log.error('Authentication failed:', { data: error }, 'useSupplierAuth');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (_code: string) => {
    setLoading(true);
    try {
      // In production, this would verify the code and create a session
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSupplierSession({
        supplierId: 'verified-supplier',
        supplierName: 'Verified Supplier',
        supplierEmail: authEmail,
        authenticated: true
      });
    } catch (error) {
      log.error('Verification failed:', { data: error }, 'useSupplierAuth');
    } finally {
      setLoading(false);
    }
  };

  const setDemoSession = () => {
    setSupplierSession({
      supplierId: 'demo-supplier',
      supplierName: 'Demo Supplier',
      supplierEmail: 'demo@supplier.com',
      authenticated: true
    });
  };

  return {
    supplierSession,
    loading,
    supplier,
    stats,
    rfqInvitations,
    authEmail,
    setAuthEmail,
    authStep,
    setAuthStep,
    verificationCode,
    setVerificationCode,
    handleAuthentication,
    handleVerification,
    setDemoSession,
    setSupplierSession,
    setRFQInvitations,
    setStats
  };
};
