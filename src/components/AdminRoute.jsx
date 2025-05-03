import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PropTypes from 'prop-types';

function AdminRoute() {
  const { user, profile, loading } = useAuth();

  // Show loading state or similar while auth context is initializing
  if (loading) {
    // Optional: Replace with a proper loading spinner component
    return <div className="flex justify-center items-center h-screen">Memeriksa akses...</div>;
  }

  // Check if user is logged in and has the admin role
  const isAdmin = user && profile?.role === 'admin';

  // If user is admin, render the nested routes
  // Otherwise, redirect to the home page (or another appropriate page)
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}

AdminRoute.propTypes = {
  // If you were passing props like element={...}, you'd add them here.
  // Since we use <Outlet />, no specific element prop is needed.
};

export default AdminRoute; 