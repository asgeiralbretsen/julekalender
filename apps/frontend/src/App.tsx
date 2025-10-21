import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import CalendarPage from './pages/CalendarPage'
import HealthPage from './pages/HealthPage'
import PostsPage from './pages/PostsPage'
import NotFoundPage from './pages/NotFoundPage'
import BlurGuessGame from './components/BlurGuessGame'
import ProtectedRoute from './components/layout/ProtectedRoute'
import { useUserSync } from './hooks/useUserSync'
import { svgCursorUrl } from "./components/cursor"; 
import { useEffect, useMemo } from 'react'

function App() {
  // This will automatically sync users when they log in
  useUserSync();

  const cursor = useMemo(
    () =>
      svgCursorUrl({
        primary: "#ED5564",
        secondary: "#E6E9ED",
        size: 40,
      }),
    []
  );

  useEffect(() => {
    document.documentElement.style.setProperty("--app-cursor", cursor);
  }, [cursor]);

  return (
    <Router>
      <div className="min-h-screen">
        <Header />
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route 
            path="/calendar" 
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/posts" 
            element={
              <ProtectedRoute>
                <PostsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/health" 
            element={
              <ProtectedRoute>
                <HealthPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/game/blurGuessGame" 
            element={
              <ProtectedRoute>
                <BlurGuessGame />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App;
