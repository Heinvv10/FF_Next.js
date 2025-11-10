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
import { CheckCircle, XCircle, Send, Save, AlertTriangle, Edit2, X } from 'lucide-react';
import type { QaReviewDrop, QaSteps } from '../types/wa-monitor.types';
import { QA_STEP_LABELS } from '../types/wa-monitor.types';
import { DropStatusBadge } from './DropStatusBadge';
import { formatDateTime } from '../utils/waMonitorHelpers';

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

  // Sync local state with props when drop data changes (e.g., after refresh)
  // This ensures the component shows the latest saved values from the database
  useEffect(() => {
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
  }, [drop]);

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

  // Handle save (update DB)
  const handleSave = async () => {
    try {
      setSaving(true);
      await onUpdate(drop.id, {
        ...steps,
        comment,
        incomplete: completedSteps < totalSteps,
        completed: completedSteps === totalSteps,
      });
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
      setFeedbackMessage(`${editedDropNumber}: All items complete! ✅`);
      return;
    }

    const message = `${editedDropNumber}: Missing ${missing.join(', ')}`;
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
        <Button
          variant="contained"
          color="success"
          size="small"
          startIcon={<Save size={16} />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardActions>
    </Card>
  );
});
