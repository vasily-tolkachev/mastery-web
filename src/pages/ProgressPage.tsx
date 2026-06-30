import { Stack } from '@mui/material';
import { EmptyState, PageHeader, SectionCard } from '../components/ui';

export function ProgressPage() {
  return (
    <Stack spacing={2}>
      <PageHeader title="Progress" subtitle="Learning progress and achievements." />
      <SectionCard title="Progress Summary">
        <EmptyState message="Progress page scaffold is ready." />
      </SectionCard>
    </Stack>
  );
}
