import { Stack } from '@mui/material';
import { EmptyState, PageHeader, SectionCard } from '../components/ui';

export function HomePage() {
  return (
    <Stack spacing={2}>
      <PageHeader title="Home" subtitle="Your learning dashboard will appear here." />
      <SectionCard title="Overview">
        <EmptyState message="Dashboard modules will be added in the next commit." />
      </SectionCard>
    </Stack>
  );
}
