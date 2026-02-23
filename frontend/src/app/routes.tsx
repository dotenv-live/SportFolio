import { createBrowserRouter } from "react-router";
import UserTypeSelection from "./pages/UserTypeSelection";
import AuthPage from "./pages/AuthPage";
import InvestorDashboard from "./pages/InvestorDashboard";
import AthleteMarketplace from "./pages/AthleteMarketplace";
import AthleteDetail from "./pages/AthleteDetail";
import Portfolio from "./pages/Portfolio";
import Profile from "./pages/Profile";
import AthleteDashboard from "./pages/AthleteDashboard";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: UserTypeSelection,
  },
  {
    path: "/auth",
    Component: AuthPage,
  },
  {
    path: "/investor",
    Component: Profile,
  },
  {
    path: "/dashboard",
    Component: InvestorDashboard,
  },
  {
    path: "/marketplace",
    Component: AthleteMarketplace,
  },
  {
    path: "/athlete/:id",
    Component: AthleteDetail,
  },
  {
    path: "/portfolio",
    Component: Portfolio,
  },
  {
    path: "/athlete-dashboard",
    Component: AthleteDashboard,
  },
  {
    path: "/admin",
    Component: AdminPanel,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);