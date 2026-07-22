import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { addWorkspaceGlobalKnowledge, getNodeGeneratorProject, removeWorkspaceGlobalKnowledge } from '../api/nodeGeneratorApi';
import { LoadingState, SectionCard } from '../components/ui';
import type { NodeGeneratorProject } from '../types/nodeGenerator';

export function NodeGeneratorKnowledgePage() {
  const { projectId = '' } = useParams();
  const [project, setProject] = useState<NodeGeneratorProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [knowledgeDraft, setKnowledgeDraft] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setProject(await getNodeGeneratorProject(projectId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить знания');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [projectId]);

  if (loading) return <LoadingState message="Загрузка знаний..." />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!project) return <Alert severity="error">Проект не найден</Alert>;

  const items = project.workspace?.globalKnowledge ?? [];

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Все квесты / {project.name} / Глобальные знания
      </Typography>
      <Button component={Link} to={`/node-generator/projects/${project.id}`} sx={{ alignSelf: 'flex-start' }}>
        ← {project.name}
      </Button>
      <SectionCard title="Глобальные знания">
        <Stack spacing={1}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <TextField label="+ Добавить знание" size="small" value={knowledgeDraft} onChange={(e) => setKnowledgeDraft(e.target.value)} fullWidth />
            <Button
              variant="contained"
              disabled={!knowledgeDraft.trim()}
              onClick={async () => {
                const updated = await addWorkspaceGlobalKnowledge(project.id, knowledgeDraft);
                setProject(updated);
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
                  setProject(updated);
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
