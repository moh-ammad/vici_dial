import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Agents from './pages/Agents.jsx';
import { List, Users } from 'lucide-react';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link
              to="/agents"
              className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
            >
              <span className="text-emerald-600">Vici Dial</span>{" "}
              <span className="text-black">•</span> Agents
            </Link>

            <nav className="flex items-center gap-6">
              <Link
                to="/agents"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                <Users size={18} /> Agents
              </Link>

              <Link
                to="/agents"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                <List size={18} /> Overview
              </Link>
            </nav>
          </div>
        </header>



        <main className="max-w-7xl mx-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/agents" replace />} />
            <Route path="/agents" element={<Agents />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
