// ============= Tab Panel Helper Component =============

import { Box } from '@mui/material';
import type { TabPanelProps } from '../types/types';

export function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}
