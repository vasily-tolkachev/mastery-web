import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { LearningPage } from './pages/LearningPage';

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<LearningPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
