import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import Files from './pages/Files';
import Profile from './pages/Profile';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="groups" element={<Groups />} />
        <Route path="files" element={<Files />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <AuthProvider>
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <AppRoutes />
        </Box>
      </AuthProvider>
    </LocalizationProvider>
  );
}

export default App; 