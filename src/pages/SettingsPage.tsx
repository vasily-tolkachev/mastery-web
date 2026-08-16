import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAuthProfile, updateAuthProfile } from '../api/authApi';
import { useAuth } from '../auth/AuthContext';
import { ActionButton, PageHeader, SectionCard } from '../components/ui';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';

export function SettingsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const profileQuery = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const authProfileQuery = useQuery({
    queryKey: ['auth-profile'],
    queryFn: getAuthProfile,
  });
  const syncUpdateProfileMutation = useMutation({
    mutationFn: async (name: string) => {
      const trimmedName = name.trim();
      const [coreProfile] = await Promise.all([
        updateProfileMutation.mutateAsync({ displayName: trimmedName }),
        updateAuthProfile(trimmedName),
      ]);
      return coreProfile;
    },
  });
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
    await syncUpdateProfileMutation.mutateAsync(displayName);
    void profileQuery.refetch();
    void authProfileQuery.refetch();
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
          {authProfileQuery.error ? (
            <Alert severity="error">
              {authProfileQuery.error instanceof Error ? authProfileQuery.error.message : 'Failed to load auth profile'}
            </Alert>
          ) : null}
          {updateProfileMutation.error ? (
            <Alert severity="error">
              {updateProfileMutation.error instanceof Error ? updateProfileMutation.error.message : 'Failed to update profile'}
            </Alert>
          ) : null}
          {syncUpdateProfileMutation.error ? (
            <Alert severity="error">
              {syncUpdateProfileMutation.error instanceof Error ? syncUpdateProfileMutation.error.message : 'Failed to update profile'}
            </Alert>
          ) : null}
          {syncUpdateProfileMutation.isSuccess ? (
            <Alert severity="success">Profile updated.</Alert>
          ) : null}
          <TextField
            label="Display Name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Learner"
            disabled={profileQuery.isLoading || syncUpdateProfileMutation.isPending}
          />
          <TextField
            label="Email"
            value={authProfileQuery.data?.email ?? ''}
            disabled
          />
          <TextField
            label="Created At"
            value={authProfileQuery.data?.createdAt ? new Date(authProfileQuery.data.createdAt).toLocaleString() : ''}
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
              disabled={!displayName.trim() || syncUpdateProfileMutation.isPending}
            >
              Save
            </ActionButton>
          </Stack>
        </Stack>
        <Stack direction="row" sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="outlined" color="inherit" startIcon={<LogoutRoundedIcon fontSize="small" />} onClick={handleLogout}>
            Sign Out
          </Button>
        </Stack>
      </SectionCard>
    </Stack>
  );
}
