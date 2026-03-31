import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { RequireAuth, RequireApproved, RequireAdmin, PublicOnly } from "@/components/AuthGuards";
import { DealerLayout } from "@/components/DealerLayout";
import { AdminLayout } from "@/components/AdminLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import PendingApproval from "./pages/PendingApproval";
import ResetPassword from "./pages/ResetPassword";
import Marketplace from "./pages/Marketplace";
import UpgradePlan from "./pages/UpgradePlan";
import Dashboard from "./pages/Dashboard";
import Wallet from "./pages/Wallet";
import Purchases from "./pages/Purchases";
import Settings from "./pages/Settings";
import AutoPay from "./pages/AutoPay";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminDealers from "./pages/admin/AdminDealers";
import AdminLeads from "./pages/admin/AdminLeads";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
            <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Auth required but not necessarily approved */}
            <Route path="/pending-approval" element={<RequireAuth><PendingApproval /></RequireAuth>} />

            {/* Dealer routes - require approved */}
            <Route path="/marketplace" element={<RequireAuth><RequireApproved><DealerLayout><Marketplace /></DealerLayout></RequireApproved></RequireAuth>} />
            <Route path="/upgrade-plan" element={<RequireAuth><RequireApproved><DealerLayout><UpgradePlan /></DealerLayout></RequireApproved></RequireAuth>} />
            <Route path="/dashboard" element={<RequireAuth><RequireApproved><DealerLayout><Dashboard /></DealerLayout></RequireApproved></RequireAuth>} />
            <Route path="/wallet" element={<RequireAuth><RequireApproved><DealerLayout><Wallet /></DealerLayout></RequireApproved></RequireAuth>} />
            <Route path="/purchases" element={<RequireAuth><RequireApproved><DealerLayout><Purchases /></DealerLayout></RequireApproved></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth><RequireApproved><DealerLayout><Settings /></DealerLayout></RequireApproved></RequireAuth>} />
            <Route path="/auto-pay" element={<RequireAuth><RequireApproved><DealerLayout><AutoPay /></DealerLayout></RequireApproved></RequireAuth>} />

            {/* Admin routes */}
            <Route path="/admin" element={<RequireAuth><RequireAdmin><AdminLayout><AdminDashboard /></AdminLayout></RequireAdmin></RequireAuth>} />
            <Route path="/admin/dealers" element={<RequireAuth><RequireAdmin><AdminLayout><AdminDealers /></AdminLayout></RequireAdmin></RequireAuth>} />
            <Route path="/admin/leads" element={<RequireAuth><RequireAdmin><AdminLayout><AdminLeads /></AdminLayout></RequireAdmin></RequireAuth>} />

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
