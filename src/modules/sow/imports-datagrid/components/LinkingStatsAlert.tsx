// ============= Linking Stats Alert Component =============

import { Paper, Typography } from '@mui/material';
import { Link } from 'lucide-react';
import type { LinkingStats } from '../types/types';

interface LinkingStatsAlertProps {
  stats: LinkingStats | null;
}

export function LinkingStatsAlert({ stats }: LinkingStatsAlertProps) {
  if (!stats) return null;

  return (
    <Paper className="p-4 mb-4 bg-blue-50 border-l-4 border-blue-500">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h6" color="primary">
            SOW Linking Status
          </Typography>
          <Typography variant="body2" className="mt-1">
            {stats.linked} of {stats.total} OneMap records linked ({stats.linkingRate}%)
            {stats.matchTypes && (
              <span className="ml-2">
                | Exact: {stats.matchTypes.exact || 0}
                | Normalized: {stats.matchTypes.normalized || 0}
                | Proximity: {stats.matchTypes.proximity || 0}
              </span>
            )}
          </Typography>
        </div>
        <Link className="h-8 w-8 text-blue-500" />
      </div>
    </Paper>
  );
}
