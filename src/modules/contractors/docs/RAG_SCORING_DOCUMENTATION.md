# ⚡ RAG Scoring System Documentation

## Overview

The RAG (Red, Amber, Green) Scoring System is a comprehensive contractor assessment framework that evaluates contractors across multiple dimensions to provide a risk-based rating system. This documentation covers all scoring algorithms, calculation methods, and implementation details.

## 📊 Scoring Dimensions

The RAG system evaluates contractors across **four primary dimensions**:

1. **Financial Health** - Financial stability and payment reliability
2. **Compliance Status** - Regulatory and documentation compliance
3. **Performance Metrics** - Project delivery and quality performance
4. **Safety Record** - Safety compliance and incident tracking

## 🎯 Score Calculation Overview

### Score Range
- **Numeric Score:** 0-100 (percentage-based)
- **RAG Rating:** Red (0-59), Amber (60-79), Green (80-100)

### Overall RAG Score
The overall RAG score is calculated as a **weighted average** of all dimensions:

```
Overall Score = (Financial × 0.25) + (Compliance × 0.30) + (Performance × 0.25) + (Safety × 0.20)
```

**Weighting Rationale:**
- Compliance: 30% (highest priority for regulatory adherence)
- Financial & Performance: 25% each (core business metrics)
- Safety: 20% (critical but fewer data points typically available)

## 💰 Financial Health Scoring

### Algorithm: `financial-calculator.ts`

The financial score evaluates contractor financial stability using multiple factors:

#### Data Points Required
```typescript
interface FinancialData {
  annualTurnover: number;
  creditRating?: string;
  paymentHistory: PaymentRecord[];
  yearsInBusiness: number;
  employeeCount: number;
  bankDetails: BankVerification;
}
```

#### Calculation Formula
```javascript
function calculateFinancialScore(data: FinancialData): FinancialScore {
  // Base scores for each factor (0-100)
  const turnoverScore = calculateTurnoverScore(data.annualTurnover);
  const creditScore = calculateCreditScore(data.creditRating);
  const paymentScore = calculatePaymentHistoryScore(data.paymentHistory);
  const stabilityScore = calculateBusinessStabilityScore(data.yearsInBusiness);
  const capacityScore = calculateCapacityScore(data.employeeCount);
  
  // Weighted calculation
  const financialScore = (
    turnoverScore * 0.30 +      // Annual turnover (30%)
    creditScore * 0.25 +        // Credit rating (25%)
    paymentScore * 0.25 +       // Payment history (25%)
    stabilityScore * 0.15 +     // Business stability (15%)
    capacityScore * 0.05        // Team capacity (5%)
  );
  
  return {
    score: ragMapping(financialScore),
    value: financialScore,
    factors: {
      turnover: ragMapping(turnoverScore),
      creditRating: ragMapping(creditScore),
      paymentHistory: ragMapping(paymentScore),
      businessStability: ragMapping(stabilityScore),
      capacity: ragMapping(capacityScore)
    }
  };
}
```

### Individual Factor Calculations

#### 1. Turnover Score (30% weight)
```javascript
function calculateTurnoverScore(turnover: number): number {
  // Scoring brackets (ZAR amounts)
  if (turnover >= 10000000) return 100;      // R10M+ = Excellent
  if (turnover >= 5000000) return 85;        // R5M+ = Very Good
  if (turnover >= 2000000) return 70;        // R2M+ = Good
  if (turnover >= 1000000) return 55;        // R1M+ = Fair
  if (turnover >= 500000) return 40;         // R500K+ = Poor
  return 20;                                 // <R500K = Very Poor
}
```

#### 2. Credit Rating Score (25% weight)
```javascript
function calculateCreditScore(rating?: string): number {
  const ratingScores = {
    'AAA': 100, 'AA+': 95, 'AA': 90, 'AA-': 85,
    'A+': 80, 'A': 75, 'A-': 70,
    'BBB+': 65, 'BBB': 60, 'BBB-': 55,
    'BB+': 50, 'BB': 45, 'BB-': 40,
    'B+': 35, 'B': 30, 'B-': 25,
    'CCC': 20, 'CC': 15, 'C': 10, 'D': 5
  };
  return ratingScores[rating] || 50; // Default to neutral if no rating
}
```

#### 3. Payment History Score (25% weight)
```javascript
function calculatePaymentHistoryScore(history: PaymentRecord[]): number {
  if (history.length === 0) return 50; // Neutral if no history
  
  const totalPayments = history.length;
  const onTimePayments = history.filter(p => p.paidOnTime).length;
  const latePayments = history.filter(p => p.daysLate > 0 && p.daysLate <= 30).length;
  const veryLatePayments = history.filter(p => p.daysLate > 30).length;
  
  // Calculate weighted score
  let score = 100;
  score -= (latePayments / totalPayments) * 20;      // -20 points per late payment %
  score -= (veryLatePayments / totalPayments) * 40;  // -40 points per very late payment %
  
  return Math.max(0, Math.min(100, score));
}
```

#### 4. Business Stability Score (15% weight)
```javascript
function calculateBusinessStabilityScore(yearsInBusiness: number): number {
  if (yearsInBusiness >= 20) return 100;    // 20+ years = Excellent
  if (yearsInBusiness >= 10) return 85;     // 10+ years = Very Good
  if (yearsInBusiness >= 5) return 70;      // 5+ years = Good
  if (yearsInBusiness >= 2) return 55;      // 2+ years = Fair
  if (yearsInBusiness >= 1) return 40;      // 1+ year = Poor
  return 25;                                // <1 year = Very Poor
}
```

## 📋 Compliance Status Scoring

### Algorithm: `compliance-calculator.ts`

Compliance scoring evaluates regulatory adherence and documentation completeness:

#### Data Points Required
```typescript
interface ComplianceData {
  documents: DocumentStatus[];
  certifications: CertificationStatus[];
  regulatoryCompliance: RegulatoryRecord[];
  auditResults: AuditResult[];
  expiryTracking: ExpiryStatus[];
}
```

#### Calculation Formula
```javascript
function calculateComplianceScore(data: ComplianceData): ComplianceScore {
  const documentScore = calculateDocumentComplianceScore(data.documents);
  const certificationScore = calculateCertificationScore(data.certifications);
  const regulatoryScore = calculateRegulatoryScore(data.regulatoryCompliance);
  const auditScore = calculateAuditScore(data.auditResults);
  const expiryScore = calculateExpiryScore(data.expiryTracking);
  
  const complianceScore = (
    documentScore * 0.35 +        // Document compliance (35%)
    certificationScore * 0.25 +   // Certifications (25%)
    regulatoryScore * 0.20 +      // Regulatory compliance (20%)
    auditScore * 0.15 +           // Audit results (15%)
    expiryScore * 0.05            // Expiry management (5%)
  );
  
  return {
    score: ragMapping(complianceScore),
    value: complianceScore,
    factors: {
      documentsValid: ragMapping(documentScore),
      certificationsCurrent: ragMapping(certificationScore),
      regulatoryCompliance: ragMapping(regulatoryScore),
      auditResults: ragMapping(auditScore),
      expiryManagement: ragMapping(expiryScore)
    }
  };
}
```

### Individual Factor Calculations

#### 1. Document Compliance Score (35% weight)
```javascript
function calculateDocumentComplianceScore(documents: DocumentStatus[]): number {
  const requiredDocs = documents.filter(d => d.required);
  const approvedDocs = requiredDocs.filter(d => d.status === 'approved');
  const rejectedDocs = requiredDocs.filter(d => d.status === 'rejected');
  const expiredDocs = requiredDocs.filter(d => d.isExpired);
  
  let score = 100;
  
  // Required documents missing/rejected
  const missingDocs = requiredDocs.length - approvedDocs.length;
  score -= (missingDocs / requiredDocs.length) * 60; // -60 points per missing required doc %
  
  // Expired documents penalty
  score -= (expiredDocs.length / requiredDocs.length) * 30; // -30 points per expired doc %
  
  // Quality bonus for extra optional documents
  const optionalDocs = documents.filter(d => !d.required && d.status === 'approved');
  score += Math.min(10, optionalDocs.length * 2); // +2 points per optional doc, max +10
  
  return Math.max(0, Math.min(100, score));
}
```

#### 2. Certification Score (25% weight)
```javascript
function calculateCertificationScore(certifications: CertificationStatus[]): number {
  if (certifications.length === 0) return 30; // Low score if no certifications
  
  const validCerts = certifications.filter(c => c.isValid && !c.isExpired);
  const expiredCerts = certifications.filter(c => c.isExpired);
  const criticalCerts = certifications.filter(c => c.isCritical);
  const validCriticalCerts = criticalCerts.filter(c => c.isValid && !c.isExpired);
  
  let score = 50; // Base score
  
  // Critical certifications (must have)
  if (criticalCerts.length > 0) {
    score += (validCriticalCerts.length / criticalCerts.length) * 40; // Up to +40 points
  }
  
  // Additional certifications bonus
  score += Math.min(20, validCerts.length * 2); // +2 points per valid cert, max +20
  
  // Expired certifications penalty
  score -= expiredCerts.length * 10; // -10 points per expired cert
  
  return Math.max(0, Math.min(100, score));
}
```

## 🎯 Performance Metrics Scoring

### Algorithm: `performance-calculator.ts`

Performance scoring evaluates project delivery quality and efficiency:

#### Data Points Required
```typescript
interface PerformanceData {
  projectHistory: ProjectRecord[];
  qualityMetrics: QualityAssessment[];
  timelinePerformance: TimelineRecord[];
  clientFeedback: FeedbackRecord[];
  defectRates: DefectData[];
}
```

#### Calculation Formula
```javascript
function calculatePerformanceScore(data: PerformanceData): PerformanceScore {
  const projectSuccessScore = calculateProjectSuccessScore(data.projectHistory);
  const qualityScore = calculateQualityScore(data.qualityMetrics);
  const timelinessScore = calculateTimelinessScore(data.timelinePerformance);
  const clientSatisfactionScore = calculateClientSatisfactionScore(data.clientFeedback);
  const defectScore = calculateDefectScore(data.defectRates);
  
  const performanceScore = (
    projectSuccessScore * 0.30 +     // Project success rate (30%)
    qualityScore * 0.25 +            // Quality metrics (25%)
    timelinessScore * 0.25 +         // Timeline performance (25%)
    clientSatisfactionScore * 0.15 + // Client satisfaction (15%)
    defectScore * 0.05               // Defect management (5%)
  );
  
  return {
    score: ragMapping(performanceScore),
    value: performanceScore,
    factors: {
      projectSuccess: ragMapping(projectSuccessScore),
      qualityMetrics: ragMapping(qualityScore),
      timelyCompletion: ragMapping(timelinessScore),
      clientSatisfaction: ragMapping(clientSatisfactionScore),
      defectManagement: ragMapping(defectScore)
    }
  };
}
```

### Individual Factor Calculations

#### 1. Project Success Score (30% weight)
```javascript
function calculateProjectSuccessScore(projects: ProjectRecord[]): number {
  if (projects.length === 0) return 50; // Neutral if no history
  
  const completedProjects = projects.filter(p => p.status === 'completed');
  const cancelledProjects = projects.filter(p => p.status === 'cancelled');
  const onHoldProjects = projects.filter(p => p.status === 'on_hold');
  
  const successRate = completedProjects.length / projects.length;
  const cancellationRate = cancelledProjects.length / projects.length;
  
  let score = successRate * 100; // Base success rate
  score -= cancellationRate * 50; // Penalty for cancellations
  score -= (onHoldProjects.length / projects.length) * 20; // Penalty for delays
  
  return Math.max(0, Math.min(100, score));
}
```

#### 2. Quality Score (25% weight)
```javascript
function calculateQualityScore(assessments: QualityAssessment[]): number {
  if (assessments.length === 0) return 50;
  
  const avgQualityScore = assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length;
  const recentAssessments = assessments.filter(a => isWithinDays(a.date, 180)); // Last 6 months
  
  let score = avgQualityScore;
  
  // Recent performance weighting
  if (recentAssessments.length > 0) {
    const recentAvg = recentAssessments.reduce((sum, a) => sum + a.score, 0) / recentAssessments.length;
    score = (avgQualityScore * 0.4) + (recentAvg * 0.6); // Weight recent performance higher
  }
  
  return Math.max(0, Math.min(100, score));
}
```

#### 3. Timeline Performance Score (25% weight)
```javascript
function calculateTimelinessScore(timeline: TimelineRecord[]): number {
  if (timeline.length === 0) return 50;
  
  const onTimeProjects = timeline.filter(t => t.daysDelay <= 0);
  const minorDelays = timeline.filter(t => t.daysDelay > 0 && t.daysDelay <= 7);
  const majorDelays = timeline.filter(t => t.daysDelay > 7);
  
  const onTimeRate = onTimeProjects.length / timeline.length;
  const minorDelayRate = minorDelays.length / timeline.length;
  const majorDelayRate = majorDelays.length / timeline.length;
  
  let score = 100;
  score -= minorDelayRate * 15; // -15 points per minor delay %
  score -= majorDelayRate * 40; // -40 points per major delay %
  
  // Bonus for consistent early delivery
  const earlyDeliveries = timeline.filter(t => t.daysDelay < -1);
  score += Math.min(10, (earlyDeliveries.length / timeline.length) * 20);
  
  return Math.max(0, Math.min(100, score));
}
```

## 🦺 Safety Record Scoring

### Algorithm: `safety-calculator.ts`

Safety scoring evaluates incident history and safety compliance:

#### Data Points Required
```typescript
interface SafetyData {
  incidents: IncidentRecord[];
  safetyTraining: TrainingRecord[];
  safetyCertifications: CertificationRecord[];
  auditResults: SafetyAuditResult[];
  equipmentInspections: InspectionRecord[];
}
```

#### Calculation Formula
```javascript
function calculateSafetyScore(data: SafetyData): SafetyScore {
  const incidentScore = calculateIncidentScore(data.incidents);
  const trainingScore = calculateSafetyTrainingScore(data.safetyTraining);
  const certificationScore = calculateSafetyCertificationScore(data.safetyCertifications);
  const auditScore = calculateSafetyAuditScore(data.auditResults);
  const equipmentScore = calculateEquipmentSafetyScore(data.equipmentInspections);
  
  const safetyScore = (
    incidentScore * 0.40 +         // Incident record (40%)
    certificationScore * 0.25 +    // Safety certifications (25%)
    trainingScore * 0.20 +         // Safety training (20%)
    auditScore * 0.10 +            // Safety audits (10%)
    equipmentScore * 0.05          // Equipment safety (5%)
  );
  
  return {
    score: ragMapping(safetyScore),
    value: safetyScore,
    factors: {
      incidentRate: ragMapping(incidentScore),
      safetyCertification: ragMapping(certificationScore),
      safetyTraining: ragMapping(trainingScore),
      auditCompliance: ragMapping(auditScore),
      equipmentSafety: ragMapping(equipmentScore)
    }
  };
}
```

### Individual Factor Calculations

#### 1. Incident Score (40% weight)
```javascript
function calculateIncidentScore(incidents: IncidentRecord[]): number {
  const recentIncidents = incidents.filter(i => isWithinDays(i.date, 365)); // Last 12 months
  const criticalIncidents = recentIncidents.filter(i => i.severity === 'critical');
  const majorIncidents = recentIncidents.filter(i => i.severity === 'major');
  const minorIncidents = recentIncidents.filter(i => i.severity === 'minor');
  
  let score = 100;
  
  // Severe penalties for critical incidents
  score -= criticalIncidents.length * 40;  // -40 points per critical incident
  score -= majorIncidents.length * 20;     // -20 points per major incident
  score -= minorIncidents.length * 5;      // -5 points per minor incident
  
  // Bonus for incident-free periods
  const daysSinceLastIncident = calculateDaysSinceLastIncident(incidents);
  if (daysSinceLastIncident > 365) {
    score += 10; // +10 bonus for 1+ years without incident
  }
  
  return Math.max(0, Math.min(100, score));
}
```

## 🔄 RAG Score Mapping

The numeric scores are mapped to RAG ratings using these thresholds:

```javascript
function ragMapping(numericScore: number): 'red' | 'amber' | 'green' {
  if (numericScore >= 80) return 'green';      // 80-100 = Green
  if (numericScore >= 60) return 'amber';      // 60-79 = Amber  
  return 'red';                                // 0-59 = Red
}
```

## ⏱️ Calculation Frequency

### Automatic Recalculation Triggers
- **Document status change:** Immediate recalculation of compliance score
- **Project completion:** Immediate recalculation of performance score
- **Payment received:** Immediate recalculation of financial score
- **Incident reported:** Immediate recalculation of safety score

### Scheduled Recalculations
- **Daily:** Document expiry checks, compliance updates
- **Weekly:** Performance metric aggregation
- **Monthly:** Comprehensive score recalculation for all contractors
- **Quarterly:** Historical trend analysis and score validation

## 📊 Score History and Trending

### Historical Tracking
All RAG score changes are tracked in the `contractor_rag_history` table:

```sql
CREATE TABLE contractor_rag_history (
    id SERIAL PRIMARY KEY,
    contractor_id INTEGER,
    score_type VARCHAR(50), -- 'overall', 'financial', 'compliance', 'performance', 'safety'
    old_score VARCHAR(10),
    new_score VARCHAR(10),
    change_reason TEXT,
    assessment_data JSONB,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP DEFAULT NOW()
);
```

### Trend Analysis
```javascript
function calculateScoreTrend(history: ScoreHistory[], period: number): TrendAnalysis {
  const recentHistory = history.filter(h => isWithinDays(h.changed_at, period));
  
  if (recentHistory.length < 2) {
    return { trend: 'stable', confidence: 'low' };
  }
  
  const improvements = recentHistory.filter(h => scoreValue(h.new_score) > scoreValue(h.old_score));
  const deteriorations = recentHistory.filter(h => scoreValue(h.new_score) < scoreValue(h.old_score));
  
  if (improvements.length > deteriorations.length * 1.5) {
    return { trend: 'improving', confidence: 'high' };
  } else if (deteriorations.length > improvements.length * 1.5) {
    return { trend: 'declining', confidence: 'high' };
  }
  
  return { trend: 'stable', confidence: 'medium' };
}
```

## 🔧 Configuration and Customization

### Configurable Parameters
The scoring system supports customizable parameters via configuration:

```javascript
const RAG_CONFIG = {
  weights: {
    financial: 0.25,
    compliance: 0.30,
    performance: 0.25,
    safety: 0.20
  },
  thresholds: {
    green_min: 80,
    amber_min: 60
  },
  financial: {
    turnover_brackets: [500000, 1000000, 2000000, 5000000, 10000000],
    business_stability_brackets: [1, 2, 5, 10, 20]
  },
  compliance: {
    document_missing_penalty: 60,
    expired_document_penalty: 30,
    optional_document_bonus: 2
  },
  performance: {
    minor_delay_penalty: 15,
    major_delay_penalty: 40,
    early_delivery_bonus: 20
  },
  safety: {
    critical_incident_penalty: 40,
    major_incident_penalty: 20,
    minor_incident_penalty: 5,
    incident_free_bonus: 10
  }
};
```

## 🧪 Testing and Validation

### Unit Tests
Each calculator has comprehensive unit tests covering:
- Edge cases (no data, invalid data)
- Boundary conditions (threshold values)
- Score calculations with known inputs
- RAG mapping accuracy

### Integration Tests
- End-to-end score calculation workflows
- Historical tracking accuracy
- Performance impact testing

### Validation Rules
```javascript
function validateScoreCalculation(result: RAGScore): ValidationResult {
  const errors = [];
  
  // Validate score ranges
  if (result.value < 0 || result.value > 100) {
    errors.push('Score must be between 0-100');
  }
  
  // Validate RAG mapping consistency
  const expectedRAG = ragMapping(result.value);
  if (result.score !== expectedRAG) {
    errors.push('RAG mapping inconsistency');
  }
  
  // Validate factor scores
  Object.values(result.factors).forEach((factorScore, index) => {
    if (!['red', 'amber', 'green'].includes(factorScore)) {
      errors.push(`Invalid factor score: ${factorScore}`);
    }
  });
  
  return { valid: errors.length === 0, errors };
}
```

## 📈 Performance Optimization

### Calculation Caching
- RAG scores are cached for 1 hour for read operations
- Cache is invalidated immediately on data changes
- Bulk calculations use batch processing

### Database Optimization
- Indexes on frequently queried score fields
- Materialized views for complex aggregations
- Asynchronous background processing for non-critical updates

## 🔍 Monitoring and Alerts

### Score Monitoring
- Real-time alerts for contractors dropping to RED status
- Weekly reports on score distribution changes
- Monthly trend analysis reports

### System Health Monitoring
- Calculation performance metrics
- Error rate tracking
- Data quality validation

---

**Document Version:** 1.0  
**Last Updated:** September 17, 2025  
**Next Review:** December 17, 2025

This documentation should be reviewed quarterly and updated whenever scoring algorithms are modified.