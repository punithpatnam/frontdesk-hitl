/**
 * Application Routing Configuration
 * 
 * This module defines the main routing structure for the Frontdesk Supervisor UI.
 * It establishes the navigation paths between different application views and
 * provides a fallback route for unknown paths.
 * 
 * Route structure:
 * - / - Main help requests page (default)
 * - /learned - Knowledge base management
 * - /history - Request history and analytics
 * - /caller - Voice communication interface
 * - /supervisor - Supervisor dashboard
 */

import { Routes, Route, Navigate } from "react-router-dom";
import { HelpRequestsPage } from "@/pages/HelpRequestsPage";
import { LearnedAnswersPage } from "@/pages/LearnedAnswersPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { CallerPage } from "./pages/CallerPage";
import { SupervisorDashboard } from "./pages/SupervisorDashboard";

/**
 * Main application routing component.
 * 
 * Defines all application routes and their corresponding page components.
 * Includes a catch-all route that redirects unknown paths to the home page.
 * 
 * @returns JSX.Element - The complete routing configuration
 */
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
