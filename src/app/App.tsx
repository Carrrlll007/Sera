import React, { Suspense } from 'react';
import { Providers } from './Providers';
import { Router } from './Router';

function App() {
  return (
    <Providers>
      <Suspense fallback={
        <div className="h-screen flex items-center justify-center bg-zinc-50">
          <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <Router />
      </Suspense>
    </Providers>
  );
}

export default App;
