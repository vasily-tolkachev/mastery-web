import { useParams } from 'react-router-dom';
import { NodeGeneratorSceneDescriptionStepPage } from './NodeGeneratorSceneDescriptionStepPage';

export function NodeGeneratorNextSceneDescriptionPage() {
  const { projectId = '', sceneId = '', actionId = '' } = useParams();
  return (
    <NodeGeneratorSceneDescriptionStepPage
      mode="next"
      projectId={projectId}
      sceneId={sceneId}
      actionId={actionId}
    />
  );
}
