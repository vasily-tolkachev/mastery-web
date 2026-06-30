import { Box, Divider, Grid, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActionButton,
  InfoCard,
  PageHeader,
  SectionCard,
  StatusChip,
} from '../components/ui';

type GoalTemplate = {
  id: string;
  title: string;
  description: string;
  status: 'Recommended' | 'Planned';
};

const templates: GoalTemplate[] = [
  {
    id: 'astronomy',
    title: 'Understand Earth-Moon-Sun Mechanics',
    description: 'Build conceptual mastery of gravity, orbits and lunar phases.',
    status: 'Recommended',
  },
  {
    id: 'spring',
    title: 'Master Spring Core',
    description: 'Dependency injection, bean lifecycle, configuration and testing.',
    status: 'Planned',
  },
  {
    id: 'sql',
    title: 'Practical SQL for Product Analytics',
    description: 'From filtering and joins to cohort and retention analysis.',
    status: 'Planned',
  },
];

export function GoalsPage() {
  const navigate = useNavigate();
  const [customGoal, setCustomGoal] = useState('');
  const [goalHint, setGoalHint] = useState('Goal is not selected yet.');

  const handleSelectTemplate = (goal: GoalTemplate) => {
    setGoalHint(`Selected goal: ${goal.title}`);
  };

  const handleCreateGoal = () => {
    if (!customGoal.trim()) {
      setGoalHint('Enter goal text first.');
      return;
    }
    setGoalHint(`Custom goal prepared: ${customGoal.trim()}`);
    setCustomGoal('');
  };

  return (
    <Stack spacing={2}>
      <PageHeader title="Goals" subtitle="Choose a goal or create your own." />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <SectionCard title="Choose Goal">
            <Stack spacing={1.5}>
              {templates.map((goal) => (
                <Box key={goal.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">{goal.title}</Typography>
                    <StatusChip label={goal.status} tone={goal.status === 'Recommended' ? 'success' : 'info'} />
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Stack spacing={1}>
                    <InfoCard label="Description" value={goal.description} />
                    <ActionButton onClick={() => handleSelectTemplate(goal)}>Use Goal</ActionButton>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2}>
            <SectionCard title="Create Goal">
              <Stack spacing={1.5}>
                <TextField
                  label="Your Goal"
                  value={customGoal}
                  onChange={(event) => setCustomGoal(event.target.value)}
                  multiline
                  minRows={3}
                  placeholder="Example: Learn Java architecture deeply for backend platform work."
                />
                <ActionButton onClick={handleCreateGoal}>Create Goal</ActionButton>
              </Stack>
            </SectionCard>

            <SectionCard title="Current Choice">
              <InfoCard label="Status" value={goalHint} />
              <Stack direction="row" spacing={1.5} sx={{ mt: 1.5 }}>
                <ActionButton onClick={() => navigate('/programs')}>Open Programs</ActionButton>
                <ActionButton onClick={() => navigate('/learning')}>Open Learning</ActionButton>
              </Stack>
            </SectionCard>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
