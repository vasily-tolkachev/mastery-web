import { LinearProgress, Paper, Stack, Typography } from '@mui/material';
import { radius } from '../../theme/tokens';

interface ProgressCardProps {
  title: string;
  current: number | null;
  total: number | null;
}

export function ProgressCard({ title, current, total }: ProgressCardProps) {
  const safeCurrent = current ?? 0;
  const safeTotal = total ?? 0;
  const progress = safeTotal > 0 ? Math.round((safeCurrent / safeTotal) * 100) : 0;

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: radius.card }}>
      <Stack spacing={1}>
        <Typography variant="subtitle2">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {safeCurrent}/{safeTotal}
        </Typography>
        <LinearProgress variant="determinate" value={progress} />
      </Stack>
    </Paper>
  );
}
