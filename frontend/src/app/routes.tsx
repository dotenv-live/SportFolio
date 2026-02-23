import { createBrowserRouter } from "react-router";
import UserTypeSelection from "./pages/UserTypeSelection";
import AuthPage from "./pages/AuthPage";
import Home from "./pages/Home";
import InvestorDashboard from "./pages/InvestorDashboard";
import AthleteMarketplace from "./pages/AthleteMarketplace";
import AthleteDetail from "./pages/AthleteDetail";
import Trading from "./pages/Trading";
import Portfolio from "./pages/Portfolio";
import Profile from "./pages/Profile";
import AthleteDashboard from "./pages/AthleteDashboard";
import AdminPanel from "./pages/AdminPanel";
import Admin from "./pages/Admin";
import Analytics from "./pages/Analytics";
import Watchlist from "./pages/Watchlist";
import Compare from "./pages/Compare";
import Notifications from "./pages/Notifications";
import Alerts from "./pages/Alerts";
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
    path: "/home",
    Component: Home,
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
    path: "/trading/:id",
    Component: Trading,
  },
  {
    path: "/portfolio",
    Component: Portfolio,
  },
  {
    path: "/analytics",
    Component: Analytics,
  },
  {
    path: "/watchlist",
    Component: Watchlist,
  },
  {
    path: "/compare",
    Component: Compare,
  },
  {
    path: "/notifications",
    Component: Notifications,
  },
  {
    path: "/alerts",
    Component: Alerts,
  },
  {
    path: "/athlete-dashboard",
    Component: AthleteDashboard,
  },
  {
    path: "/admin",
    Component: Admin,
  },
  {
    path: "/admin-old",
    Component: AdminPanel,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);