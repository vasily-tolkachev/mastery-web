import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ActionButton, PageHeader, SectionCard } from '../components/ui';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';

export function SettingsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const profileQuery = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const [displayName, setDisplayName] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    if (profileQuery.data?.displayName) {
      setDisplayName(profileQuery.data.displayName);
    }
  }, [profileQuery.data?.displayName]);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;
    await updateProfileMutation.mutateAsync({ displayName: displayName.trim() });
  };

  return (
    <Stack spacing={2}>
      <PageHeader title="Settings" subtitle="Application preferences and profile." />
      <SectionCard title="Preferences">
        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Profile</Typography>
          {profileQuery.error ? (
            <Alert severity="error">
              {profileQuery.error instanceof Error ? profileQuery.error.message : 'Failed to load profile'}
            </Alert>
          ) : null}
          {updateProfileMutation.error ? (
            <Alert severity="error">
              {updateProfileMutation.error instanceof Error ? updateProfileMutation.error.message : 'Failed to update profile'}
            </Alert>
          ) : null}
          {updateProfileMutation.isSuccess ? (
            <Alert severity="success">Profile updated.</Alert>
          ) : null}
          <TextField
            label="Display name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Learner"
            disabled={profileQuery.isLoading || updateProfileMutation.isPending}
          />
          <TextField
            label="Profile ID"
            value={profileQuery.data?.id ?? ''}
            disabled
          />
          <TextField
            label="Created At"
            value={profileQuery.data?.createdAt ? new Date(profileQuery.data.createdAt).toLocaleString() : ''}
            disabled
          />
          <TextField
            label="Updated At"
            value={profileQuery.data?.updatedAt ? new Date(profileQuery.data.updatedAt).toLocaleString() : ''}
            disabled
          />
          <Stack direction="row" spacing={1}>
            <ActionButton
              aria-label="Save profile"
              onClick={() => void handleSaveProfile()}
              disabled={!displayName.trim() || updateProfileMutation.isPending}
            >
              Save
            </ActionButton>
          </Stack>
        </Stack>
        <Stack direction="row" sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="outlined" color="inherit" startIcon={<LogoutRoundedIcon fontSize="small" />} onClick={handleLogout}>
            Logout
          </Button>
        </Stack>
      </SectionCard>
    </Stack>
  );
}
