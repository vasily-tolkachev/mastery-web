import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createNodeGeneratorProject,
  createWorkspaceNode,
  generateFirstSceneIdeas,
  type FirstSceneIdea,
  updateWorkspaceNodeDescription,
} from '../api/nodeGeneratorApi';
import { SectionCard } from '../components/ui';

export function NodeGeneratorNewQuestPage() {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<FirstSceneIdea[]>([]);
  const [firstSceneText, setFirstSceneText] = useState('');
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = firstSceneText.trim().length > 0;

  const loadIdeas = async () => {
    try {
      setError(null);
      setLoadingIdeas(true);
      const result = await generateFirstSceneIdeas('');
      setIdeas(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сгенерировать варианты');
    } finally {
      setLoadingIdeas(false);
    }
  };

  useEffect(() => {
    void loadIdeas();
  }, []);

  const handleCreateQuest = async () => {
    if (!canCreate) return;
    try {
      setError(null);
      setCreating(true);

      const created = await createNodeGeneratorProject(generateProjectName(), 'classic-adventure');
      const withNode = await createWorkspaceNode(created.id);
      const newNodeId = findNewNodeId(created.workspace?.nodes ?? [], withNode.workspace?.nodes ?? []);
      const targetNodeId = newNodeId ?? withNode.workspace?.nodes?.[0]?.id ?? 'N1';

      const baseText = firstSceneText.trim();
      await updateWorkspaceNodeDescription(created.id, targetNodeId, baseText, baseText);

      navigate(`/node-generator/projects/${created.id}/scenes/${encodeURIComponent(targetNodeId)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать квест');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <SectionCard title="Варианты первой сцены (ИИ)">
        <Stack spacing={1}>
          {loadingIdeas ? <Typography variant="body2" color="text.secondary">Генерация вариантов...</Typography> : null}
          {!loadingIdeas && !ideas.length ? <Typography variant="body2" color="text.secondary">Пока нет вариантов.</Typography> : null}
          {ideas.map((idea, index) => (
            <Box
              key={`${index}-${idea.title}`}
              role="button"
              tabIndex={0}
              onClick={() => setFirstSceneText(idea.scenarioText)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') setFirstSceneText(idea.scenarioText);
              }}
              sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.25, cursor: 'pointer' }}
            >
              <Typography variant="subtitle2">{idea.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {idea.scenarioText}
              </Typography>
            </Box>
          ))}
        </Stack>
      </SectionCard>

      <SectionCard title="Первая сцена">
        <TextField
          label="Текст первой сцены"
          value={firstSceneText}
          onChange={(e) => setFirstSceneText(e.target.value)}
          multiline
          minRows={5}
          fullWidth
        />
      </SectionCard>

      <Button variant="contained" onClick={() => void handleCreateQuest()} disabled={!canCreate || creating}>
        Создать квест
      </Button>
    </Stack>
  );
}

function generateProjectName(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toISOString().slice(11, 19).replace(/:/g, '-');
  return `Квест ${date} ${time}`;
}

function findNewNodeId(previousIdsSource: { id: string }[], nextIdsSource: { id: string }[]): string | null {
  const previousIds = new Set(previousIdsSource.map((node) => node.id.toUpperCase()));
  const created = nextIdsSource.find((node) => !previousIds.has(node.id.toUpperCase()));
  return created?.id ?? null;
}
