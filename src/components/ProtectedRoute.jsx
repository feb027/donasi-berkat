import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PropTypes from 'prop-types';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    // Tampilkan indikator loading yang lebih baik jika perlu
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-text-secondary animate-pulse">Memuat sesi pengguna...</p>
      </div>
    );
  }

  if (!user) {
    // Jika tidak ada user setelah loading selesai, redirect ke login
    // state={{ from: location }} bisa ditambahkan jika ingin redirect kembali setelah login
    return <Navigate to="/login" replace />;
  }

  // Jika ada user dan loading selesai, render children (Outlet atau komponen spesifik)
  return children ? children : <Outlet />;
}

ProtectedRoute.propTypes = {
    children: PropTypes.node // children opsional jika digunakan dengan <Outlet/>
};

export default ProtectedRoute; 