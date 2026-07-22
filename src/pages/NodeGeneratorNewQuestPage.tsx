import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createNodeGeneratorProject,
  createWorkspaceNode,
  generateFirstSceneIdeas,
  generateWorkspaceNodeDescription,
  type FirstSceneIdea,
  updateWorkspaceNodeDescription,
} from '../api/nodeGeneratorApi';
import { SectionCard } from '../components/ui';

export function NodeGeneratorNewQuestPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [ideas, setIdeas] = useState<FirstSceneIdea[]>([]);
  const [firstSceneText, setFirstSceneText] = useState('');
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = firstSceneText.trim().length > 0;

  const handleGenerateIdeas = async () => {
    try {
      setError(null);
      setLoadingIdeas(true);
      const result = await generateFirstSceneIdeas(prompt.trim());
      setIdeas(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сгенерировать варианты');
    } finally {
      setLoadingIdeas(false);
    }
  };

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

      const generated = await generateWorkspaceNodeDescription(created.id, targetNodeId);
      const generatedNode = findNodeById(generated.workspace?.nodes ?? [], targetNodeId);
      if (generatedNode) {
        const actionText = generatedNode.generatedActionDescriptionDraft?.trim() || generatedNode.actionDescription || '';
        const stateText = generatedNode.generatedStateDescriptionDraft?.trim() || generatedNode.stateDescription || '';
        await updateWorkspaceNodeDescription(created.id, targetNodeId, actionText, stateText);
      }

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

      <SectionCard title="Шаг 1. Тема и варианты">
        <Stack spacing={1}>
          <Typography variant="body2">
            Опишите тему квеста и ситуацию персонажа, затем выберите вариант ИИ или введите свою первую сцену вручную.
          </Typography>
          <TextField
            label="Тема и ситуация"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            multiline
            minRows={4}
            fullWidth
          />
          <Button variant="outlined" onClick={() => void handleGenerateIdeas()} disabled={loadingIdeas}>
            Сгенерировать варианты
          </Button>
        </Stack>
      </SectionCard>

      <SectionCard title="Варианты первой сцены (ИИ)">
        <Stack spacing={1}>
          {!ideas.length ? <Typography variant="body2" color="text.secondary">Пока нет вариантов.</Typography> : null}
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

function findNodeById(
  nodes: { id: string; generatedActionDescriptionDraft?: string; actionDescription?: string; generatedStateDescriptionDraft?: string; stateDescription?: string }[],
  nodeId: string,
) {
  return nodes.find((node) => node.id.toUpperCase() === nodeId.toUpperCase()) ?? null;
}
