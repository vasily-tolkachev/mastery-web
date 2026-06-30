import { Grid, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import {
  InfoCard,
  PageHeader,
  ProgressCard,
  SectionCard,
  StatusChip,
} from '../components/ui';
import { useLearningState } from '../hooks/useLearning';

const DEFAULT_USER_ID = 'demo-user';

type ProgramNode = {
  name: string;
  children?: ProgramNode[];
};

const mockProgramTree: ProgramNode[] = [
  {
    name: 'Concept 1: Gravitational Basics',
    children: [
      { name: 'MicroConcept 1.1: Gravity and Mass' },
      { name: 'MicroConcept 1.2: Orbital Motion' },
    ],
  },
  {
    name: 'Concept 2: Earth and Moon',
    children: [
      { name: 'MicroConcept 2.1: Tides and Gravity' },
      { name: 'MicroConcept 2.2: Phases of the Moon' },
    ],
  },
  {
    name: 'Concept 3: Solar System Dynamics',
    children: [
      { name: 'MicroConcept 3.1: Why Earth Does Not Fall into the Sun' },
      { name: 'MicroConcept 3.2: Stable Orbits' },
    ],
  },
];

function renderTree(nodes: ProgramNode[], level = 0) {
  return nodes.map((node) => (
    <Stack key={`${level}-${node.name}`} spacing={0.5} sx={{ ml: level * 2 }}>
      <ListItem disableGutters dense>
        <ListItemText primary={node.name} />
      </ListItem>
      {node.children ? renderTree(node.children, level + 1) : null}
    </Stack>
  ));
}

export function ProgramsPage() {
  const learningStateQuery = useLearningState(DEFAULT_USER_ID);
  const state = learningStateQuery.data;

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Programs"
        subtitle="Goal -> Program -> Concepts -> MicroConcepts"
        actions={<StatusChip label={state?.currentActivity.type ?? 'NO_SESSION'} tone={state ? 'info' : 'default'} />}
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <SectionCard title="Program Overview">
            <Stack spacing={2}>
              <InfoCard label="Goal" value="Understand Earth-Moon-Sun mechanics" />
              <InfoCard label="Program" value="Astronomy Foundations (Mock)" />
              <Stack spacing={0.5}>
                <Typography variant="subtitle2">Concept Tree</Typography>
                <List dense>{renderTree(mockProgramTree)}</List>
              </Stack>
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2}>
            <SectionCard title="Current Position">
              <Stack spacing={1}>
                <InfoCard label="Current Topic" value={state?.context.topicName ?? 'Not started'} />
                <InfoCard label="Current Concept" value={state?.context.conceptName ?? 'Not started'} />
                <InfoCard label="Current MicroConcept" value={state?.context.microConceptName ?? 'Not started'} />
              </Stack>
            </SectionCard>

            <ProgressCard
              title="Concept Progress"
              current={state?.progress.conceptOrder ?? null}
              total={state?.progress.totalConcepts ?? null}
            />
            <ProgressCard
              title="MicroConcept Progress"
              current={state?.progress.microConceptOrder ?? null}
              total={state?.progress.totalMicroConcepts ?? null}
            />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
