import { Alert, Box, Breadcrumbs, Button, Link as MuiLink, Stack, Step, StepLabel, Stepper, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  addWorkspaceNodeAction,
  extractWorkspaceNodeKnowledge,
  generateWorkspaceNodeActions,
  generateWorkspaceNodeDescription,
  previewWorkspaceNodeActionsPrompt,
  previewWorkspaceNodeDescriptionPrompt,
  previewWorkspaceNodeKnowledgePrompt,
  updateWorkspaceNodeDescription,
} from '../api/nodeGeneratorApi';
import type { PromptOverride } from '../api/nodeGeneratorApi';
import { LoadingState, SectionCard } from '../components/ui';
import { useNodeGeneratorProject, useSetNodeGeneratorProjectCache } from '../hooks/useNodeGeneratorProject';
import type { StagePromptPreview } from '../types/nodeGenerator';

const STEPS = ['Описание', 'Знания', 'Действия', 'Готово'];

export function NodeGeneratorSceneFlowPage() {
  const { projectId = '', sceneId = '' } = useParams();
  const { data: project, isLoading, isError, error } = useNodeGeneratorProject(projectId);
  const setProjectCache = useSetNodeGeneratorProjectCache();
  const [activeStep, setActiveStep] = useState(0);
  const [previews, setPreviews] = useState<Record<string, StagePromptPreview>>({});
  const [overrides, setOverrides] = useState<Record<string, PromptOverride>>({});
  const [actionDescriptionDraft, setActionDescriptionDraft] = useState('');
  const [stateDescriptionDraft, setStateDescriptionDraft] = useState('');
  const [newActionDraft, setNewActionDraft] = useState('');

  const scene = useMemo(
    () => project?.workspace?.nodes.find((node) => node.id.toUpperCase() === sceneId.toUpperCase()) ?? null,
    [project, sceneId],
  );

  useEffect(() => {
    setActionDescriptionDraft(scene?.actionDescription ?? '');
    setStateDescriptionDraft(scene?.stateDescription ?? '');
  }, [scene?.id, scene?.actionDescription, scene?.stateDescription]);

  const setOverrideFromPreview = (key: string, preview: StagePromptPreview) => {
    setPreviews((prev) => ({ ...prev, [key]: preview }));
    setOverrides((prev) => ({
      ...prev,
      [key]: { systemPrompt: preview.systemPrompt, userPrompt: preview.userPrompt },
    }));
  };

  const preview = async (key: string, action: () => Promise<StagePromptPreview>) => {
    const data = await action();
    setOverrideFromPreview(key, data);
  };

  const getOverride = (key: string): PromptOverride | undefined => {
    const value = overrides[key];
    if (!value) return undefined;
    const systemPrompt = (value.systemPrompt ?? '').trim();
    const userPrompt = (value.userPrompt ?? '').trim();
    if (!systemPrompt && !userPrompt) return undefined;
    return { systemPrompt, userPrompt };
  };

  const updateOverride = (key: string, field: 'systemPrompt' | 'userPrompt', value: string) => {
    setOverrides((prev) => ({ ...prev, [key]: { ...(prev[key] ?? {}), [field]: value } }));
  };

  if (isLoading) return <LoadingState message="Загрузка шага генерации..." />;
  if (isError) return <Alert severity="error">{error instanceof Error ? error.message : 'Не удалось загрузить данные'}</Alert>;
  if (!project || !scene) return <Alert severity="error">Сцена не найдена</Alert>;

  const descKey = `DESC:${scene.id}`;
  const knowKey = `KNOW:${scene.id}`;
  const actKey = `ACT:${scene.id}`;

  return (
    <Stack spacing={2}>
      <Breadcrumbs aria-label="breadcrumb">
        <MuiLink component={Link} to="/node-generator" underline="hover" color="inherit">
          Все квесты
        </MuiLink>
        <MuiLink component={Link} to={`/node-generator/projects/${project.id}`} underline="hover" color="inherit">
          {project.name}
        </MuiLink>
        <MuiLink component={Link} to={`/node-generator/projects/${project.id}/scenes/${scene.id}`} underline="hover" color="inherit">
          Сцена {scene.id}
        </MuiLink>
        <Typography color="text.primary">Генерация</Typography>
      </Breadcrumbs>

      <SectionCard title={`Создание сцены ${scene.id}`}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </SectionCard>

      {activeStep === 0 ? (
        <SectionCard title="Шаг 1. Описание сцены">
          <Stack spacing={1}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <Button variant="outlined" onClick={() => void preview(descKey, () => previewWorkspaceNodeDescriptionPrompt(project.id, scene.id))}>
                Посмотреть запрос
              </Button>
              <Button
                variant="contained"
                onClick={async () => {
                  const updated = await generateWorkspaceNodeDescription(project.id, scene.id, getOverride(descKey));
                  setProjectCache(updated);
                  setActiveStep(1);
                }}
              >
                Сгенерировать
              </Button>
              <Button
                variant="contained"
                onClick={async () => {
                  const updated = await updateWorkspaceNodeDescription(project.id, scene.id, actionDescriptionDraft, stateDescriptionDraft);
                  setProjectCache(updated);
                  setActiveStep(1);
                }}
              >
                Принять и далее
              </Button>
            </Stack>
            <PromptEditor
              preview={previews[descKey]}
              override={overrides[descKey]}
              onChange={(field, value) => updateOverride(descKey, field, value)}
              systemLabel="SYSTEM prompt описания"
              userLabel="USER prompt описания"
            />
            <TextField label="Описание действия" value={actionDescriptionDraft} onChange={(e) => setActionDescriptionDraft(e.target.value)} multiline minRows={3} />
            <TextField label="Описание состояния" value={stateDescriptionDraft} onChange={(e) => setStateDescriptionDraft(e.target.value)} multiline minRows={4} />
          </Stack>
        </SectionCard>
      ) : null}

      {activeStep === 1 ? (
        <SectionCard title="Шаг 2. Знания">
          <Stack spacing={1}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <Button variant="outlined" onClick={() => void preview(knowKey, () => previewWorkspaceNodeKnowledgePrompt(project.id, scene.id))}>
                Посмотреть запрос
              </Button>
              <Button
                variant="contained"
                onClick={async () => {
                  const updated = await extractWorkspaceNodeKnowledge(project.id, scene.id, getOverride(knowKey));
                  setProjectCache(updated);
                  setActiveStep(2);
                }}
              >
                Сгенерировать
              </Button>
            </Stack>
            <PromptEditor
              preview={previews[knowKey]}
              override={overrides[knowKey]}
              onChange={(field, value) => updateOverride(knowKey, field, value)}
              systemLabel="SYSTEM prompt знаний"
              userLabel="USER prompt знаний"
            />
            <Stack spacing={0.5}>
              {(scene.extractedKnowledgeDraft ?? []).map((item, index) => (
                <Typography key={`${index}-${item}`} variant="body2">{index + 1}. {item}</Typography>
              ))}
            </Stack>
          </Stack>
        </SectionCard>
      ) : null}

      {activeStep === 2 ? (
        <SectionCard title="Шаг 3. Действия">
          <Stack spacing={1}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <Button variant="outlined" onClick={() => void preview(actKey, () => previewWorkspaceNodeActionsPrompt(project.id, scene.id))}>
                Посмотреть запрос
              </Button>
              <Button
                variant="contained"
                onClick={async () => {
                  const updated = await generateWorkspaceNodeActions(project.id, scene.id, getOverride(actKey));
                  setProjectCache(updated);
                  setActiveStep(3);
                }}
              >
                Сгенерировать
              </Button>
            </Stack>
            <PromptEditor
              preview={previews[actKey]}
              override={overrides[actKey]}
              onChange={(field, value) => updateOverride(actKey, field, value)}
              systemLabel="SYSTEM prompt действий"
              userLabel="USER prompt действий"
            />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <TextField label="Добавить действие вручную" value={newActionDraft} onChange={(e) => setNewActionDraft(e.target.value)} fullWidth size="small" />
              <Button
                variant="outlined"
                disabled={!newActionDraft.trim()}
                onClick={async () => {
                  const updated = await addWorkspaceNodeAction(project.id, scene.id, newActionDraft);
                  setNewActionDraft('');
                  setProjectCache(updated);
                }}
              >
                Добавить
              </Button>
            </Stack>
            <Stack spacing={0.5}>
              {(scene.generatedActionsDraft ?? []).map((item, index) => (
                <Box key={`${index}-${item}`} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
                  <Typography variant="body2">{item}</Typography>
                </Box>
              ))}
            </Stack>
          </Stack>
        </SectionCard>
      ) : null}

      {activeStep === 3 ? (
        <SectionCard title="Сцена готова">
          <Stack spacing={1}>
            <Typography variant="body2">✓ Сцена {scene.id} обновлена.</Typography>
            <Button component={Link} to={`/node-generator/projects/${project.id}/scenes/${scene.id}`} variant="contained">
              Вернуться к сцене
            </Button>
          </Stack>
        </SectionCard>
      ) : null}
    </Stack>
  );
}

type PromptEditorProps = {
  preview?: StagePromptPreview;
  override?: PromptOverride;
  onChange: (field: 'systemPrompt' | 'userPrompt', value: string) => void;
  systemLabel: string;
  userLabel: string;
};

function PromptEditor({ preview, override, onChange, systemLabel, userLabel }: PromptEditorProps) {
  if (!preview && !override) return null;
  return (
    <Stack spacing={1}>
      {preview ? (
        <Box component="pre" sx={{ mt: 0, mb: 0, p: 1, borderRadius: 1, bgcolor: 'background.default', maxHeight: 220, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
          {`SYSTEM:\n${preview.systemPrompt ?? ''}\n\nUSER:\n${preview.userPrompt ?? ''}`}
        </Box>
      ) : null}
      <TextField label={systemLabel} value={override?.systemPrompt ?? ''} onChange={(e) => onChange('systemPrompt', e.target.value)} multiline minRows={3} />
      <TextField label={userLabel} value={override?.userPrompt ?? ''} onChange={(e) => onChange('userPrompt', e.target.value)} multiline minRows={3} />
    </Stack>
  );
}
