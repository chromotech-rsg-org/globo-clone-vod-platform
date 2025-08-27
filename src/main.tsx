import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeVercelOptimizations } from "./utils/vercelOptimizations";
import { logDomainInfo } from "./utils/domainHealth";
import { initializeNotificationSystem } from "./utils/notificationCache";

// Initialize optimizations and logging
logDomainInfo();
initializeVercelOptimizations();
initializeNotificationSystem();

createRoot(document.getElementById("root")!).render(<App />);
