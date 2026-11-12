import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastContainer } from './components/common/ToastContainer';
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
    <ErrorBoundary
      fallbackTitle="Ops, algo inesperado aconteceu"
      fallbackMessage="Recarregue ou tente novamente para continuar seus estudos visuais."
    >
      <BrowserRouter>
        <StudyProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
            <TopBar />
            <main className="flex-1">
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/categorias" element={<CategoriesPage />} />
                  <Route path="/categorias/:categorySlug" element={<CategoriesPage />} />
                  <Route path="/assunto/:topicSlug" element={<TopicStudioPage />} />
                  <Route path="/estudos" element={<StudyPlanPage />} />
                  <Route path="/gerador" element={<GeneratorPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ErrorBoundary>
            </main>
            <Footer />
            <ToastContainer />
          </div>
        </StudyProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
