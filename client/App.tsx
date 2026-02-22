import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { createRoot } from "react-dom/client";
import { Suspense, lazy } from "react";
import { Layout } from "@/components/Layout";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TransactionsPage = lazy(() => import("./pages/TransactionsPage").then(module => ({ default: module.TransactionsPage })));
const RecurringPage = lazy(() => import("./pages/RecurringPage"));
const GoalsPage = lazy(() => import("./pages/GoalsPage"));
const StatisticsPage = lazy(() => import("./pages/StatisticsPage"));
const AuditTrailPage = lazy(() => import("./pages/AuditTrailPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const WalletsPage = lazy(() => import("./pages/WalletsPage"));
const LoansPage = lazy(() => import("./pages/LoansPage"));

const queryClient = new QueryClient();

import { LoadingScreen } from "@/components/ui/LoadingScreen";

// ... (other imports remain the same, but handled by replace tool targeting)

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen size="lg" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen size="lg" />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

import { ErrorBoundary } from "@/components/ErrorBoundary";

import { DateProvider } from "@/context/DateContext";

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <DateProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Suspense fallback={<LoadingScreen size="lg" />}>
                <Routes>
                  <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                  <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/transactions"
                    element={
                      <ProtectedRoute>
                        <TransactionsPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/goals"
                    element={
                      <ProtectedRoute>
                        <GoalsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loans"
                    element={
                      <ProtectedRoute>
                        <LoansPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/statistics"
                    element={
                      <ProtectedRoute>
                        <StatisticsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/audit-trail"
                    element={
                      <ProtectedRoute>
                        <AuditTrailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/recurring"
                    element={
                      <ProtectedRoute>
                        <RecurringPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/wallets"
                    element={
                      <ProtectedRoute>
                        <WalletsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </DateProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

createRoot(document.getElementById("root")!).render(<App />);
