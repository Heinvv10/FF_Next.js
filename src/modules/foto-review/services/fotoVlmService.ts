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
 * Build evaluation prompt for VLM
 * Creates structured prompt based on QA steps
 */
function buildEvaluationPrompt(drNumber: string): string {
  return `You are an expert fiber optic installation quality inspector. Evaluate the installation photos for drop record ${drNumber} according to these ${QA_STEPS.length} quality assurance steps:

${QA_STEPS.map((step, index) =>
  `${index + 1}. **${step.step_label}**: ${step.criteria}`
).join('\n')}

For each step, provide:
1. **Pass/Fail status**: Does the photo meet the criteria?
2. **Score** (0-10): Quality rating for this step
3. **Comment**: Brief explanation of issues or confirmation of quality

Respond in JSON format:
{
  "overall_status": "PASS" or "FAIL",
  "overall_score": <average score>,
  "total_steps": ${QA_STEPS.length},
  "passed_steps": <count>,
  "step_results": [
    {
      "step_number": 1,
      "step_name": "house_photo",
      "passed": true/false,
      "score": <0-10>,
      "comment": "..."
    },
    ...
  ],
  "summary": "Overall assessment and recommendations"
}

Analyze all provided photos and evaluate against each QA step.`;
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
 * Call VLM API with photos and evaluation prompt
 * @param drNumber - DR number to evaluate
 * @param photoUrls - Array of photo URLs from BOSS API
 * @returns VLM evaluation response
 */
async function callVlmApi(drNumber: string, photoUrls: string[]): Promise<any> {
  const prompt = buildEvaluationPrompt(drNumber);

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
 * Parse VLM API response into EvaluationResult
 */
function parseVlmResponse(drNumber: string, vlmResponse: any): EvaluationResult {
  try {
    // Extract content from OpenAI-compatible response format
    const content = vlmResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in VLM response');
    }

    log.debug('VlmService', `Raw VLM response: ${content.substring(0, 200)}...`);

    // Parse JSON from content (VLM should return JSON as instructed in prompt)
    let evaluationData: any;

    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
                      content.match(/```\n([\s\S]*?)\n```/) ||
                      [null, content];

    try {
      evaluationData = JSON.parse(jsonMatch[1] || content);
    } catch (parseError) {
      log.error('VlmService', `Failed to parse VLM JSON: ${content}`);
      throw new Error('VLM response is not valid JSON');
    }

    // Validate required fields
    if (!evaluationData.step_results || !Array.isArray(evaluationData.step_results)) {
      throw new Error('Missing or invalid step_results in VLM response');
    }

    // Map VLM response to our EvaluationResult format
    const stepResults = evaluationData.step_results.map((step: any) => {
      const qaStep = QA_STEPS.find(s => s.step_number === step.step_number);

      return {
        step_number: step.step_number,
        step_name: step.step_name || qaStep?.step_name || `step_${step.step_number}`,
        step_label: qaStep?.step_label || step.step_name || `Step ${step.step_number}`,
        passed: Boolean(step.passed),
        score: Number(step.score) || 0,
        comment: step.comment || 'No comment provided',
      };
    });

    return {
      dr_number: drNumber,
      overall_status: evaluationData.overall_status === 'PASS' ? 'PASS' : 'FAIL',
      average_score: Number(evaluationData.overall_score) || 0,
      total_steps: evaluationData.total_steps || QA_STEPS.length,
      passed_steps: evaluationData.passed_steps || 0,
      step_results: stepResults,
      feedback_sent: false,
      evaluation_date: new Date(),
      markdown_report: evaluationData.summary,
    };
  } catch (error) {
    log.error('VlmService', `Failed to parse VLM response: ${error}`);
    throw new VlmEvaluationError(
      `Failed to parse VLM response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PARSE_ERROR',
      error
    );
  }
}

/**
 * Execute VLM evaluation for a DR with batching to handle context limits
 * Main entry point - fetches photos, calls VLM in batches, merges results
 *
 * @param drNumber - DR number to evaluate (e.g., "DR1730550")
 * @returns Evaluation results
 */
export async function executeVlmEvaluation(
  drNumber: string
): Promise<EvaluationResult> {
  log.info('VlmService', `Starting VLM evaluation for ${drNumber}`);

  try {
    // Step 1: Fetch DR photos
    const photoUrls = await fetchDrPhotos(drNumber);
    log.info('VlmService', `Fetched ${photoUrls.length} photos for ${drNumber}`);

    // Step 2: Batch photos to stay within context limits
    // Qwen3-VL-8B-Instruct has 16K token limit, images + prompt = ~2500 tokens per photo
    // Process 6 photos at a time to stay under 16384 (6 * 2500 + prompt ~= 15500)
    // 32 photos ÷ 6 = ~6 batches (much faster than previous 11-16 batches)
    const BATCH_SIZE = 6;
    const batches: string[][] = [];

    for (let i = 0; i < photoUrls.length; i += BATCH_SIZE) {
      batches.push(photoUrls.slice(i, i + BATCH_SIZE));
    }

    log.info('VlmService', `Processing ${batches.length} batches in parallel`);

    // Step 3: Evaluate all batches in parallel (4x faster!)
    const batchStartTime = Date.now();

    const batchPromises = batches.map(async (batch, index) => {
      const batchNum = index + 1;
      const batchStart = Date.now();

      log.info('VlmService', `Starting batch ${batchNum}/${batches.length} (${batch.length} photos)`);

      try {
        const vlmResponse = await callVlmApi(drNumber, batch);
        const evaluation = parseVlmResponse(drNumber, vlmResponse);

        const batchTime = Date.now() - batchStart;
        log.info('VlmService', `Batch ${batchNum} completed in ${batchTime}ms`);

        return evaluation;
      } catch (error) {
        const batchTime = Date.now() - batchStart;
        log.error('VlmService', `Batch ${batchNum} failed after ${batchTime}ms: ${error}`);

        // Return partial evaluation for failed batch (don't fail entire evaluation)
        return {
          dr_number: drNumber,
          overall_status: 'FAIL' as const,
          average_score: 0,
          total_steps: batch.length,
          passed_steps: 0,
          step_results: batch.map((_, i) => ({
            step_number: i + 1,
            step_name: `batch_${batchNum}_photo_${i + 1}`,
            step_label: `Batch ${batchNum} Photo ${i + 1}`,
            passed: false,
            score: 0,
            comment: `Failed to evaluate: ${error instanceof Error ? error.message : 'Unknown error'}`,
          })),
          feedback_sent: false,
          evaluation_date: new Date(),
          markdown_report: `Batch ${batchNum} failed: ${error}`,
        };
      }
    });

    // Wait for all batches to complete
    const batchEvaluations = await Promise.all(batchPromises);

    const totalBatchTime = Date.now() - batchStartTime;
    log.info('VlmService', `All ${batches.length} batches completed in ${totalBatchTime}ms (parallel)`);

    // Step 4: Merge batch results
    const mergedEvaluation = mergeBatchEvaluations(drNumber, batchEvaluations);

    log.info('VlmService', `VLM evaluation completed for ${drNumber}: ${mergedEvaluation.overall_status}`);

    return mergedEvaluation;
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
 * Merge multiple batch evaluation results into a single result
 * @param drNumber - DR number
 * @param batchEvaluations - Array of batch evaluation results
 * @returns Merged evaluation result
 */
function mergeBatchEvaluations(
  drNumber: string,
  batchEvaluations: EvaluationResult[]
): EvaluationResult {
  if (batchEvaluations.length === 1) {
    return batchEvaluations[0];
  }

  // Merge step results from all batches
  const allSteps = batchEvaluations.flatMap(e => e.step_results);

  // Count passed steps
  const passedCount = allSteps.filter(s => s.passed).length;

  // Calculate average score
  const avgScore = allSteps.reduce((sum, s) => sum + s.score, 0) / allSteps.length;

  // Determine overall status
  const passRate = passedCount / allSteps.length;
  const overallStatus = passRate >= 0.7 ? 'PASS' : 'FAIL';

  // Combine feedback
  const feedback = batchEvaluations
    .map(e => e.markdown_report)
    .filter(Boolean)
    .join('\n\n---\n\n');

  return {
    dr_number: drNumber,
    overall_status: overallStatus,
    average_score: Math.round(avgScore * 10) / 10,
    total_steps: allSteps.length,
    passed_steps: passedCount,
    step_results: allSteps,
    feedback_sent: false,
    evaluation_date: new Date(),
    markdown_report: feedback,
  };
}

/**
 * Check VLM service health
 * @returns true if VLM is reachable and healthy
 */
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
