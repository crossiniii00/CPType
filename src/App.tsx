import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Layout & UI Components
import Landing from './pages/Landing';
import TypingTest from './pages/TypingTest';
import Results from './pages/Results';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [userName, setUserName] = useState('');
  const [attempts, setAttempts] = useState<any[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState(0);

  return (
    <Router>
      <div className="min-height-screen bg-brand-black text-brand-soft-white selection:bg-[#7D52FF]/30">
        <Routes>
          <Route path="/" element={<Landing setUserName={setUserName} userName={userName} />} />
          <Route path="/test" element={userName ? <TypingTest userName={userName} attempt={currentAttempt + 1} /> : <Navigate to="/" />} />
          <Route path="/results" element={<Results attempts={attempts} />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
