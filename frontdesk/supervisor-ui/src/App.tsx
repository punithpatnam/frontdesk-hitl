import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/app-routes";
import "@/styles/globals.css";
import { TopNav } from "@/components/TopNav";
import { HealthBadge } from "@/components/HealthBadge";

export default function App() {
  return (
    <BrowserRouter>
      <TopNav />
      <AppRoutes />
      <HealthBadge />
    </BrowserRouter>
  );
}
