import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './providers/AuthProvider';
import { AppShell } from './AppShell';

// Lazy load pages
const HomePage = React.lazy(() => import('../pages/HomePage').then(m => ({ default: m.HomePage })));
const TasksPage = React.lazy(() => import('../pages/TasksPage').then(m => ({ default: m.TasksPage })));
const CasesPage = React.lazy(() => import('../pages/CasesPage').then(m => ({ default: m.CasesPage })));
const CalendarPage = React.lazy(() => import('../pages/CalendarPage').then(m => ({ default: m.CalendarPage })));
const DocumentsPage = React.lazy(() => import('../pages/DocumentsPage').then(m => ({ default: m.DocumentsPage })));
const FamilyPage = React.lazy(() => import('../pages/FamilyPage').then(m => ({ default: m.FamilyPage })));
const AskSeraPage = React.lazy(() => import('../pages/AskSeraPage').then(m => ({ default: m.AskSeraPage })));
const AuthPage = React.lazy(() => import('../pages/AuthPage').then(m => ({ default: m.AuthPage })));

export const Router: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" />} />
      
      <Route element={user ? <AppShell /> : <Navigate to="/auth" />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/family" element={<FamilyPage />} />
        <Route path="/ask" element={<AskSeraPage />} />
      </Route>
    </Routes>
  );
};
