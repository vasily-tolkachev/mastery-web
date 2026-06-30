import { Stack } from '@mui/material';
import { EmptyState, PageHeader, SectionCard } from '../components/ui';

export function SettingsPage() {
  return (
    <Stack spacing={2}>
      <PageHeader title="Settings" subtitle="Application preferences and profile." />
      <SectionCard title="Preferences">
        <EmptyState message="Settings page scaffold is ready." />
      </SectionCard>
    </Stack>
  );
}
