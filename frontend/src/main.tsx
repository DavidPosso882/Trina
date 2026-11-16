import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider, keepPreviousData } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import './index.css';
import { router } from './routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, placeholderData: keepPreviousData, refetchOnWindowFocus: false }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
