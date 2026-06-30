import { Chip } from '@mui/material';

type StatusTone = 'default' | 'success' | 'warning' | 'error' | 'info';

interface StatusChipProps {
  label: string;
  tone?: StatusTone;
}

export function StatusChip({ label, tone = 'default' }: StatusChipProps) {
  const color =
    tone === 'success' || tone === 'warning' || tone === 'error' || tone === 'info' ? tone : 'default';
  return <Chip size="small" label={label} color={color} variant={color === 'default' ? 'outlined' : 'filled'} />;
}
