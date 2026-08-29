import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Upload from './pages/Upload';
import History from './pages/History';
import Report from './pages/Report';
import './App.css';

function Navbar() {
  const navigate = useNavigate();
  const name = localStorage.getItem('name') || 'User';

  function logout() {
    localStorage.clear();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">Road<span>tection</span></div>
      <div className="navbar-links">
        <NavLink to="/upload"  className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>Upload</NavLink>
        <NavLink to="/history" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>History</NavLink>
        <span style={{color:'#bee3f8',fontSize:13,marginLeft:8}}>Hi, {name}</span>
        <button className="nav-logout" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function Layout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"   element={<Login />} />
        <Route path="/upload"  element={<PrivateRoute><Layout><Upload /></Layout></PrivateRoute>} />
        <Route path="/history" element={<PrivateRoute><Layout><History /></Layout></PrivateRoute>} />
        <Route path="/report/:id" element={<PrivateRoute><Layout><Report /></Layout></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/upload" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
