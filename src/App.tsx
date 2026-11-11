import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Footer } from './components/layout/Footer';
import { TopBar } from './components/layout/TopBar';
import { StudyProvider } from './context/StudyContext';
import { CategoriesPage } from './pages/CategoriesPage';
import { GeneratorPage } from './pages/GeneratorPage';
import { HomePage } from './pages/HomePage';
import { StudyPlanPage } from './pages/StudyPlanPage';
import { TopicStudioPage } from './pages/TopicStudioPage';

export default function App() {
  return (
    <BrowserRouter>
      <StudyProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
          <TopBar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/categorias" element={<CategoriesPage />} />
              <Route path="/categorias/:categorySlug" element={<CategoriesPage />} />
              <Route path="/assunto/:topicSlug" element={<TopicStudioPage />} />
              <Route path="/estudos" element={<StudyPlanPage />} />
              <Route path="/gerador" element={<GeneratorPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </StudyProvider>
    </BrowserRouter>
  );
}
