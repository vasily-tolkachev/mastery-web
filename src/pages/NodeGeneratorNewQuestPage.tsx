import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createNodeGeneratorProject,
  generateFirstSceneIdeas,
  generateWorkspaceNodeDescription,
  type FirstSceneIdea,
  createWorkspaceNode,
  updateWorkspaceNodeDescription,
} from '../api/nodeGeneratorApi';
import { SectionCard } from '../components/ui';

export function NodeGeneratorNewQuestPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [ideas, setIdeas] = useState<FirstSceneIdea[]>([]);
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number | null>(null);
  const [manualScenario, setManualScenario] = useState('');
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedScenario = selectedIdeaIndex == null
    ? manualScenario.trim()
    : ideas[selectedIdeaIndex]?.scenarioText?.trim() ?? '';

  const handleGenerateIdeas = async () => {
    try {
      setError(null);
      setLoadingIdeas(true);
      const result = await generateFirstSceneIdeas(prompt.trim());
      setIdeas(result);
      setSelectedIdeaIndex(result.length ? 0 : null);
      if (result.length) {
        setManualScenario('');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сгенерировать варианты');
    } finally {
      setLoadingIdeas(false);
    }
  };

  const handleCreateQuest = async () => {
    try {
      setError(null);
      setCreating(true);
      const created = await createNodeGeneratorProject(generateProjectName(), 'classic-adventure');
      const projectId = created.id;

      const withNode = await createWorkspaceNode(projectId);
      const newNodeId = findNewNodeId(created.workspace?.nodes ?? [], withNode.workspace?.nodes ?? []);
      if (!newNodeId) {
        navigate(toProjectScenesPath(withNode.id, withNode.workspace?.nodes?.[0]?.id ?? 'N1'));
        return;
      }

      const baseText = selectedScenario || prompt.trim() || 'Герой оказывается в неизвестной ситуации и должен понять, что происходит.';
      await updateWorkspaceNodeDescription(projectId, newNodeId, baseText, baseText);
      const generated = await generateWorkspaceNodeDescription(projectId, newNodeId);
      const generatedNode = findNodeById(generated.workspace?.nodes ?? [], newNodeId);
      if (generatedNode) {
        const actionText = generatedNode.generatedActionDescriptionDraft?.trim() || generatedNode.actionDescription || '';
        const stateText = generatedNode.generatedStateDescriptionDraft?.trim() || generatedNode.stateDescription || '';
        await updateWorkspaceNodeDescription(projectId, newNodeId, actionText, stateText);
      }

      navigate(toProjectScenesPath(projectId, newNodeId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать квест');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <SectionCard title="Шаг 1. Тема и ситуация">
        <Stack spacing={1}>
          <Typography variant="body2">
            Опишите тему квеста и ситуацию, в которой оказался персонаж, или сгенерируйте варианты.
          </Typography>
          <TextField
            label="Тема и ситуация"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            multiline
            minRows={4}
            fullWidth
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button variant="outlined" onClick={() => void handleGenerateIdeas()} disabled={loadingIdeas}>
              Сгенерировать варианты
            </Button>
            <Button variant="contained" onClick={() => void handleCreateQuest()} disabled={creating}>
              Создать квест
            </Button>
          </Stack>
        </Stack>
      </SectionCard>

      <SectionCard title="Предложенные варианты">
        <Stack spacing={1}>
          {!ideas.length ? <Typography variant="body2" color="text.secondary">Пока нет вариантов.</Typography> : null}
          {ideas.map((idea, index) => (
            <Box
              key={`${index}-${idea.title}`}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedIdeaIndex(index)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') setSelectedIdeaIndex(index);
              }}
              sx={{
                border: 1,
                borderColor: selectedIdeaIndex === index ? 'primary.main' : 'divider',
                borderRadius: 1,
                p: 1.25,
                cursor: 'pointer',
              }}
            >
              <Typography variant="subtitle2">{idea.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {idea.scenarioText}
              </Typography>
            </Box>
          ))}
        </Stack>
      </SectionCard>

      <SectionCard title="Или введите свой вариант">
        <TextField
          label="Ситуация для первой сцены"
          value={manualScenario}
          onChange={(e) => {
            setManualScenario(e.target.value);
            setSelectedIdeaIndex(null);
          }}
          multiline
          minRows={3}
          fullWidth
        />
      </SectionCard>
    </Stack>
  );
}

function generateProjectName(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toISOString().slice(11, 19).replace(/:/g, '-');
  return `Квест ${date} ${time}`;
}

function toProjectScenesPath(projectId: string, nodeId: string): string {
  return `/node-generator/projects/${projectId}/scenes/${encodeURIComponent(nodeId)}`;
}

function findNewNodeId(previousIdsSource: { id: string }[], nextIdsSource: { id: string }[]): string | null {
  const previousIds = new Set(previousIdsSource.map((node) => node.id.toUpperCase()));
  const created = nextIdsSource.find((node) => !previousIds.has(node.id.toUpperCase()));
  return created?.id ?? null;
}

function findNodeById(nodes: { id: string; generatedActionDescriptionDraft?: string; actionDescription?: string; generatedStateDescriptionDraft?: string; stateDescription?: string }[], nodeId: string) {
  return nodes.find((node) => node.id.toUpperCase() === nodeId.toUpperCase()) ?? null;
}
