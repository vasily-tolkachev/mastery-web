import { Box, Paper, Typography } from '@mui/material';
import type { PropsWithChildren, ReactNode } from 'react';
import { radius } from '../../theme/tokens';

interface SectionCardProps extends PropsWithChildren {
  title?: string;
  action?: ReactNode;
}

export function SectionCard({ title, action, children }: SectionCardProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: radius.card }}>
      {title ? (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h6">{title}</Typography>
          {action ? <Box>{action}</Box> : null}
        </Box>
      ) : null}
      {children}
    </Paper>
  );
}
