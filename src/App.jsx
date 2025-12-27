import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Rules from './pages/Rules';
import Resources from './pages/Resources';
import Cards from './pages/Cards';
import CardDetail from './pages/CardDetail';
import Play from './pages/Play';
import DraftPage from './pages/DraftPage';
import AddCard from './pages/AddCard';
import Login from './pages/Login';
import './App.css';

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 80px)',
        color: 'var(--color-gold)'
      }}>
        Loading...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="app">
            <Navbar />
            <main>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/rules" element={<Rules />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/cards" element={<Cards />} />
                  <Route path="/cards/:id" element={<CardDetail />} />
                  <Route path="/play" element={<Play />} />
                  <Route path="/draft/:draftId" element={<DraftPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/add-card"
                    element={
                      <ProtectedRoute>
                        <AddCard />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </ErrorBoundary>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
