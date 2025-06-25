
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import { ThemeProviderWrapper } from "./components/ThemeProvider";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import TestExplorer from "./pages/TestExplorer";
import Failures from "./pages/Failures";
import FlakyInsights from "./pages/FlakyInsights";
import Timeline from "./pages/Timeline";
import History from "./pages/History";
import SettingsNew from "./pages/SettingsNew";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProviderWrapper>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <DataProvider>
          <HashRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="test-explorer" element={<TestExplorer />} />
                <Route path="failures" element={<Failures />} />
                <Route path="flaky-insights" element={<FlakyInsights />} />
                <Route path="timeline" element={<Timeline />} />
                <Route path="history" element={<History />} />
                <Route path="settings" element={<SettingsNew />} />
                <Route path="home" element={<Home />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
        </DataProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProviderWrapper>
);

export default App;
