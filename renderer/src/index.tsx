import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import * as Sentry from '@sentry/electron/renderer';
import { SENTRY_DSN } from '../../models/constants';

Sentry.init({
  dsn: SENTRY_DSN,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
