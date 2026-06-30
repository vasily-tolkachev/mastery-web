import { Stack } from '@mui/material';
import { EmptyState, PageHeader, SectionCard } from '../components/ui';

export function GoalsPage() {
  return (
    <Stack spacing={2}>
      <PageHeader title="Goals" subtitle="Choose or create your learning goal." />
      <SectionCard title="Goal Management">
        <EmptyState message="Goals page scaffold is ready." />
      </SectionCard>
    </Stack>
  );
}
