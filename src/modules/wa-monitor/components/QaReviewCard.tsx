/**
 * QA Review Card Component
 * Individual card for reviewing a drop with 14 QA checkboxes
 * Allows QA reviewers to check/uncheck steps, add comments, and mark status
 */

'use client';

import { useState, useEffect, memo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextField,
  Button,
  Chip,
  Box,
  Typography,
  Divider,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import { CheckCircle, XCircle, Send, Save, AlertTriangle, Edit2, X, Edit, Lock } from 'lucide-react';
import type { QaReviewDrop, QaSteps } from '../types/wa-monitor.types';
import { QA_STEP_LABELS } from '../types/wa-monitor.types';
import { DropStatusBadge } from './DropStatusBadge';
import { formatDateTime } from '../utils/waMonitorHelpers';
import { lockDrop, unlockDrop } from '../services/waMonitorApiService';

interface QaReviewCardProps {
  drop: QaReviewDrop;
  onUpdate: (dropId: string, updates: Partial<QaReviewDrop>) => Promise<void>;
  onSendFeedback: (dropId: string, dropNumber: string, message: string, project?: string) => Promise<void>;
}

export const QaReviewCard = memo(function QaReviewCard({ drop, onUpdate, onSendFeedback }: QaReviewCardProps) {
  const [steps, setSteps] = useState<QaSteps>({
    step_01_house_photo: drop.step_01_house_photo,
    step_02_cable_from_pole: drop.step_02_cable_from_pole,
    step_03_cable_entry_outside: drop.step_03_cable_entry_outside,
    step_04_cable_entry_inside: drop.step_04_cable_entry_inside,
    step_05_wall_for_installation: drop.step_05_wall_for_installation,
    step_06_ont_back_after_install: drop.step_06_ont_back_after_install,
    step_07_power_meter_reading: drop.step_07_power_meter_reading,
    step_08_ont_barcode: drop.step_08_ont_barcode,
    step_09_ups_serial: drop.step_09_ups_serial,
    step_10_final_installation: drop.step_10_final_installation,
    step_11_green_lights: drop.step_11_green_lights,
    step_12_customer_signature: drop.step_12_customer_signature,
  });

  const [comment, setComment] = useState(drop.comment || '');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [isEditingDropNumber, setIsEditingDropNumber] = useState(false);
  const [editedDropNumber, setEditedDropNumber] = useState(drop.dropNumber);

  // Locking system state
  const [isEditing, setIsEditing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [currentUser] = useState('Louis Duplessis'); // TODO: Get from Clerk auth

  // Sync local state with props when drop data changes (e.g., after refresh)
  // Only sync if NOT editing (prevents overwriting active changes)
  useEffect(() => {
    if (isEditing) {
      // Don't overwrite user's active changes during auto-refresh
      return;
    }

    setSteps({
      step_01_house_photo: drop.step_01_house_photo,
      step_02_cable_from_pole: drop.step_02_cable_from_pole,
      step_03_cable_entry_outside: drop.step_03_cable_entry_outside,
      step_04_cable_entry_inside: drop.step_04_cable_entry_inside,
      step_05_wall_for_installation: drop.step_05_wall_for_installation,
      step_06_ont_back_after_install: drop.step_06_ont_back_after_install,
      step_07_power_meter_reading: drop.step_07_power_meter_reading,
      step_08_ont_barcode: drop.step_08_ont_barcode,
      step_09_ups_serial: drop.step_09_ups_serial,
      step_10_final_installation: drop.step_10_final_installation,
      step_11_green_lights: drop.step_11_green_lights,
      step_12_customer_signature: drop.step_12_customer_signature,
    });
    setComment(drop.comment || '');
    setEditedDropNumber(drop.dropNumber);
  }, [drop, isEditing]);

  // Check if drop is locked by someone else
  useEffect(() => {
    if (drop.lockedBy && drop.lockedBy !== currentUser) {
      setIsLocked(true);
      setLockError(`Currently being edited by ${drop.lockedBy}`);
    } else if (drop.lockedBy === currentUser) {
      // We have the lock
      setIsLocked(true);
      setIsEditing(true);
    } else {
      setIsLocked(false);
      setLockError(null);
    }
  }, [drop.lockedBy, currentUser]);

  // Cleanup: unlock on unmount if editing
  useEffect(() => {
    return () => {
      if (isEditing) {
        unlockDrop(drop.id, currentUser).catch(console.error);
      }
    };
  }, [isEditing, drop.id, currentUser]);

  // Calculate progress
  const completedSteps = Object.values(steps).filter(Boolean).length;
  const totalSteps = Object.keys(steps).length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  // Get missing steps for feedback
  const getMissingSteps = (): string[] => {
    return (Object.keys(steps) as Array<keyof QaSteps>)
      .filter((key) => !steps[key])
      .map((key) => QA_STEP_LABELS[key]);
  };

  // Handle checkbox change
  const handleStepChange = (stepKey: keyof QaSteps) => {
    setSteps((prev) => ({
      ...prev,
      [stepKey]: !prev[stepKey],
    }));
  };

  // Handle Edit button - acquire lock
  const handleEdit = async () => {
    try {
      setSaving(true);
      const result = await lockDrop(drop.id, currentUser);

      if (!result.locked) {
        // Someone else has the lock
        setLockError(result.error || 'Drop is locked by another user');
        setIsLocked(true);
        return;
      }

      // Lock acquired - enable editing
      setIsEditing(true);
      setIsLocked(true);
      setLockError(null);
    } catch (error) {
      console.error('Error acquiring lock:', error);
      setLockError('Failed to acquire lock');
    } finally {
      setSaving(false);
    }
  };

  // Handle Cancel button - revert changes and unlock
  const handleCancel = async () => {
    try {
      setSaving(true);

      // Revert all changes
      setSteps({
        step_01_house_photo: drop.step_01_house_photo,
        step_02_cable_from_pole: drop.step_02_cable_from_pole,
        step_03_cable_entry_outside: drop.step_03_cable_entry_outside,
        step_04_cable_entry_inside: drop.step_04_cable_entry_inside,
        step_05_wall_for_installation: drop.step_05_wall_for_installation,
        step_06_ont_back_after_install: drop.step_06_ont_back_after_install,
        step_07_power_meter_reading: drop.step_07_power_meter_reading,
        step_08_ont_barcode: drop.step_08_ont_barcode,
        step_09_ups_serial: drop.step_09_ups_serial,
        step_10_final_installation: drop.step_10_final_installation,
        step_11_green_lights: drop.step_11_green_lights,
        step_12_customer_signature: drop.step_12_customer_signature,
      });
      setComment(drop.comment || '');

      // Unlock the drop
      await unlockDrop(drop.id, currentUser);

      // Exit edit mode
      setIsEditing(false);
      setIsLocked(false);
      setLockError(null);
    } catch (error) {
      console.error('Error canceling:', error);
    } finally {
      setSaving(false);
    }
  };

  // Handle save (update DB and unlock)
  const handleSave = async () => {
    try {
      setSaving(true);

      // Save changes to database
      await onUpdate(drop.id, {
        ...steps,
        comment,
        incomplete: completedSteps < totalSteps,
        completed: completedSteps === totalSteps,
      });

      // Unlock the drop
      await unlockDrop(drop.id, currentUser);

      // Exit edit mode
      setIsEditing(false);
      setIsLocked(false);
      setLockError(null);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  // Handle mark as incomplete and send feedback
  const handleSendFeedback = async () => {
    if (!feedbackMessage.trim()) {
      return;
    }

    try {
      setSending(true);
      // Send feedback with project info (defaults to Velo Test for testing)
      // Use editedDropNumber in case it was changed
      await onSendFeedback(drop.id, editedDropNumber, feedbackMessage, drop.project || undefined);
      setFeedbackMessage('');
    } catch (error) {
      console.error('Error sending feedback:', error);
      alert(`Failed to send feedback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  // Generate auto-feedback based on missing steps
  const handleGenerateAutoFeedback = () => {
    const missing = getMissingSteps();
    if (missing.length === 0) {
      // All steps complete - generate approval message with drop number
      setFeedbackMessage(`${editedDropNumber} - All items complete! ✅`);
      return;
    }

    // Some steps missing - generate feedback with drop number
    const message = `${editedDropNumber} - Missing: ${missing.join(', ')}`;
    setFeedbackMessage(message);
  };

  // Handle drop number edit
  const handleSaveDropNumber = async () => {
    if (!editedDropNumber.trim()) {
      alert('Drop number cannot be empty');
      return;
    }

    try {
      setSaving(true);
      await onUpdate(drop.id, { dropNumber: editedDropNumber.trim() });
      setIsEditingDropNumber(false);
    } catch (error) {
      console.error('Error saving drop number:', error);
      alert('Failed to save drop number');
      // Revert to original value
      setEditedDropNumber(drop.dropNumber);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEditDropNumber = () => {
    setEditedDropNumber(drop.dropNumber);
    setIsEditingDropNumber(false);
  };

  return (
    <Card sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              {isEditingDropNumber ? (
                <>
                  <TextField
                    value={editedDropNumber}
                    onChange={(e) => setEditedDropNumber(e.target.value)}
                    size="small"
                    variant="outlined"
                    sx={{ width: '200px' }}
                    autoFocus
                  />
                  <Tooltip title="Save">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={handleSaveDropNumber}
                      disabled={saving}
                    >
                      <Save size={16} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cancel">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={handleCancelEditDropNumber}
                      disabled={saving}
                    >
                      <X size={16} />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                <>
                  <Typography variant="h6" fontWeight="bold">
                    {editedDropNumber}
                  </Typography>
                  <Tooltip title="Edit drop number">
                    <IconButton
                      size="small"
                      onClick={() => setIsEditingDropNumber(true)}
                      sx={{ ml: 0.5 }}
                    >
                      <Edit2 size={16} />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              {drop.resubmitted && (
                <Chip
                  label="🔄 Resubmitted"
                  color="info"
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              )}
              <Chip
                label={`${completedSteps}/${totalSteps} Complete`}
                color={progressPercent === 100 ? 'success' : 'warning'}
                size="small"
              />
              <DropStatusBadge status={drop.status} size="sm" />
            </Box>
          </Box>
        }
        subheader={
          <Box mt={1}>
            <Typography variant="caption" color="textSecondary">
              Project: {drop.project || 'Unknown'} • Agent: {drop.userName} • Created: {formatDateTime(drop.createdAt)}
            </Typography>
          </Box>
        }
      />

      <CardContent>
        {/* Lock Status Alerts */}
        {lockError && !isEditing && (
          <Alert severity="warning" icon={<Lock size={20} />} sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="medium">
              🔒 {lockError}
            </Typography>
          </Alert>
        )}

        {isEditing && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              ✏️ Editing mode active - Auto-refresh disabled for this drop
            </Typography>
          </Alert>
        )}

        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" fontWeight="medium">
              QA Progress: {progressPercent}%
            </Typography>
          </Box>
          <Box
            sx={{
              width: '100%',
              height: 8,
              bgcolor: '#e0e0e0',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                width: `${progressPercent}%`,
                height: '100%',
                bgcolor: progressPercent === 100 ? '#4caf50' : '#ff9800',
                transition: 'width 0.3s ease',
              }}
            />
          </Box>
        </Box>

        {/* QA Checklist - 12 Steps (WA Monitor) */}
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Installation QA Checklist (12 Photos)
        </Typography>
        <FormGroup sx={{ pl: 1 }}>
          {(Object.keys(steps) as Array<keyof QaSteps>).map((stepKey) => (
            <FormControlLabel
              key={stepKey}
              control={
                <Checkbox
                  checked={steps[stepKey]}
                  onChange={() => handleStepChange(stepKey)}
                  size="small"
                  disabled={!isEditing}
                />
              }
              label={
                <Typography variant="body2" color={steps[stepKey] ? 'success.main' : 'text.secondary'}>
                  {QA_STEP_LABELS[stepKey]}
                </Typography>
              }
            />
          ))}
        </FormGroup>

        <Divider sx={{ my: 2 }} />

        {/* Comments Section */}
        <TextField
          fullWidth
          multiline
          rows={2}
          label="QA Comments"
          placeholder="Add notes about this review..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          size="small"
          sx={{ mb: 2 }}
        />

        {/* Feedback Section */}
        {completedSteps < totalSteps && (
          <Alert severity="warning" icon={<AlertTriangle size={20} />} sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="medium">
              {getMissingSteps().length} items missing
            </Typography>
          </Alert>
        )}

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Feedback Message to Agent"
          placeholder="Type your feedback message here..."
          value={feedbackMessage}
          onChange={(e) => setFeedbackMessage(e.target.value)}
          size="small"
        />
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleGenerateAutoFeedback}
            disabled={saving || sending}
          >
            Auto-Generate
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<Send size={16} />}
            onClick={handleSendFeedback}
            disabled={!feedbackMessage.trim() || sending}
          >
            {sending ? 'Sending...' : 'Send Feedback'}
          </Button>
        </Box>

        {/* Edit/Save/Cancel buttons */}
        <Box display="flex" gap={1}>
          {!isEditing ? (
            // Read-only mode - show Edit button
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<Edit size={16} />}
              onClick={handleEdit}
              disabled={isLocked && drop.lockedBy !== currentUser}
            >
              Edit
            </Button>
          ) : (
            // Edit mode - show Save and Cancel
            <>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<X size={16} />}
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<Save size={16} />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </Box>
      </CardActions>
    </Card>
  );
});
