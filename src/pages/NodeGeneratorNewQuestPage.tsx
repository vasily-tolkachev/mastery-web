import { Alert, Box, Button, FormControlLabel, Radio, RadioGroup, Stack, TextField, Typography } from '@mui/material';
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

type SelectionMode = 'ai' | 'custom';

export function NodeGeneratorNewQuestPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [ideas, setIdeas] = useState<FirstSceneIdea[]>([]);
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number>(0);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('ai');
  const [customScenario, setCustomScenario] = useState('');
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasIdeas = ideas.length > 0;
  const canCreate = selectionMode === 'custom'
    ? customScenario.trim().length > 0
    : hasIdeas || prompt.trim().length > 0;

  const handleGenerateIdeas = async () => {
    try {
      setError(null);
      setLoadingIdeas(true);
      const result = await generateFirstSceneIdeas(prompt.trim());
      setIdeas(result);
      setSelectedIdeaIndex(0);
      setSelectionMode('ai');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сгенерировать варианты');
    } finally {
      setLoadingIdeas(false);
    }
  };

  const resolveBaseText = () => {
    if (selectionMode === 'custom') {
      return customScenario.trim();
    }
    const idea = ideas[selectedIdeaIndex];
    if (idea?.scenarioText?.trim()) {
      return idea.scenarioText.trim();
    }
    if (prompt.trim()) {
      return prompt.trim();
    }
    return 'Герой оказывается в неизвестной ситуации и должен понять, что происходит.';
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

      const baseText = resolveBaseText();
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
            Опишите тему квеста и ситуацию персонажа, затем выберите один вариант для первой сцены.
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

      <SectionCard title="Шаг 2. Выбор первой сцены">
        <RadioGroup
          value={selectionMode}
          onChange={(e) => setSelectionMode(e.target.value as SelectionMode)}
        >
          <FormControlLabel value="ai" control={<Radio />} label="Выбрать вариант ИИ" disabled={!hasIdeas} />
          <Box sx={{ ml: 4, mb: 1 }}>
            {!hasIdeas ? (
              <Typography variant="body2" color="text.secondary">Сначала сгенерируйте варианты.</Typography>
            ) : (
              <Stack spacing={1}>
                {ideas.map((idea, index) => (
                  <Box
                    key={`${index}-${idea.title}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectionMode('ai');
                      setSelectedIdeaIndex(index);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        setSelectionMode('ai');
                        setSelectedIdeaIndex(index);
                      }
                    }}
                    sx={{
                      border: 1,
                      borderColor: selectionMode === 'ai' && selectedIdeaIndex === index ? 'primary.main' : 'divider',
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
            )}
          </Box>

          <FormControlLabel value="custom" control={<Radio />} label="Свой вариант" />
          <Box sx={{ ml: 4 }}>
            <TextField
              label="Моя первая сцена"
              value={customScenario}
              onChange={(e) => setCustomScenario(e.target.value)}
              multiline
              minRows={3}
              fullWidth
              disabled={selectionMode !== 'custom'}
            />
          </Box>
        </RadioGroup>
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
