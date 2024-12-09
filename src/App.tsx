"use client"
import { Routes, Route, BrowserRouter, useNavigate } from 'react-router-dom';
import Home from '@/pages/index';
import Dashboard from '@/pages/dashboard';
import Deployment from '@/pages/deployments/deployment';
import DeployThirdParty from '@/pages/deploythirdparty';
import { useEffect } from 'react';
import Deploy from '@/pages/deploy';

// Create a new component to handle redirects
function RedirectHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check for stored redirect
    const redirect = sessionStorage.getItem('redirect');
    if (redirect) {
      sessionStorage.removeItem('redirect');
      // Use navigate to handle the redirect
      navigate(redirect, { replace: true });
    }
  }, [navigate]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <RedirectHandler />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/deployment" element={<Deployment />} />
        <Route path="/deploythirdparty" element={<DeployThirdParty />} />
        <Route path="/deploy" element={<Deploy />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
