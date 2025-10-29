import type { NextApiRequest, NextApiResponse } from 'next';
import { neonContractorService } from '@/services/contractor/neonContractorService';
import { apiResponse } from '@/lib/apiResponse';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.body;
  if (!id || typeof id !== 'string') {
    return apiResponse.validationError(res, { id: 'Contractor ID required in body' });
  }

  try {
    const existing = await neonContractorService.getContractorById(id);
    if (!existing) {
      return apiResponse.notFound(res, 'Contractor', id);
    }

    await neonContractorService.deleteContractor(id);
    return apiResponse.success(res, { id }, 'Contractor deleted successfully');
  } catch (error) {
    return apiResponse.internalError(res, error);
  }
}
