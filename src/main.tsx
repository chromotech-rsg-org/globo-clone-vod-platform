import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeVercelOptimizations } from "./utils/vercelOptimizations";
import { logDomainInfo } from "./utils/domainHealth";

// Initialize optimizations and logging
logDomainInfo();
initializeVercelOptimizations();

createRoot(document.getElementById("root")!).render(<App />);
