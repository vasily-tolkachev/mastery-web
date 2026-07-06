import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { EmptyState, PageHeader, SectionCard } from '../components/ui';

export function SettingsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Stack spacing={2}>
      <PageHeader title="Settings" subtitle="Application preferences and profile." />
      <SectionCard title="Preferences">
        <EmptyState message="Settings page scaffold is ready." />
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button variant="outlined" color="inherit" startIcon={<LogoutRoundedIcon fontSize="small" />} onClick={handleLogout}>
            Logout
          </Button>
        </Stack>
      </SectionCard>
    </Stack>
  );
}
