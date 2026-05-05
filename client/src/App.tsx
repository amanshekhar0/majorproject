import { Routes, Route } from "react-router-dom";
import { InterviewProvider } from "./context/InterviewContext";
import LandingPage from "./pages/LandingPage";
import ArenaPage from "./pages/ArenaPage";
import ResultsPage from "./pages/ResultsPage";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
  return (
    <InterviewProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/arena" element={<ArenaPage />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </InterviewProvider>
  );
}
