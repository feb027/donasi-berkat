import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadingToastId = toast.loading("Memproses masuk...");

    try {
      const { error: signInError } = await signIn({ email, password });

      if (signInError) {
        toast.dismiss(loadingToastId);
        if (signInError.message.includes("Invalid login credentials")) {
          toast.error("Email atau password salah. Silakan coba lagi.");
        } else {
          toast.error(signInError.message || "Gagal masuk. Terjadi kesalahan.");
        }
      } else {
        toast.success("Berhasil masuk! Mengarahkan...", { id: loadingToastId });
        navigate('/');
      }
    } catch (catchError) {
      toast.dismiss(loadingToastId);
      toast.error("Terjadi kesalahan tak terduga.");
      console.error("Unexpected login error:", catchError);
    } finally {
      setLoading(false);
      setTimeout(() => toast.dismiss(loadingToastId), 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-100 p-4">
      <div
        className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-100"
      >
        <div className="flex justify-center mb-6">
          <img src="../src/assets/logo-kecil.png" alt="DonasiBerkat Logo" className="h-12 w-auto" />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1 text-center">Selamat Datang Kembali</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Masuk untuk melanjutkan ke dashboard Anda.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <EnvelopeIcon className="pointer-events-none w-5 h-5 text-gray-400 absolute top-1/2 transform -translate-y-1/2 left-3" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out disabled:bg-gray-100 disabled:opacity-70 border-gray-300`}
                placeholder="email@contoh.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <Link
                to="/lupa-password"
                className="text-xs font-medium text-primary hover:text-emerald-600 hover:underline transition-colors duration-150"
                tabIndex={-1}
              >
                Lupa Password?
              </Link>
            </div>
            <div className="relative">
              <LockClosedIcon className="pointer-events-none w-5 h-5 text-gray-400 absolute top-1/2 transform -translate-y-1/2 left-3" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className={`w-full pl-10 pr-10 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out disabled:bg-gray-100 disabled:opacity-70 border-gray-300`}
                placeholder="Password Anda"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 transition-colors duration-150"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full inline-flex items-center justify-center gap-2 mt-2 transition-opacity duration-150"
            disabled={loading}
          >
            {loading && <ArrowPathIcon className="animate-spin h-5 w-5 mr-1" />}
            {loading ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Belum punya akun?{' '}
          <Link
            to="/signup"
            className="font-medium text-primary hover:text-emerald-600 hover:underline transition-colors duration-150"
          >
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage; 