/**
 * ComplianceTracker Component - Document compliance dashboard and monitoring
 * Provides comprehensive compliance tracking and reporting functionality
 * @module ComplianceTracker
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  X, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  Download,
  RefreshCw
} from 'lucide-react';
import { ContractorDocument } from '@/types/contractor.types';
import { ComplianceIssue } from './types/documentApproval.types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { log } from '@/lib/logger';

interface ComplianceTrackerProps {
  /**
   * Documents to analyze for compliance
   */
  documents: ContractorDocument[];
  /**
   * Callback when tracker is closed
   */
  onClose: () => void;
  /**
   * Optional contractor ID for focused compliance tracking
   */
  contractorId?: string;
  /**
   * Enable export functionality
   */
  enableExport?: boolean;
  /**
   * Auto-refresh interval in seconds (0 to disable)
   */
  autoRefreshInterval?: number;
  /**
   * Callback when compliance issues are detected
   */
  onComplianceIssue?: (issues: ComplianceIssue[]) => void;
}

/**
 * Compliance metric categories
 */
interface ComplianceMetrics {
  overall: {
    score: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    trend: 'up' | 'down' | 'stable';
  };
  categories: {
    [key: string]: {
      score: number;
      total: number;
      compliant: number;
      issues: ComplianceIssue[];
    };
  };
  timeline: {
    date: string;
    score: number;
    issues: number;
  }[];
  recommendations: string[];
}

/**
 * ComplianceTracker - Comprehensive compliance monitoring dashboard
 */
export function ComplianceTracker({
  documents,
  onClose,
  contractorId,
  enableExport = true,
  autoRefreshInterval = 0,
  onComplianceIssue
}: ComplianceTrackerProps) {
  // 🟢 WORKING: Component state
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [_selectedTimeframe, _setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [_showDetailedView, _setShowDetailedView] = useState(false);
  const [complianceData, setComplianceData] = useState<ComplianceMetrics | null>(null);

  /**
   * Calculate comprehensive compliance metrics
   */
  const calculateComplianceMetrics = useCallback((): ComplianceMetrics => {
    const now = new Date();
    const categories: { [key: string]: any } = {};
    const allIssues: ComplianceIssue[] = [];

    // Group documents by type
    const documentsByType = documents.reduce((acc, doc) => {
      if (!acc[doc.documentType]) {
        acc[doc.documentType] = [];
      }
      acc[doc.documentType].push(doc);
      return acc;
    }, {} as { [key: string]: ContractorDocument[] });

    // Analyze each document type
    Object.entries(documentsByType).forEach(([type, docs]) => {
      const typeIssues: ComplianceIssue[] = [];
      let compliantCount = 0;

      docs.forEach(doc => {
        let isCompliant = true;
        
        // Check verification status
        if (doc.verificationStatus === 'pending') {
          typeIssues.push({
            id: `${doc.id}-pending`,
            type: 'quality_check_failed',
            severity: 'medium',
            message: `Document pending approval: ${doc.documentName}`,
            suggestedAction: 'Review and approve document',
            autoFixAvailable: false
          });
          isCompliant = false;
        } else if (doc.verificationStatus === 'rejected') {
          typeIssues.push({
            id: `${doc.id}-rejected`,
            type: 'regulatory_compliance',
            severity: 'high',
            message: `Document rejected: ${doc.rejectionReason || 'No reason provided'}`,
            suggestedAction: 'Re-upload compliant document',
            autoFixAvailable: false
          });
          isCompliant = false;
        }

        // Check expiry
        if (doc.expiryDate) {
          const expiryDate = new Date(doc.expiryDate);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry < 0) {
            typeIssues.push({
              id: `${doc.id}-expired`,
              type: 'expiry_warning',
              severity: 'critical',
              message: `Expired document: ${doc.documentName}`,
              suggestedAction: 'Upload renewed document immediately',
              autoFixAvailable: false
            });
            isCompliant = false;
          } else if (daysUntilExpiry <= 30) {
            typeIssues.push({
              id: `${doc.id}-expiring`,
              type: 'expiry_warning',
              severity: daysUntilExpiry <= 7 ? 'high' : 'medium',
              message: `Document expiring in ${daysUntilExpiry} days: ${doc.documentName}`,
              suggestedAction: `Renew document before ${expiryDate.toLocaleDateString()}`,
              autoFixAvailable: false
            });
          }
        }

        // Check file quality (basic checks)
        if (doc.fileSize && doc.fileSize < 50000) { // Less than 50KB
          typeIssues.push({
            id: `${doc.id}-quality`,
            type: 'quality_check_failed',
            severity: 'low',
            message: `Small file size may indicate poor quality: ${doc.documentName}`,
            suggestedAction: 'Verify document quality and re-upload if necessary',
            autoFixAvailable: false
          });
        }

        if (isCompliant) {
          compliantCount++;
        }
      });

      // Calculate category score
      const totalDocs = docs.length;
      const score = totalDocs > 0 ? Math.round((compliantCount / totalDocs) * 100) : 100;
      
      categories[type] = {
        score,
        total: totalDocs,
        compliant: compliantCount,
        issues: typeIssues
      };

      allIssues.push(...typeIssues);
    });

    // Calculate overall compliance score
    const totalDocs = documents.length;
    const totalCompliant = Object.values(categories).reduce((sum: number, cat: any) => sum + cat.compliant, 0);
    const overallScore = totalDocs > 0 ? Math.round((totalCompliant / totalDocs) * 100) : 100;

    // Determine overall status
    let overallStatus: 'excellent' | 'good' | 'warning' | 'critical';
    if (overallScore >= 95) overallStatus = 'excellent';
    else if (overallScore >= 80) overallStatus = 'good';
    else if (overallScore >= 60) overallStatus = 'warning';
    else overallStatus = 'critical';

    // Generate timeline (mock data for now)
    const timeline = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: Math.max(0, overallScore + (Math.random() - 0.5) * 10),
        issues: Math.floor(Math.random() * 5) + allIssues.length / 7
      };
    });

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (overallScore < 80) {
      recommendations.push('Prioritize resolving pending document approvals');
    }
    
    const expiredDocs = allIssues.filter(i => i.type === 'expiry_warning' && i.severity === 'critical').length;
    if (expiredDocs > 0) {
      recommendations.push(`Immediately renew ${expiredDocs} expired document(s)`);
    }
    
    const expiringDocs = allIssues.filter(i => i.type === 'expiry_warning' && i.severity !== 'critical').length;
    if (expiringDocs > 0) {
      recommendations.push(`Plan renewal for ${expiringDocs} expiring document(s)`);
    }
    
    const rejectedDocs = allIssues.filter(i => i.message.includes('rejected')).length;
    if (rejectedDocs > 0) {
      recommendations.push(`Address ${rejectedDocs} rejected document(s)`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintain current compliance standards');
    }

    return {
      overall: {
        score: overallScore,
        status: overallStatus,
        trend: 'stable' // 🟡 PARTIAL: Would calculate from historical data
      },
      categories,
      timeline,
      recommendations
    };
  }, [documents]);

  /**
   * Export compliance report
   */
  const exportComplianceReport = useCallback(async () => {
    if (!complianceData) return;

    try {
      setIsLoading(true);
      
      // Generate CSV content
      const csvContent = generateComplianceCSV(complianceData);
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `compliance-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Compliance report exported successfully');
    } catch (error) {
      log.error('Failed to export compliance report:', { data: error }, 'ComplianceTracker');
      toast.error('Failed to export compliance report');
    } finally {
      setIsLoading(false);
    }
  }, [complianceData]);

  /**
   * Generate CSV content for export
   */
  const generateComplianceCSV = (data: ComplianceMetrics): string => {
    const headers = ['Document Type', 'Compliance Score', 'Total Documents', 'Compliant Documents', 'Issues Count'];
    const rows = [headers.join(',')];
    
    // Add category data
    Object.entries(data.categories).forEach(([type, category]) => {
      rows.push([
        type.replace('_', ' '),
        category.score.toString(),
        category.total.toString(),
        category.compliant.toString(),
        category.issues.length.toString()
      ].join(','));
    });
    
    // Add summary row
    rows.push('');
    rows.push(`Overall Compliance Score,${data.overall.score}%`);
    rows.push(`Overall Status,${data.overall.status}`);
    rows.push(`Total Issues,${Object.values(data.categories).reduce((sum: number, cat: any) => sum + cat.issues.length, 0)}`);
    
    return rows.join('\n');
  };

  /**
   * Get status color class
   */
  const getStatusColor = (status: string, severity?: string): string => {
    if (severity) {
      switch (severity) {
        case 'critical': return 'text-red-600 bg-red-100';
        case 'high': return 'text-orange-600 bg-orange-100';
        case 'medium': return 'text-yellow-600 bg-yellow-100';
        case 'low': return 'text-blue-600 bg-blue-100';
        default: return 'text-gray-600 bg-gray-100';
      }
    }
    
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  /**
   * Get trend icon
   */
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  /**
   * Filter issues by category
   */
  const filteredIssues = useMemo(() => {
    if (!complianceData) return [];
    
    if (selectedCategory === 'all') {
      return Object.values(complianceData.categories)
        .flatMap((cat: any) => cat.issues)
        .sort((a, b) => {
          const severityOrder: { [key: string]: number } = { critical: 0, high: 1, medium: 2, low: 3 };
          return (severityOrder[a.severity] || 999) - (severityOrder[b.severity] || 999);
        });
    }
    
    return complianceData.categories[selectedCategory]?.issues || [];
  }, [complianceData, selectedCategory]);

  // Calculate compliance metrics on mount and when documents change
  useEffect(() => {
    const metrics = calculateComplianceMetrics();
    setComplianceData(metrics);
    
    // Emit compliance issues if callback provided
    const allIssues = Object.values(metrics.categories).flatMap((cat: any) => cat.issues);
    onComplianceIssue?.(allIssues);
  }, [documents, calculateComplianceMetrics, onComplianceIssue]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        const metrics = calculateComplianceMetrics();
        setComplianceData(metrics);
      }, autoRefreshInterval * 1000);
      
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefreshInterval, calculateComplianceMetrics]);

  if (!complianceData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8">
          <LoadingSpinner size="lg" label="Calculating compliance metrics..." />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Compliance Dashboard</h2>
              <p className="text-gray-600">
                Document compliance monitoring and reporting
                {contractorId && ' for selected contractor'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {enableExport && (
              <button
                onClick={exportComplianceReport}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export Report
              </button>
            )}
            
            <button
              onClick={() => {
                const metrics = calculateComplianceMetrics();
                setComplianceData(metrics);
              }}
              className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
              title="Refresh data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
              title="Close dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Overall Compliance Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Overall Compliance</h3>
              {getTrendIcon(complianceData.overall.trend)}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {complianceData.overall.score}%
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  getStatusColor(complianceData.overall.status)
                }`}>
                  <Shield className="w-4 h-4 mr-1" />
                  {complianceData.overall.status.toUpperCase()}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-2">Documents Analyzed</div>
                <div className="text-2xl font-semibold text-gray-900">{documents.length}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-2">Total Issues</div>
                <div className="text-2xl font-semibold text-red-600">
                  {Object.values(complianceData.categories).reduce((sum: number, cat: any) => sum + cat.issues.length, 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(complianceData.categories).map(([type, category]: [string, any]) => (
              <div
                key={type}
                className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedCategory === type ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedCategory(selectedCategory === type ? 'all' : type)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 capitalize">
                    {type.replace('_', ' ')}
                  </h4>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    category.score >= 90 ? 'bg-green-100 text-green-800' :
                    category.score >= 70 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {category.score}%
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Compliant</span>
                    <span className="font-medium">{category.compliant}/{category.total}</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${category.score}%` }}
                    />
                  </div>
                  
                  {category.issues.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-red-600">
                      <AlertTriangle className="w-3 h-3" />
                      {category.issues.length} issue{category.issues.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Issues List */}
          {filteredIssues.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedCategory === 'all' ? 'All Issues' : `${selectedCategory.replace('_', ' ')} Issues`}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {filteredIssues.map((issue) => (
                  <div key={issue.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            getStatusColor('', issue.severity)
                          }`}>
                            {issue.severity.toUpperCase()}
                          </span>
                          
                          <span className="text-xs text-gray-500">
                            {issue.type.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-900 mb-1">
                          {issue.message}
                        </p>
                        
                        <p className="text-xs text-gray-600">
                          <strong>Suggested Action:</strong> {issue.suggestedAction}
                        </p>
                      </div>
                      
                      {issue.autoFixAvailable && (
                        <button className="ml-4 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
                          Auto Fix
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {complianceData.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Recommendations
              </h3>
              
              <ul className="space-y-2">
                {complianceData.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-blue-800">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}