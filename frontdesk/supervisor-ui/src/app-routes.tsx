import { Routes, Route, Navigate } from "react-router-dom";
import { HelpRequestsPage } from "@/pages/HelpRequestsPage";
import { LearnedAnswersPage } from "@/pages/LearnedAnswersPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { CallerPage } from "./pages/CallerPage";
import { SupervisorDashboard } from "./pages/SupervisorDashboard";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HelpRequestsPage />} />
      <Route path="/learned" element={<LearnedAnswersPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/caller" element={<CallerPage />} />
      <Route path="/supervisor" element={<SupervisorDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
