import { Button } from '@mui/material';
import type { ButtonProps } from '@mui/material';

export function ActionButton(props: ButtonProps) {
  return <Button variant="contained" {...props} />;
}
