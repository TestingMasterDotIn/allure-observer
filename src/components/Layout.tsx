
import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Home, 
  Search, 
  AlertTriangle, 
  Zap, 
  Clock, 
  TrendingUp, 
  Settings 
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Badge } from '@/components/ui/badge';

const Layout: React.FC = () => {
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: Home,
      description: 'Overview & Summary'
    },
    {
      name: 'Test Explorer',
      path: '/test-explorer',
      icon: Search,
      description: 'Browse Tests'
    },
    {
      name: 'Failures & Defects',
      path: '/failures',
      icon: AlertTriangle,
      description: 'Error Analysis'
    },
    {
      name: 'Flaky Insights',
      path: '/flaky-insights',
      icon: Zap,
      description: 'Test Stability'
    },
    {
      name: 'Timeline',
      path: '/timeline',
      icon: Clock,
      description: 'Execution Flow'
    },
    {
      name: 'History & Trends',
      path: '/history',
      icon: TrendingUp,
      description: 'Performance Trends'
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings,
      description: 'Configuration'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Test Observability Dashboard</h1>
                <p className="text-xs text-muted-foreground">Allure Report Analytics</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-xs">
                v0.1.0
              </Badge>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                              (item.path === '/dashboard' && location.pathname === '/');
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex-shrink-0 flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                    isActive
                      ? 'bg-background text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <div className="hidden sm:block">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                  <span className="sm:hidden">{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
