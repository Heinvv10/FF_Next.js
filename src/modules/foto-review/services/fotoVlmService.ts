/**
 * VLM (Vision Language Model) Integration Service
 * Connects to trained VLM at port 8100 for DR photo evaluation
 * Based on DR_PHOTO_VERIFICATION_FIBERTIME_ALIGNED.md specification
 */

import { EvaluationResult } from '../types';
import { log } from '@/lib/logger';
import fs from 'fs';
import path from 'path';

/**
 * VLM API configuration
 * Uses MiniCPM-V-2_6 via vLLM with OpenAI-compatible API
 */
const VLM_API_BASE = process.env.VLM_API_URL || 'http://100.96.203.105:8100';
const VLM_API_ENDPOINT = `${VLM_API_BASE}/v1/chat/completions`;
const VLM_MODEL = process.env.VLM_MODEL || 'openbmb/MiniCPM-V-2_6';
const VLM_TIMEOUT_MS = 180000; // 3 minutes for image processing

/**
 * Load QA evaluation steps from config file
 * This allows updating evaluation criteria without code changes
 */
function loadQASteps() {
  try {
    const configPath = path.join(process.cwd(), 'config', 'qa-evaluation-steps.json');
    const configData = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configData);

    log.info('VlmService', `Loaded ${config.steps.length} QA steps from config (version ${config.version})`);

    return config.steps;
  } catch (error) {
    log.error('VlmService', `Failed to load QA steps config: ${error}`);

    // Fallback to hardcoded steps if config file not found
    log.warn('VlmService', 'Using fallback hardcoded QA steps');
    return [
      {
        step_number: 1,
        step_name: 'house_photo',
        step_label: 'House Photo',
        criteria: 'Clear photo of the house.',
      },
      {
        step_number: 2,
        step_name: 'cable_span',
        step_label: 'Cable Span from Pole',
        criteria: 'Photo showing cable span from pole to house',
      },
      {
        step_number: 3,
        step_name: 'cable_entry_outside',
        step_label: 'Cable Entry Outside',
        criteria: 'Outside view of cable entry point into house',
      },
      {
        step_number: 4,
        step_name: 'cable_entry_inside',
        step_label: 'Cable Entry Inside',
        criteria: 'Inside view of cable entry, showing clean installation',
      },
      {
        step_number: 5,
        step_name: 'wall_installation',
        step_label: 'Wall for Installation',
        criteria: 'Photo of wall where ONT will be/is installed',
      },
      {
        step_number: 6,
        step_name: 'ont_back_and_barcode',
        step_label: 'ONT Back & Barcode',
        criteria: 'Back of ONT showing cable connections AND ONT barcode/serial number clearly visible and readable',
      },
      {
        step_number: 7,
        step_name: 'power_meter',
        step_label: 'Power Meter Reading',
        criteria: 'Clear photo of power meter showing reading',
      },
      {
        step_number: 8,
        step_name: 'ups_serial',
        step_label: 'UPS Serial Number',
        criteria: 'UPS serial number clearly visible and readable',
      },
      {
        step_number: 9,
        step_name: 'final_installation',
        step_label: 'Final Installation',
        criteria: 'Complete installation showing ONT and cables neatly installed',
      },
      {
        step_number: 10,
        step_name: 'ont_lights_and_dr_label',
        step_label: 'Green Lights & DR Label',
        criteria: 'ONT with green lights indicating successful connection AND DR number label clearly visible on device or nearby',
      },
    ];
  }
}

/**
 * QA Steps loaded from config file at module initialization
 * To update steps: edit config/qa-evaluation-steps.json and restart the application
 */
const QA_STEPS = loadQASteps();

/**
 * VLM API Error
 */
export class VlmEvaluationError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'VlmEvaluationError';
  }
}

/**
 * Fetch photo URLs for a DR from BOSS VPS API
 * @param drNumber - DR number (e.g., "DR1730550")
 * @returns Array of photo URLs (direct BOSS API URLs for Ollama to access)
 */
async function fetchDrPhotos(drNumber: string): Promise<string[]> {
  const BOSS_API_URL = process.env.BOSS_VPS_API_URL || 'http://72.61.197.178:8001';

  try {
    log.info('VlmService', `Fetching photos from BOSS API for ${drNumber}`);

    // Fetch all DRs from BOSS VPS API
    const response = await fetch(`${BOSS_API_URL}/api/photos`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`BOSS API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Find the specific DR
    const drData = data.drs?.find((dr: any) => dr.dr_number === drNumber);

    if (!drData || !drData.photos || drData.photos.length === 0) {
      throw new Error(`No photos found for DR ${drNumber} in BOSS API`);
    }

    // Return direct BOSS API URLs (Ollama can access these directly)
    const photoUrls = drData.photos.map((photo: any) =>
      `${BOSS_API_URL}/api/photo/${drNumber}/${photo.filename}`
    );

    log.info('VlmService', `Found ${photoUrls.length} photos for ${drNumber}`);

    return photoUrls;
  } catch (error) {
    log.error('VlmService', `Failed to fetch DR photos: ${error}`);
    throw new VlmEvaluationError(
      `Failed to fetch photos for ${drNumber}`,
      'FETCH_PHOTOS_ERROR',
      error
    );
  }
}

/**
 * Build evaluation prompt for a SINGLE step
 * VLM will look through photos and find the most relevant one for this step
 */
function buildStepEvaluationPrompt(drNumber: string, step: typeof QA_STEPS[0]): string {
  return `You are an expert fiber optic installation quality inspector evaluating drop record ${drNumber}.

EVALUATE ONLY THIS ONE STEP:

**Step ${step.step_number}: ${step.step_label}**
Criteria: ${step.criteria}

INSTRUCTIONS:
1. Look through ALL the provided photos
2. Find the photo(s) that best match this step
3. If you find a relevant photo, evaluate it against the criteria
4. If NO photo matches this step, return score=0 and comment="NO PHOTO FOUND for ${step.step_label}"

IMPORTANT: Only evaluate THIS ONE step. Ignore other aspects of the installation.

Respond in JSON format:
{
  "step_number": ${step.step_number},
  "step_name": "${step.step_name}",
  "step_label": "${step.step_label}",
  "passed": true/false,
  "score": <0-10>,
  "comment": "Brief explanation of what you found and why it passed/failed"
}`;
}

/**
 * Fetch image from URL and convert to base64
 * @param imageUrl - URL of the image
 * @returns Base64-encoded image string
 */
async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    return base64;
  } catch (error) {
    log.error('VlmService', `Failed to fetch/encode image ${imageUrl}: ${error}`);
    throw error;
  }
}

/**
 * Call VLM API to evaluate a single step with a batch of photos
 * @param drNumber - DR number to evaluate
 * @param step - QA step to evaluate
 * @param photoUrls - Array of photo URLs from BOSS API
 * @returns VLM evaluation response for this step
 */
async function callVlmApiForStep(drNumber: string, step: typeof QA_STEPS[0], photoUrls: string[]): Promise<any> {
  const prompt = buildStepEvaluationPrompt(drNumber, step);

  log.info('VlmService', `Fetching and encoding ${photoUrls.length} photos for ${drNumber}...`);

  // Fetch all images and convert to base64
  // Ollama requires base64-encoded images, not URLs
  const base64Images: string[] = [];

  for (let i = 0; i < photoUrls.length; i++) {
    try {
      log.debug('VlmService', `Fetching photo ${i + 1}/${photoUrls.length}: ${photoUrls[i]}`);
      const base64 = await fetchImageAsBase64(photoUrls[i]);
      base64Images.push(base64);
    } catch (error) {
      log.warn('VlmService', `Skipping photo ${i + 1} due to error: ${error}`);
      // Continue with other photos even if one fails
    }
  }

  if (base64Images.length === 0) {
    throw new VlmEvaluationError(
      'Failed to fetch any photos for evaluation',
      'NO_PHOTOS_FETCHED'
    );
  }

  log.info('VlmService', `Successfully encoded ${base64Images.length}/${photoUrls.length} photos`);

  // Build OpenAI-compatible API request with base64 images
  // MiniCPM-V-2_6 uses OpenAI format for vision models
  const requestBody = {
    model: VLM_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          // Add each base64 image as image_url content
          ...base64Images.map(base64 => ({
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64}`,
            },
          })),
        ],
      },
    ],
    max_tokens: 2000,
    temperature: 0.1, // Low temperature for consistent evaluation
  };

  log.info('VlmService', `Calling MiniCPM-V-2_6 VLM API for ${drNumber}...`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VLM_TIMEOUT_MS);

    const response = await fetch(VLM_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new VlmEvaluationError(
        `VLM API returned ${response.status}: ${errorText}`,
        `VLM_HTTP_${response.status}`,
        errorText
      );
    }

    const data = await response.json();
    log.info('VlmService', `VLM API response received for ${drNumber}`);

    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new VlmEvaluationError(
        'VLM API request timed out after 3 minutes',
        'VLM_TIMEOUT'
      );
    }

    if (error instanceof VlmEvaluationError) {
      throw error;
    }

    throw new VlmEvaluationError(
      `Failed to call VLM API: ${error.message}`,
      'VLM_API_ERROR',
      error
    );
  }
}

/**
 * Parse VLM API response for a single step evaluation
 * Returns the step result object
 */
function parseStepResponse(vlmResponse: any): any {
  try {
    // Extract content from OpenAI-compatible response format
    const content = vlmResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in VLM response');
    }

    log.debug('VlmService', `Raw VLM step response: ${content.substring(0, 200)}...`);

    // Parse JSON from content
    let stepData: any;

    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
                      content.match(/```\n([\s\S]*?)\n```/) ||
                      [null, content];

    try {
      stepData = JSON.parse(jsonMatch[1] || content);
    } catch (parseError) {
      log.error('VlmService', `Failed to parse VLM step JSON: ${content}`);
      throw new Error('VLM response is not valid JSON');
    }

    // Validate required fields for step
    if (typeof stepData.step_number === 'undefined' ||
        typeof stepData.passed === 'undefined' ||
        typeof stepData.score === 'undefined') {
      throw new Error('Missing required fields in step response');
    }

    return {
      step_number: stepData.step_number,
      step_name: stepData.step_name,
      step_label: stepData.step_label,
      passed: Boolean(stepData.passed),
      score: Number(stepData.score) || 0,
      comment: stepData.comment || 'No comment provided',
    };
  } catch (error) {
    log.error('VlmService', `Failed to parse VLM step response: ${error}`);
    throw new VlmEvaluationError(
      `Failed to parse VLM step response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PARSE_ERROR',
      error
    );
  }
}

/**
 * Execute VLM evaluation for a DR - Step-by-step approach
 * Evaluates ONE step at a time across ALL photo batches
 * Takes the BEST result for each step (fixes the 30-step duplication issue)
 *
 * @param drNumber - DR number to evaluate (e.g., "DR1730550")
 * @returns Evaluation results with 10 steps (not 30!)
 */
export async function executeVlmEvaluation(
  drNumber: string
): Promise<EvaluationResult> {
  log.info('VlmService', `Starting step-by-step VLM evaluation for ${drNumber}`);

  try {
    // Step 1: Fetch DR photos
    const photoUrls = await fetchDrPhotos(drNumber);
    log.info('VlmService', `Fetched ${photoUrls.length} photos for ${drNumber}`);

    // Step 2: Batch photos to stay within context limits
    // Qwen3-VL-8B-Instruct has 16K token limit, images + prompt = ~2500 tokens per photo
    // Process 6 photos at a time to stay under 16384 (6 * 2500 + prompt ~= 15500)
    const BATCH_SIZE = 6;
    const batches: string[][] = [];

    for (let i = 0; i < photoUrls.length; i += BATCH_SIZE) {
      batches.push(photoUrls.slice(i, i + BATCH_SIZE));
    }

    log.info('VlmService', `Split ${photoUrls.length} photos into ${batches.length} batches of ${BATCH_SIZE}`);

    // Step 3: Evaluate EACH QA step across ALL photo batches
    const finalStepResults = [];
    const totalStartTime = Date.now();

    for (const qaStep of QA_STEPS) {
      log.info('VlmService', `Evaluating Step ${qaStep.step_number}: ${qaStep.step_label}`);

      const stepBatchResults = [];

      // Evaluate this step against each batch of photos
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const batchNum = batchIndex + 1;

        log.info('VlmService', `  Step ${qaStep.step_number} - Batch ${batchNum}/${batches.length} (${batch.length} photos)`);

        try {
          const vlmResponse = await callVlmApiForStep(drNumber, qaStep, batch);
          const stepResult = parseStepResponse(vlmResponse);
          stepBatchResults.push(stepResult);

          log.info('VlmService', `  Step ${qaStep.step_number} - Batch ${batchNum}: Score ${stepResult.score}/10`);
        } catch (error) {
          log.error('VlmService', `  Step ${qaStep.step_number} - Batch ${batchNum} failed: ${error}`);
          // Add failed result (score = 0)
          stepBatchResults.push({
            step_number: qaStep.step_number,
            step_name: qaStep.step_name,
            step_label: qaStep.step_label,
            passed: false,
            score: 0,
            comment: `Batch ${batchNum} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      }

      // Take the BEST result for this step across all batches
      const bestResult = stepBatchResults.reduce((best, current) =>
        current.score > best.score ? current : best
      );

      log.info('VlmService', `✓ Step ${qaStep.step_number} BEST: ${bestResult.score}/10 - ${bestResult.passed ? 'PASS' : 'FAIL'}`);

      finalStepResults.push(bestResult);
    }

    const totalTime = Date.now() - totalStartTime;
    log.info('VlmService', `All ${QA_STEPS.length} steps evaluated in ${totalTime}ms`);

    // Step 4: Aggregate final results
    const passedCount = finalStepResults.filter(s => s.passed).length;
    const avgScore = finalStepResults.reduce((sum, s) => sum + s.score, 0) / finalStepResults.length;
    const passRate = passedCount / finalStepResults.length;
    const overallStatus = passRate >= 0.7 ? 'PASS' : 'FAIL';

    const result: EvaluationResult = {
      dr_number: drNumber,
      overall_status: overallStatus,
      average_score: Math.round(avgScore * 10) / 10,
      total_steps: QA_STEPS.length,
      passed_steps: passedCount,
      step_results: finalStepResults,
      feedback_sent: false,
      evaluation_date: new Date(),
      markdown_report: `Evaluation for ${drNumber}: ${passedCount}/${QA_STEPS.length} steps passed (${Math.round(passRate * 100)}%)`,
    };

    log.info('VlmService', `✅ VLM evaluation completed: ${overallStatus} (${passedCount}/${QA_STEPS.length} passed)`);

    return result;
  } catch (error) {
    log.error('VlmService', `VLM evaluation failed for ${drNumber}: ${error}`);

    if (error instanceof VlmEvaluationError) {
      throw error;
    }

    throw new VlmEvaluationError(
      `VLM evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'EVALUATION_ERROR',
      error
    );
  }
}

/**
 * Check VLM service health (vLLM with MiniCPM-V-2_6)
 * @returns true if vLLM is reachable and has the MiniCPM-V-2_6 model
 */
export async function checkVlmHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${VLM_API_BASE}/v1/models`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    const hasModel = data.data?.some((m: any) => m.id === 'openbmb/MiniCPM-V-2_6');

    if (!hasModel) {
      log.warn('VlmService', `MiniCPM-V-2_6 model not found in vLLM`);
    }

    return hasModel;
  } catch (error) {
    log.error('VlmService', `VLM health check failed: ${error}`);
    return false;
  }
}
