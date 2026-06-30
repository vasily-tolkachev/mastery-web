import { Alert } from '@mui/material';

interface ErrorStateProps {
  message: string;
}

export function ErrorState({ message }: ErrorStateProps) {
  return <Alert severity="error">{message}</Alert>;
}
