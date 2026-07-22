import { Alert, Breadcrumbs, Button, Link as MuiLink, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { addWorkspaceGlobalKnowledge, removeWorkspaceGlobalKnowledge } from '../api/nodeGeneratorApi';
import { LoadingState, SectionCard } from '../components/ui';
import { useNodeGeneratorProject, useSetNodeGeneratorProjectCache } from '../hooks/useNodeGeneratorProject';

export function NodeGeneratorKnowledgePage() {
  const { projectId = '' } = useParams();
  const { data: project, isLoading, isError, error } = useNodeGeneratorProject(projectId);
  const setProjectCache = useSetNodeGeneratorProjectCache();
  const [knowledgeDraft, setKnowledgeDraft] = useState('');

  if (isLoading) return <LoadingState message="Загрузка знаний..." />;
  if (isError) return <Alert severity="error">{error instanceof Error ? error.message : 'Не удалось загрузить знания'}</Alert>;
  if (!project) return <Alert severity="error">Проект не найден</Alert>;

  const items = project.workspace?.globalKnowledge ?? [];

  return (
    <Stack spacing={2}>
      <Breadcrumbs aria-label="breadcrumb">
        <MuiLink component={Link} to="/node-generator" underline="hover" color="inherit">
          Все квесты
        </MuiLink>
        <MuiLink component={Link} to={`/node-generator/projects/${project.id}`} underline="hover" color="inherit">
          {project.name}
        </MuiLink>
        <Typography color="text.primary">Глобальные знания</Typography>
      </Breadcrumbs>

      <SectionCard title="Глобальные знания">
        <Stack spacing={1}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <TextField label="+ Добавить знание" size="small" value={knowledgeDraft} onChange={(e) => setKnowledgeDraft(e.target.value)} fullWidth />
            <Button
              variant="contained"
              disabled={!knowledgeDraft.trim()}
              onClick={async () => {
                const updated = await addWorkspaceGlobalKnowledge(project.id, knowledgeDraft);
                setProjectCache(updated);
                setKnowledgeDraft('');
              }}
            >
              Добавить
            </Button>
          </Stack>
          {items.map((item, index) => (
            <Stack key={`${index}-${item}`} direction="row" spacing={1}>
              <Typography variant="body2" sx={{ flex: 1 }}>{item}</Typography>
              <Button
                size="small"
                color="error"
                onClick={async () => {
                  const updated = await removeWorkspaceGlobalKnowledge(project.id, item);
                  setProjectCache(updated);
                }}
              >
                Удалить
              </Button>
            </Stack>
          ))}
          {!items.length ? <Typography variant="body2" color="text.secondary">Список знаний пуст.</Typography> : null}
        </Stack>
      </SectionCard>
    </Stack>
  );
}
