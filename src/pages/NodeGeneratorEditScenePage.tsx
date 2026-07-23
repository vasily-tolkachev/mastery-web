import { useParams } from 'react-router-dom';
import { NodeGeneratorSceneDescriptionStepPage } from './NodeGeneratorSceneDescriptionStepPage';

export function NodeGeneratorEditScenePage() {
  const { projectId = '', sceneId = '' } = useParams();
  return <NodeGeneratorSceneDescriptionStepPage mode="edit" projectId={projectId} sceneId={sceneId} />;
}
