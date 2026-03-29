import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import { Toaster } from 'sonner';

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        {children}
        <Toaster position="top-right" expand={false} richColors />
      </AuthProvider>
    </BrowserRouter>
  );
};
