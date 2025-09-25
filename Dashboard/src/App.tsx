import { Toaster } from "@/components/ui/toaster"; import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Animals from "./pages/Animals";
import Environment from "./pages/Environment";
import Compliance from "./pages/Compliance";
import Training from "./pages/Training";
import Collaboration from "./pages/Collaboration";
import Analytics from "./pages/Analytics";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth Routes - Start Here */}
          <Route path="/" element={<SignIn />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard" element={
            <SidebarProvider>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </SidebarProvider>
          } />
          <Route path="/animals" element={
            <SidebarProvider>
              <DashboardLayout>
                <Animals />
              </DashboardLayout>
            </SidebarProvider>
          } />
          <Route path="/environment" element={
            <SidebarProvider>
              <DashboardLayout>
                <Environment />
              </DashboardLayout>
            </SidebarProvider>
          } />
          <Route path="/compliance" element={
            <SidebarProvider>
              <DashboardLayout>
                <Compliance />
              </DashboardLayout>
            </SidebarProvider>
          } />
          <Route path="/training" element={
            <SidebarProvider>
              <DashboardLayout>
                <Training />
              </DashboardLayout>
            </SidebarProvider>
          } />
          <Route path="/collaboration" element={
            <SidebarProvider>
              <DashboardLayout>
                <Collaboration />
              </DashboardLayout>
            </SidebarProvider>
          } />
          <Route path="/analytics" element={
            <SidebarProvider>
              <DashboardLayout>
                <Analytics />
              </DashboardLayout>
            </SidebarProvider>
          } />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;