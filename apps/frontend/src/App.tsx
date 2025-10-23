import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import CalendarPage from "./pages/CalendarPage";
import NotFoundPage from "./pages/NotFoundPage";
import BlurGuessGame from "./components/BlurGuessGame";
import SongGuessGame from "./components/SongGuessGame";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { useUserSync } from "./hooks/useUserSync";
import { svgCursorUrl } from "./components/cursor";
import { useEffect, useMemo } from "react";
import { ColorMatchGame } from "./components/ColorMatch/ColorMatchGame";
import QuizGame from "./components/QuizGame";
import { TeamsNotificationGame } from "./components/TeamsNotification/TeamsNotificationGame";
import InterviewGame from "./components/InterviewGame";
import SnowflakeCatchGame from "./components/SnowflakeCatchGame";

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
            path="/game/blurGuessGame"
            element={
              <ProtectedRoute>
                <BlurGuessGame />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game/colorMatchGame"
            element={
              <ProtectedRoute>
                <ColorMatchGame />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game/songGuessGame"
            element={
              <ProtectedRoute>
                <SongGuessGame />
              </ProtectedRoute>
            }
          />

          <Route
            path="/game/quizGame"
            element={
              <ProtectedRoute>
                <QuizGame />
              </ProtectedRoute>
            }
          />

          <Route
            path="/game/teamsNotificationGame"
            element={
              <ProtectedRoute>
                <TeamsNotificationGame />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game/interviewGame"
            element={
              <ProtectedRoute>
                <InterviewGame />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game/snowflakeCatchGame"
            element={
              <ProtectedRoute>
                <SnowflakeCatchGame />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
