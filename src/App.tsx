"use client"
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import Home from '@/pages/index';
import Dashboard from '@/pages/dashboard';
import Deployment from '@/pages/deployments/deployment';
import DeployThirdParty from '@/pages/deploythirdparty';
import Deploy from '@/pages/deploy';


function App() {
  return (
    <BrowserRouter>
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
