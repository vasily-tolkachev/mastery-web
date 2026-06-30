import { Paper, Stack, Typography } from '@mui/material';
import { radius } from '../../theme/tokens';

interface InfoCardProps {
  label: string;
  value: string;
  hint?: string;
}

export function InfoCard({ label, value, hint }: InfoCardProps) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: radius.card }}>
      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          {value}
        </Typography>
        {hint ? (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}
