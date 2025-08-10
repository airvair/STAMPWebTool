import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AnalysisProvider } from '@/context/AnalysisContext';
import { ProjectsProvider } from '@/context/ProjectsContext';
import App from './App';
import '@/styles/main.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ProjectsProvider>
        <AnalysisProvider>
          <App />
        </AnalysisProvider>
      </ProjectsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
