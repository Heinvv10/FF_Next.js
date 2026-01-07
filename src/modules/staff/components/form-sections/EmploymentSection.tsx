import { useState, useEffect } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import {
  StaffFormData,
  StaffLevel,
  StaffStatus,
  ContractType
} from '@/types/staff.types';
import {
  StaffPosition,
  StaffDepartment,
  getPositionsByDepartment
} from '@/types/staff-hierarchy.types';
import {
  SAContractType,
  SA_CONTRACT_TYPE_LABELS,
  SA_CONTRACT_CONFIG,
  UIFStatus,
  UIF_STATUS_LABELS,
  COIDAStatus,
  COIDA_STATUS_LABELS,
  TaxStatus,
  TAX_STATUS_LABELS,
  ProbationStatus,
  PROBATION_STATUS_LABELS,
  NoticePeriod,
  NOTICE_PERIOD_LABELS,
  getDefaultCompliance,
  getContractConfig,
} from '@/types/staff/compliance.types';
import { useStaff } from '@/hooks/useStaff';

interface EmploymentSectionProps {
  formData: StaffFormData;
  handleInputChange: (field: keyof StaffFormData, value: any) => void;
}

const inputClasses = "w-full px-3 py-2 bg-[var(--ff-bg-tertiary)] text-[var(--ff-text-primary)] border border-[var(--ff-border-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelClasses = "block text-sm font-medium text-[var(--ff-text-secondary)] mb-1";

export function EmploymentSection({ formData, handleInputChange }: EmploymentSectionProps) {
  const { data: staffList } = useStaff(); // Get all staff for Reports To dropdown

  // Filter positions based on selected department
  const availablePositions = formData.department
    ? getPositionsByDepartment(formData.department)
    : Object.values(StaffPosition);

  // Get potential managers (exclude current staff member if editing)
  const potentialManagers = staffList?.filter(staff =>
    staff.id !== formData.id &&
    ['MD', 'CCSO', 'BDO', 'Head', 'Manager'].some(title =>
      staff.position?.includes(title)
    )
  ) || [];

  return (
    <div>
      <h2 className="text-lg font-medium text-[var(--ff-text-primary)] mb-4">Employment Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>
            Department *
          </label>
          <select
            value={formData.department}
            onChange={(e) => handleInputChange('department', e.target.value)}
            className={inputClasses}
            required
          >
            <option value="">Select Department</option>
            {Object.values(StaffDepartment).map(dept => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClasses}>
            Position
          </label>
          <select
            value={formData.position}
            onChange={(e) => handleInputChange('position', e.target.value)}
            className={inputClasses}
          >
            <option value="">Select Position</option>
            {availablePositions.map(position => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClasses}>
            Reports To
          </label>
          <select
            value={formData.reportsTo || ''}
            onChange={(e) => handleInputChange('reportsTo', e.target.value)}
            className={inputClasses}
          >
            <option value="">No Direct Manager</option>
            {potentialManagers.map(manager => (
              <option key={manager.id} value={manager.id}>
                {manager.name} - {manager.position}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClasses}>
            Level
          </label>
          <select
            value={formData.level}
            onChange={(e) => handleInputChange('level', e.target.value as StaffLevel)}
            className={inputClasses}
          >
            <option value="">Select Level</option>
            {Object.values(StaffLevel).map(level => (
              <option key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClasses}>
            Status *
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value as StaffStatus)}
            className={inputClasses}
            required
          >
            <option value="">Select Status</option>
            {Object.values(StaffStatus).map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClasses}>
            Contract Type *
          </label>
          <select
            value={formData.saContractType || formData.contractType}
            onChange={(e) => {
              const newType = e.target.value as SAContractType;
              handleInputChange('saContractType', newType);
              // Also update legacy field for backward compatibility
              handleInputChange('contractType', newType as unknown as ContractType);
              // Set default compliance values based on contract type
              const defaults = getDefaultCompliance(newType);
              if (defaults.uifStatus) handleInputChange('uifStatus', defaults.uifStatus);
              if (defaults.coidaStatus) handleInputChange('coidaStatus', defaults.coidaStatus);
              if (defaults.taxStatus) handleInputChange('taxStatus', defaults.taxStatus);
              if (defaults.probationStatus) handleInputChange('probationStatus', defaults.probationStatus);
              if (defaults.noticePeriod) handleInputChange('noticePeriod', defaults.noticePeriod);
            }}
            className={inputClasses}
            required
          >
            <option value="">Select Contract Type</option>
            {Object.values(SAContractType).map(type => (
              <option key={type} value={type}>
                {SA_CONTRACT_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          {formData.saContractType && (
            <p className="mt-1 text-xs text-[var(--ff-text-secondary)]">
              {SA_CONTRACT_CONFIG[formData.saContractType as SAContractType]?.description}
            </p>
          )}
        </div>

        <div>
          <label className={labelClasses}>
            Start Date *
          </label>
          <input
            type="date"
            required
            value={formData.startDate ? formData.startDate.toISOString().split('T')[0] : ''}
            onChange={(e) => handleInputChange('startDate', new Date(e.target.value))}
            className={inputClasses}
          />
        </div>

        <div>
          <label className={labelClasses}>
            End Date
          </label>
          <input
            type="date"
            value={formData.endDate ? formData.endDate.toISOString().split('T')[0] : ''}
            onChange={(e) => handleInputChange('endDate', e.target.value ? new Date(e.target.value) : null)}
            className={inputClasses}
          />
        </div>

        <div>
          <label className={labelClasses}>
            Experience Years
          </label>
          <input
            type="number"
            min="0"
            max="50"
            value={formData.experienceYears}
            onChange={(e) => handleInputChange('experienceYears', parseInt(e.target.value) || 0)}
            className={inputClasses}
          />
        </div>

        <div>
          <label className={labelClasses}>
            Max Project Count
          </label>
          <input
            type="number"
            min="0"
            max="20"
            value={formData.maxProjectCount}
            onChange={(e) => handleInputChange('maxProjectCount', parseInt(e.target.value) || 5)}
            className={inputClasses}
          />
        </div>
      </div>

      {/* SA Labour Compliance Section */}
      <SAComplianceSection formData={formData} handleInputChange={handleInputChange} />
    </div>
  );
}

/**
 * SA Labour Compliance Fields Section
 * Conditionally renders compliance fields based on contract type
 */
function SAComplianceSection({
  formData,
  handleInputChange,
}: {
  formData: StaffFormData;
  handleInputChange: (field: keyof StaffFormData, value: any) => void;
}) {
  const contractType = (formData.saContractType || formData.contractType) as SAContractType;
  const config = contractType ? getContractConfig(contractType) : null;

  if (!config) return null;

  const inputClasses = "w-full px-3 py-2 bg-[var(--ff-bg-tertiary)] text-[var(--ff-text-primary)] border border-[var(--ff-border-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelClasses = "block text-sm font-medium text-[var(--ff-text-secondary)] mb-1";

  return (
    <div className="mt-6 pt-6 border-t border-[var(--ff-border-light)]">
      <h3 className="text-md font-medium text-[var(--ff-text-primary)] mb-4 flex items-center gap-2">
        SA Labour Compliance
        <span className="text-xs font-normal text-[var(--ff-text-secondary)] bg-[var(--ff-bg-tertiary)] px-2 py-0.5 rounded">
          {config.isEmployee ? 'Employee' : 'Contractor'}
        </span>
      </h3>

      {/* Info banner for contractors */}
      {!config.isEmployee && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2">
          <Info className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-200">
            <strong>Independent Contractor:</strong> Not an employee under SA labour law.
            Responsible for own UIF, COIDA, and tax obligations.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* UIF Section - only for employees */}
        {config.requiresUIF && (
          <>
            <div>
              <label className={labelClasses}>UIF Status *</label>
              <select
                value={formData.uifStatus || UIFStatus.PENDING}
                onChange={(e) => handleInputChange('uifStatus', e.target.value as UIFStatus)}
                className={inputClasses}
                required
              >
                {Object.values(UIFStatus)
                  .filter(s => s !== UIFStatus.NOT_APPLICABLE)
                  .map(status => (
                    <option key={status} value={status}>
                      {UIF_STATUS_LABELS[status]}
                    </option>
                  ))}
              </select>
            </div>
            {formData.uifStatus === UIFStatus.REGISTERED && (
              <div>
                <label className={labelClasses}>UIF Number</label>
                <input
                  type="text"
                  value={formData.uifNumber || ''}
                  onChange={(e) => handleInputChange('uifNumber', e.target.value)}
                  className={inputClasses}
                  placeholder="UIF reference number"
                />
              </div>
            )}
          </>
        )}

        {/* COIDA Section - only for employees */}
        {config.requiresCOIDA && (
          <div>
            <label className={labelClasses}>COIDA Status *</label>
            <select
              value={formData.coidaStatus || COIDAStatus.PENDING}
              onChange={(e) => handleInputChange('coidaStatus', e.target.value as COIDAStatus)}
              className={inputClasses}
              required
            >
              {Object.values(COIDAStatus)
                .filter(s => s !== COIDAStatus.NOT_APPLICABLE)
                .map(status => (
                  <option key={status} value={status}>
                    {COIDA_STATUS_LABELS[status]}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Tax Status */}
        <div>
          <label className={labelClasses}>Tax Status *</label>
          <select
            value={formData.taxStatus || (config.requiresPAYE ? TaxStatus.PAYE : TaxStatus.PROVISIONAL)}
            onChange={(e) => handleInputChange('taxStatus', e.target.value as TaxStatus)}
            className={inputClasses}
            required
          >
            {Object.values(TaxStatus).map(status => (
              <option key={status} value={status}>
                {TAX_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        {/* Probation Section - only if applicable */}
        {config.hasProbation && (
          <>
            <div>
              <label className={labelClasses}>Probation Status</label>
              <select
                value={formData.probationStatus || ProbationStatus.IN_PROBATION}
                onChange={(e) => handleInputChange('probationStatus', e.target.value as ProbationStatus)}
                className={inputClasses}
              >
                {Object.values(ProbationStatus).map(status => (
                  <option key={status} value={status}>
                    {PROBATION_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
            {formData.probationStatus === ProbationStatus.IN_PROBATION && (
              <>
                <div>
                  <label className={labelClasses}>Probation Start Date</label>
                  <input
                    type="date"
                    value={formData.probationStartDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => handleInputChange('probationStartDate', e.target.value ? new Date(e.target.value) : undefined)}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>
                    Probation End Date
                    <span className="text-xs text-[var(--ff-text-muted)] ml-1">
                      (max {config.maxProbationMonths} months)
                    </span>
                  </label>
                  <input
                    type="date"
                    value={formData.probationEndDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => handleInputChange('probationEndDate', e.target.value ? new Date(e.target.value) : undefined)}
                    className={inputClasses}
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* Contract End Date - for fixed-term and contractors */}
        {config.requiresEndDate && (
          <div>
            <label className={labelClasses}>Contract End Date *</label>
            <input
              type="date"
              value={formData.contractEndDate?.toISOString().split('T')[0] || formData.endDate?.toISOString().split('T')[0] || ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : undefined;
                handleInputChange('contractEndDate', date);
                handleInputChange('endDate', date);
              }}
              className={inputClasses}
              required
            />
          </div>
        )}

        {/* Weekly Hours */}
        <div>
          <label className={labelClasses}>
            Weekly Hours
            <span className="text-xs text-[var(--ff-text-muted)] ml-1">(max 45 per BCEA)</span>
          </label>
          <input
            type="number"
            min="1"
            max="45"
            value={formData.weeklyHours || ''}
            onChange={(e) => handleInputChange('weeklyHours', parseInt(e.target.value) || undefined)}
            className={inputClasses}
            placeholder={contractType === SAContractType.PART_TIME ? 'Less than 24' : '40-45'}
          />
          {contractType === SAContractType.PART_TIME && formData.weeklyHours && formData.weeklyHours >= 24 && (
            <p className="mt-1 text-xs text-amber-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Part-time should be &lt;24 hours/week per BCEA
            </p>
          )}
        </div>

        {/* Notice Period - only for employees */}
        {config.hasNoticePeriod && (
          <div>
            <label className={labelClasses}>Notice Period</label>
            <select
              value={formData.noticePeriod || NoticePeriod.AS_PER_CONTRACT}
              onChange={(e) => handleInputChange('noticePeriod', e.target.value as NoticePeriod)}
              className={inputClasses}
            >
              {Object.values(NoticePeriod)
                .filter(p => p !== NoticePeriod.NOT_APPLICABLE)
                .map(period => (
                  <option key={period} value={period}>
                    {NOTICE_PERIOD_LABELS[period]}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* SA ID Number */}
        <div>
          <label className={labelClasses}>SA ID Number</label>
          <input
            type="text"
            maxLength={13}
            value={formData.idNumber || ''}
            onChange={(e) => handleInputChange('idNumber', e.target.value.replace(/\D/g, ''))}
            className={inputClasses}
            placeholder="13-digit SA ID"
          />
        </div>

        {/* Work Permit (for foreign nationals) */}
        <div>
          <label className={labelClasses}>Work Permit Number</label>
          <input
            type="text"
            value={formData.workPermitNumber || ''}
            onChange={(e) => handleInputChange('workPermitNumber', e.target.value)}
            className={inputClasses}
            placeholder="For foreign nationals"
          />
        </div>

        {formData.workPermitNumber && (
          <div>
            <label className={labelClasses}>Work Permit Expiry</label>
            <input
              type="date"
              value={formData.workPermitExpiry?.toISOString().split('T')[0] || ''}
              onChange={(e) => handleInputChange('workPermitExpiry', e.target.value ? new Date(e.target.value) : undefined)}
              className={inputClasses}
            />
          </div>
        )}
      </div>
    </div>
  );
}