import { Stack } from '@mui/material';
import { EmptyState, PageHeader, SectionCard } from '../components/ui';

export function ProgramsPage() {
  return (
    <Stack spacing={2}>
      <PageHeader title="Programs" subtitle="Program overview and concept tree." />
      <SectionCard title="Program List">
        <EmptyState message="Programs page scaffold is ready." />
      </SectionCard>
    </Stack>
  );
}
