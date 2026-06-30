import { Alert } from '@mui/material';

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return <Alert severity="info">{message}</Alert>;
}
