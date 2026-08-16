import { Alert, Box, Breadcrumbs, Button, Link as MuiLink, Stack, Typography } from '@mui/material';
import { Link, useParams } from 'react-router-dom';
import {
  acceptWorkspaceExpansionSuggestion,
  dismissWorkspaceExpansionSuggestion,
  runWorkspaceExpansion,
} from '../api/nodeGeneratorApi';
import { LoadingState, SectionCard } from '../components/ui';
import { useNodeGeneratorProject, useSetNodeGeneratorProjectCache } from '../hooks/useNodeGeneratorProject';

export function NodeGeneratorExpansionReviewPage() {
  const { projectId = '' } = useParams();
  const { data: project, isLoading, isError, error } = useNodeGeneratorProject(projectId);
  const setProjectCache = useSetNodeGeneratorProjectCache();

  if (isLoading) return <LoadingState message="Loading review..." />;
  if (isError) return <Alert severity="error">{error instanceof Error ? error.message : 'Failed to load review'}</Alert>;
  if (!project) return <Alert severity="error">Project not found</Alert>;

  const suggestions = (project.workspace?.expansionSuggestions ?? []).filter((item) => item.status.toUpperCase() === 'PENDING');

  return (
    <Stack spacing={2}>
      <Breadcrumbs aria-label="breadcrumb">
        <MuiLink component={Link} to="/node-generator" underline="hover" color="inherit">
          All quests
        </MuiLink>
        <MuiLink component={Link} to={`/node-generator/projects/${project.id}`} underline="hover" color="inherit">
          {project.name}
        </MuiLink>
        <Typography color="text.primary">Change Review</Typography>
      </Breadcrumbs>

      <SectionCard title="Action Updates">
        <Stack spacing={1}>
          <Typography variant="body2">New knowledge was added after recent changes.</Typography>
          <Typography variant="body2">Review scene updates before applying them.</Typography>
          <Button
            variant="contained"
            onClick={async () => {
              const updated = await runWorkspaceExpansion(project.id, project.workspace?.globalKnowledge ?? []);
              setProjectCache(updated);
            }}
            sx={{ alignSelf: 'flex-start' }}
          >
            Start Review
          </Button>
        </Stack>
      </SectionCard>

      <SectionCard title="Suggested New Actions">
        <Stack spacing={1}>
          {suggestions.map((item) => (
            <Box key={item.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
              <Typography variant="subtitle2">Scene {item.nodeId}</Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>+ {item.actionText}</Typography>
              <Typography variant="caption" color="text.secondary">{item.reason}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={async () => {
                    const updated = await acceptWorkspaceExpansionSuggestion(project.id, item.id);
                    setProjectCache(updated);
                  }}
                >
                  Accept
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={async () => {
                    const updated = await dismissWorkspaceExpansionSuggestion(project.id, item.id);
                    setProjectCache(updated);
                  }}
                >
                  Dismiss
                </Button>
              </Stack>
            </Box>
          ))}
          {!suggestions.length ? <Typography variant="body2" color="text.secondary">No suggestions to review.</Typography> : null}
        </Stack>
      </SectionCard>
    </Stack>
  );
}

