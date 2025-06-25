import React from 'react';
import { ThemeProvider } from 'next-themes';

interface ThemeProviderWrapperProps {
  children: React.ReactNode;
}

export function ThemeProviderWrapper({ children }: ThemeProviderWrapperProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
