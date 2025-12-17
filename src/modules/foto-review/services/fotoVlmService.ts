/**
 * VLM (Vision Language Model) Integration Service
 * Connects to trained VLM at port 8100 for DR photo evaluation
 * Based on DR_PHOTO_VERIFICATION_FIBERTIME_ALIGNED.md specification
 */

import { EvaluationResult } from '../types';
import { log } from '@/lib/logger';

/**
 * VLM API configuration
 * Uses MiniCPM-V-2_6 via vLLM with OpenAI-compatible API
 */
const VLM_API_BASE = process.env.VLM_API_URL || 'http://100.96.203.105:8100';
const VLM_API_ENDPOINT = `${VLM_API_BASE}/v1/chat/completions`;
const VLM_MODEL = process.env.VLM_MODEL || 'openbmb/MiniCPM-V-2_6';
const VLM_TIMEOUT_MS = 180000; // 3 minutes for image processing

/**
 * 11 QA Steps from DR Photo Verification Manual
 * Each step has specific validation criteria
 */
const QA_STEPS = [
  {
    step_number: 1,
    step_name: 'house_photo',
    step_label: 'House Photo',
    criteria: 'Clear photo of the house with visible address/street number',
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
    step_name: 'ont_back',
    step_label: 'ONT Back After Install',
    criteria: 'Back of ONT showing cable connections',
  },
  {
    step_number: 7,
    step_name: 'power_meter',
    step_label: 'Power Meter Reading',
    criteria: 'Clear photo of power meter showing reading',
  },
  {
    step_number: 8,
    step_name: 'ont_barcode',
    step_label: 'ONT Barcode',
    criteria: 'ONT barcode/serial number clearly visible and readable',
  },
  {
    step_number: 9,
    step_name: 'ups_serial',
    step_label: 'UPS Serial Number',
    criteria: 'UPS serial number clearly visible and readable',
  },
  {
    step_number: 10,
    step_name: 'final_installation',
    step_label: 'Final Installation',
    criteria: 'Complete installation showing ONT and cables neatly installed',
  },
  {
    step_number: 11,
    step_name: 'ont_lights',
    step_label: 'Green Lights on ONT',
    criteria: 'ONT with green lights indicating successful connection',
  },
];

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
  return `You are an expert fiber optic installation quality inspector. Evaluate the installation photos for drop record ${drNumber} according to these 11 quality assurance steps:

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
  "total_steps": 11,
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
 * Execute VLM evaluation for a DR
 * Main entry point - fetches photos, calls VLM, parses results
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

    // Step 2: Call VLM API
    const vlmResponse = await callVlmApi(drNumber, photoUrls);

    // Step 3: Parse response into our format
    const evaluation = parseVlmResponse(drNumber, vlmResponse);

    log.info('VlmService', `VLM evaluation completed for ${drNumber}: ${evaluation.overall_status}`);

    return evaluation;
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
