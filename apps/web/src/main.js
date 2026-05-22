import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from './routes.js';
import { queryClient } from './lib/queryClient.js';
// Import auth store to trigger its module-level side effects:
// — restores the persisted access token into the api client
// — registers the token-refresh and session-expired callbacks
import './features/auth/auth.store.js';
import './index.css';
const rootEl = document.getElementById('root');
if (!rootEl)
    throw new Error('Root element #root not found');
createRoot(rootEl).render(_jsx(StrictMode, { children: _jsx(QueryClientProvider, { client: queryClient, children: _jsx(RouterProvider, { router: router }) }) }));
//# sourceMappingURL=main.js.map