import type { NextApiRequest, NextApiResponse } from 'next';
import { apiResponse } from './apiResponse';

export function withErrorHandler(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);
      apiResponse.internalError(res, error);
    }
  };
}