import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AuthPage } from './pages/AuthPage';
import { QuizGenerator } from './pages/QuizGenerator';
import { QuizActive } from './pages/QuizActive';
import { QuizResults } from './pages/QuizResults';
import { QuizHistory } from './pages/QuizHistory';
import { Analytics } from './pages/Analytics';

const ProtectedLayout: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-zinc-400 text-xs">
        <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-3"></span>
        Loading QuizGen AI...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#09090B] text-zinc-100 font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Header title={title} />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage />} />

          <Route
            path="/"
            element={
              <ProtectedLayout title="Quiz Generator">
                <QuizGenerator />
              </ProtectedLayout>
            }
          />

          <Route
            path="/quiz/active"
            element={
              <ProtectedLayout title="Active Quiz Session">
                <QuizActive />
              </ProtectedLayout>
            }
          />

          <Route
            path="/quiz/results/:attemptId"
            element={
              <ProtectedLayout title="Quiz Performance Results">
                <QuizResults />
              </ProtectedLayout>
            }
          />

          <Route
            path="/history"
            element={
              <ProtectedLayout title="Quiz Attempt History">
                <QuizHistory />
              </ProtectedLayout>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedLayout title="Performance & Learning Analytics">
                <Analytics />
              </ProtectedLayout>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
