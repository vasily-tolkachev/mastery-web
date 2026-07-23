import { Alert, Box, Breadcrumbs, Button, Link as MuiLink, Stack, Step, StepButton, Stepper, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  addWorkspaceNodeAction,
  createNextWorkspaceNode,
  createNodeGeneratorProject,
  createWorkspaceNode,
  generateFirstSceneIdeas,
  generateNextSceneIdeas,
  generateWorkspaceNodeActions,
  updateWorkspaceNodeDescription,
} from '../api/nodeGeneratorApi';
import type { FirstSceneIdea } from '../api/nodeGeneratorApi';
import { SectionCard } from '../components/ui';
import { useNodeGeneratorProject } from '../hooks/useNodeGeneratorProject';
import { useSetNodeGeneratorProjectCache } from '../hooks/useNodeGeneratorProject';

type Mode = 'first' | 'next' | 'edit';

type Props = {
  mode: Mode;
  projectId?: string;
  sceneId?: string;
  actionId?: string;
};

const STEPS = ['Описание', 'Действия', 'Готово'];

export function NodeGeneratorSceneDescriptionStepPage({ mode, projectId, sceneId, actionId }: Props) {
  const navigate = useNavigate();
  const setProjectCache = useSetNodeGeneratorProjectCache();
  const { data: contextProject } = useNodeGeneratorProject(mode === 'first' ? '' : (projectId ?? ''));
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState<1 | 2 | 3>(1);
  const [ideas, setIdeas] = useState<FirstSceneIdea[]>([]);
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number | null>(null);
  const [sceneText, setSceneText] = useState('');
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [savingScene, setSavingScene] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState(mode === 'next' ? (projectId ?? '') : '');
  const [currentNodeId, setCurrentNodeId] = useState('');
  const [actionsLoading, setActionsLoading] = useState(false);
  const [actionsGeneratedOnce, setActionsGeneratedOnce] = useState(false);
  const [generatedActions, setGeneratedActions] = useState<string[]>([]);
  const [savedActions, setSavedActions] = useState<string[]>([]);
  const [actionDraft, setActionDraft] = useState('');
  const [addingAction, setAddingAction] = useState(false);

  const previousScene = useMemo(() => {
    if (mode !== 'next' || !contextProject?.workspace || !sceneId) return null;
    return contextProject.workspace.nodes.find((node) => node.id.toUpperCase() === sceneId.toUpperCase()) ?? null;
  }, [contextProject, mode, sceneId]);

  const previousActionText = useMemo(() => {
    if (!previousScene || !actionId) return '';
    return previousScene.actions.find((action) => action.id === actionId)?.text ?? '';
  }, [actionId, previousScene]);

  const editableScene = useMemo(() => {
    if (mode !== 'edit' || !contextProject?.workspace || !sceneId) return null;
    return contextProject.workspace.nodes.find((node) => node.id.toUpperCase() === sceneId.toUpperCase()) ?? null;
  }, [contextProject, mode, sceneId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setError(null);
        setLoadingIdeas(true);
        if (mode === 'edit') {
          setIdeas([]);
          return;
        }
        const list = mode === 'first'
          ? await generateFirstSceneIdeas('')
          : await generateNextSceneIdeas(projectId ?? '', sceneId ?? '', actionId ?? '');
        if (cancelled) return;
        setIdeas(list);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Не удалось загрузить варианты сцены');
      } finally {
        if (cancelled) return;
        setLoadingIdeas(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [actionId, mode, projectId, sceneId]);

  useEffect(() => {
    if (mode !== 'edit' || !editableScene) return;
    setCurrentProjectId(projectId ?? '');
    setCurrentNodeId(editableScene.id);
    setSceneText(editableScene.stateDescription || editableScene.actionDescription || '');
    setSavedActions((editableScene.actions ?? []).map((item) => item.text).filter((item) => item.trim().length > 0));
    setGeneratedActions(editableScene.generatedActionsDraft ?? []);
    setActionsGeneratedOnce(true);
    setMaxUnlockedStep(2);
  }, [editableScene, mode, projectId]);

  const canContinueFromStep1 = useMemo(() => {
    if (!sceneText.trim()) return false;
    return true;
  }, [sceneText]);

  const ensureScene = async () => {
    if (mode === 'edit') {
      if (!(projectId ?? '').trim() || !(sceneId ?? '').trim()) {
        throw new Error('Сцена для редактирования не найдена');
      }
      return { projectId: projectId ?? '', nodeId: sceneId ?? '' };
    }
    if (mode === 'first') {
      const project = await createNodeGeneratorProject(buildProjectName(sceneText, selectedIdeaIndex, ideas), 'classic-adventure');
      const withNode = await createWorkspaceNode(project.id);
      setProjectCache(withNode);
      const node = withNode.workspace?.nodes[withNode.workspace.nodes.length - 1];
      if (!node) throw new Error('Не удалось создать первую сцену');
      return { projectId: withNode.id, nodeId: node.id };
    }

    const updated = await createNextWorkspaceNode(projectId ?? '', sceneId ?? '', actionId ?? '');
    setProjectCache(updated);
    const node = updated.workspace?.nodes.find((item) => item.sourceNodeId === (sceneId ?? '') && item.sourceActionId === (actionId ?? ''))
      ?? updated.workspace?.nodes[updated.workspace.nodes.length - 1];
    if (!node) throw new Error('Не удалось создать новую сцену');
    return { projectId: updated.id, nodeId: node.id };
  };

  const handleContinueFromStep1 = async () => {
    if (!canContinueFromStep1 || savingScene) return;
    try {
      setError(null);
      setSavingScene(true);
      const created = await ensureScene();
      const updated = await updateWorkspaceNodeDescription(
        created.projectId,
        created.nodeId,
        sceneText.trim(),
        sceneText.trim(),
      );
      setProjectCache(updated);
      setCurrentProjectId(created.projectId);
      setCurrentNodeId(created.nodeId);
      setSavedActions([]);
      setGeneratedActions([]);
      setActionsGeneratedOnce(false);
      setMaxUnlockedStep(2);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить описание сцены');
    } finally {
      setSavingScene(false);
    }
  };

  useEffect(() => {
    if (step !== 2 || actionsGeneratedOnce || !currentProjectId || !currentNodeId) return;
    let cancelled = false;
    const run = async () => {
      try {
        setError(null);
        setActionsLoading(true);
        const updated = await generateWorkspaceNodeActions(currentProjectId, currentNodeId);
        if (cancelled) return;
        setProjectCache(updated);
        const node = updated.workspace?.nodes.find((item) => item.id.toUpperCase() === currentNodeId.toUpperCase());
        const actions = node?.generatedActionsDraft ?? [];
        const added = node?.actions.map((item) => item.text).filter((item) => item.trim().length > 0) ?? [];
        setGeneratedActions(actions);
        setSavedActions(added);
        setActionsGeneratedOnce(true);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Не удалось сгенерировать действия');
      } finally {
        if (cancelled) return;
        setActionsLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [actionsGeneratedOnce, currentNodeId, currentProjectId, setProjectCache, step]);

  const handleAddAction = async (value: string, fromGenerated = false) => {
    const text = value.trim();
    if (!text || !currentProjectId || !currentNodeId || addingAction) return;
    try {
      setError(null);
      setAddingAction(true);
      const updated = await addWorkspaceNodeAction(currentProjectId, currentNodeId, text);
      setProjectCache(updated);
      const node = updated.workspace?.nodes.find((item) => item.id.toUpperCase() === currentNodeId.toUpperCase());
      const added = node?.actions.map((item) => item.text).filter((item) => item.trim().length > 0) ?? [];
      setSavedActions(added);
      if (fromGenerated) {
        setGeneratedActions((prev) => prev.filter((item) => item !== text));
      }
      setActionDraft('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось добавить действие');
    } finally {
      setAddingAction(false);
    }
  };

  const handleStepClick = (targetStep: 1 | 2 | 3) => {
    if (targetStep > maxUnlockedStep) return;
    setStep(targetStep);
  };

  const availableGeneratedActions = useMemo(() => {
    const savedSet = new Set(savedActions.map((item) => item.trim().toLowerCase()).filter((item) => item.length > 0));
    return generatedActions.filter((item) => !savedSet.has(item.trim().toLowerCase()));
  }, [generatedActions, savedActions]);

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Breadcrumbs aria-label="breadcrumb">
        <MuiLink component={Link} to="/node-generator" underline="hover" color="inherit">
          Все квесты
        </MuiLink>
        <Typography color="text.primary">
          {mode === 'first' ? 'Новый квест' : mode === 'next' ? 'Новая сцена' : 'Редактирование сцены'}
        </Typography>
      </Breadcrumbs>

      <SectionCard title={`Создание сцены ${currentNodeId || 'N1'}`}>
        <Stepper activeStep={step - 1} alternativeLabel nonLinear>
          {STEPS.map((label, index) => (
            <Step key={label}>
              <StepButton onClick={() => handleStepClick((index + 1) as 1 | 2 | 3)}>
                {label}
              </StepButton>
            </Step>
          ))}
        </Stepper>
      </SectionCard>

      {step === 1 ? (
        <SectionCard title="Шаг 1. Описание сцены">
          <Stack spacing={1.5}>
            {mode === 'next' ? (
              <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                <Stack spacing={0.75}>
                  <Typography variant="subtitle2">Контекст предыдущего шага</Typography>
                  <Typography variant="body2" color="text.secondary">Предыдущая сцена</Typography>
                  <Typography variant="body2">
                    {previousScene?.stateDescription || previousScene?.actionDescription || 'Описание предыдущей сцены недоступно.'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Выбранное действие</Typography>
                  <Typography variant="body2">{previousActionText || 'Действие недоступно.'}</Typography>
                </Stack>
              </Box>
            ) : null}

            <TextField
              label={mode === 'first' ? 'Описание первой сцены' : 'Описание новой сцены'}
              value={sceneText}
              onChange={(e) => setSceneText(e.target.value)}
              fullWidth
              multiline
              minRows={4}
            />

            {mode !== 'edit' ? (
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  Варианты от ИИ
                </Typography>
                {loadingIdeas ? <Typography variant="body2">Генерация вариантов...</Typography> : null}
                {!loadingIdeas && ideas.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">Варианты пока не получены.</Typography>
                ) : null}
                {ideas.map((item, index) => (
                  <Box
                    key={`${index}-${item.title}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedIdeaIndex(index);
                      setSceneText(item.scenarioText);
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') return;
                      setSelectedIdeaIndex(index);
                      setSceneText(item.scenarioText);
                    }}
                    sx={{
                      border: 1,
                      borderColor: selectedIdeaIndex === index ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      p: 1,
                      cursor: 'pointer',
                    }}
                  >
                    <Typography variant="subtitle2">{item.title}</Typography>
                    <Typography variant="body2">{item.scenarioText}</Typography>
                  </Box>
                ))}
              </Stack>
            ) : null}

            <Button
              variant="contained"
              onClick={() => void handleContinueFromStep1()}
              disabled={!canContinueFromStep1 || savingScene}
            >
              {savingScene ? 'Сохранение...' : 'Далее к действиям'}
            </Button>
          </Stack>
        </SectionCard>
      ) : null}

      {step === 2 ? (
        <SectionCard title="Шаг 2. Действия">
          <Stack spacing={1.5}>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
              <Stack spacing={0.5}>
                <Typography variant="subtitle2">Выбранное описание сцены</Typography>
                <Typography variant="body2" color="text.secondary">
                  {sceneText.trim() || 'Описание не выбрано.'}
                </Typography>
              </Stack>
            </Box>

            {actionsLoading ? <Typography variant="body2">Генерация действий...</Typography> : null}
            {!actionsLoading && availableGeneratedActions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Список действий пуст.</Typography>
            ) : null}
            <Stack spacing={1}>
              {availableGeneratedActions.map((item, index) => (
                <Box
                  key={`${index}-${item}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => void handleAddAction(item, true)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      void handleAddAction(item, true);
                    }
                  }}
                  sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1, cursor: 'pointer' }}
                >
                  <Typography variant="body2">{item}</Typography>
                </Box>
              ))}
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                label="Добавить действие вручную"
                value={actionDraft}
                onChange={(e) => setActionDraft(e.target.value)}
                fullWidth
                size="small"
              />
              <Button
                variant="outlined"
                onClick={() => void handleAddAction(actionDraft)}
                disabled={!actionDraft.trim() || addingAction}
              >
                Добавить
              </Button>
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">Добавленные действия</Typography>
              {savedActions.length === 0 ? <Typography variant="body2" color="text.secondary">Пока нет добавленных действий.</Typography> : null}
              {savedActions.map((item, index) => (
                <Typography key={`${index}-${item}`} variant="body2">• {item}</Typography>
              ))}
            </Stack>

            <Button
              variant="contained"
              onClick={() => {
                setMaxUnlockedStep(3);
                setStep(3);
              }}
              disabled={!currentProjectId || !currentNodeId}
            >
              Готово
            </Button>
          </Stack>
        </SectionCard>
      ) : null}

      {step === 3 ? (
        <SectionCard title="Шаг 3. Готово">
          <Stack spacing={1}>
            <Typography variant="body2">Сцена готова. Можно перейти к редактированию.</Typography>
            <Button
              variant="contained"
              onClick={() => navigate(`/node-generator/projects/${currentProjectId}/scenes/${encodeURIComponent(currentNodeId)}`)}
              disabled={!currentProjectId || !currentNodeId}
            >
              Открыть сцену
            </Button>
          </Stack>
        </SectionCard>
      ) : null}
    </Stack>
  );
}

function buildProjectName(sceneText: string, selectedIdeaIndex: number | null, ideas: FirstSceneIdea[]): string {
  const ideaTitle = selectedIdeaIndex != null ? (ideas[selectedIdeaIndex]?.title ?? '').trim() : '';
  if (ideaTitle) return ideaTitle;
  const firstLine = sceneText.split('\n').map((line) => line.trim()).find((line) => line.length > 0) ?? '';
  if (!firstLine) return 'Новый квест';
  return firstLine.length > 48 ? `${firstLine.slice(0, 48).trim()}...` : firstLine;
}
