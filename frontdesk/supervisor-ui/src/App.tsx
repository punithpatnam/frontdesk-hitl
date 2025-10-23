/**
 * Main Application Component
 * 
 * This is the root component of the Frontdesk Supervisor UI application.
 * It sets up the routing infrastructure and renders the core layout components
 * that are present across all pages.
 * 
 * The application provides:
 * - Navigation bar for page routing
 * - Main content area with route-based rendering
 * - System health monitoring badge
 * - Floating call widget for voice interactions
 */

import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/app-routes";
import "@/styles/globals.css";
import { TopNav } from "@/components/TopNav";
import { HealthBadge } from "@/components/HealthBadge";
import { FloatingCallWidget } from "@/components/FloatingCallWidget";

/**
 * Root application component that provides the main layout structure.
 * 
 * @returns JSX.Element - The complete application layout with routing
 */
export default function App() {
  return (
    <BrowserRouter>
      <TopNav />
      <AppRoutes />
      <HealthBadge />
      <FloatingCallWidget />
    </BrowserRouter>
  );
}
