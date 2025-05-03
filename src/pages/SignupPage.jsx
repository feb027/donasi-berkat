import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { UserIcon, EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = () => {
      const errors = {};
      if (!username || username.trim().length < 3) {
          errors.username = "Nama pengguna minimal 3 karakter.";
      } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          errors.username = "Nama pengguna hanya boleh berisi huruf, angka, dan underscore (_).";
      }
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
           errors.email = "Format email tidak valid.";
      }
      if (!password || password.length < 6) {
          errors.password = "Password minimal 6 karakter.";
      }
      if (password !== confirmPassword) {
           errors.confirmPassword = "Konfirmasi password tidak cocok.";
      }
      setFieldErrors(errors);
      return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateForm()) {
        return;
    }

    setLoading(true);
    const loadingToastId = toast.loading("Mendaftarkan...");

    try {
        const { error: signUpError } = await signUp({ email, password, username: username.trim() });

        if (signUpError) {
            toast.dismiss(loadingToastId);
            if (signUpError.message.includes("User already registered") || signUpError.message.includes("already exists")) {
                setError("Email ini sudah terdaftar. Silakan gunakan email lain atau masuk.");
            } else if (signUpError.message.includes("username")) {
                setFieldErrors(prev => ({...prev, username: "Nama pengguna ini sudah digunakan."}));
                setError("Nama pengguna sudah digunakan. Silakan pilih nama lain.");
            } else {
                setError(signUpError.message || "Terjadi kesalahan saat mendaftar.");
            }
        } else {
            toast.success("Pendaftaran berhasil! Selamat datang.", { id: loadingToastId });
            setTimeout(() => {
                 navigate('/dashboard');
             }, 500);
        }
    } catch (catchError) {
        toast.dismiss(loadingToastId);
        setError("Terjadi kesalahan tak terduga. Silakan coba lagi.");
        console.error("Unexpected signup error:", catchError);
    } finally {
         setLoading(false);
         if(toast.loading && loadingToastId){
             toast.dismiss(loadingToastId);
         }
    }
  };

  const handleInputChange = (setter, fieldName) => (e) => {
      setter(e.target.value);
      if (fieldName === 'password' && fieldErrors.confirmPassword) {
          setFieldErrors(prev => ({ ...prev, confirmPassword: null }));
      }
      if (fieldErrors[fieldName]) {
          setFieldErrors(prev => ({ ...prev, [fieldName]: null }));
      }
  };

  const errorVariants = {
      hidden: { opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.2 } },
      visible: { opacity: 1, height: 'auto', marginTop: '0.375rem', transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-100 p-4">
      <motion.div
         initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
         className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-100"
      >
         <div className="flex justify-center mb-6">
              <img src="../src/assets/logo-kecil.png" alt="DonasiBerkat Logo" className="h-12 w-auto" />
         </div>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1 text-center">Buat Akun Baru</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Bergabunglah untuk berbagi dan menerima kebaikan.</p>

        {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-md mb-5 text-sm flex items-center gap-2 justify-center"
            >
                 <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0"/>
                 <span>{error}</span>
             </motion.p>
         )}

        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">Nama Pengguna</label>
                <div className="relative">
                    <UserIcon className="pointer-events-none w-5 h-5 text-gray-400 absolute top-1/2 transform -translate-y-1/2 left-3" />
                    <input type="text" id="username" value={username}
                        onChange={handleInputChange(setUsername, 'username')}
                        required disabled={loading}
                        className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out disabled:bg-gray-100 disabled:opacity-70 ${fieldErrors.username ? 'border-red-500 ring-red-500/30' : 'border-gray-300'}`}
                        placeholder="pilih_nama_unik" aria-invalid={!!fieldErrors.username} aria-describedby="username-error"
                    />
                </div>
                <AnimatePresence>
                    {fieldErrors.username && (
                        <motion.p variants={errorVariants} initial="hidden" animate="visible" exit="hidden" id="username-error" className="text-xs text-red-600">
                             {fieldErrors.username}
                         </motion.p>
                    )}
                </AnimatePresence>
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                    <EnvelopeIcon className="pointer-events-none w-5 h-5 text-gray-400 absolute top-1/2 transform -translate-y-1/2 left-3" />
                    <input type="email" id="email" value={email}
                        onChange={handleInputChange(setEmail, 'email')}
                        required disabled={loading}
                        className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out disabled:bg-gray-100 disabled:opacity-70 ${fieldErrors.email ? 'border-red-500 ring-red-500/30' : 'border-gray-300'}`}
                        placeholder="email@contoh.com" aria-invalid={!!fieldErrors.email} aria-describedby="email-error"
                    />
                </div>
                 <AnimatePresence>
                    {fieldErrors.email && (
                         <motion.p variants={errorVariants} initial="hidden" animate="visible" exit="hidden" id="email-error" className="text-xs text-red-600">
                             {fieldErrors.email}
                         </motion.p>
                    )}
                </AnimatePresence>
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                    <LockClosedIcon className="pointer-events-none w-5 h-5 text-gray-400 absolute top-1/2 transform -translate-y-1/2 left-3" />
                    <input type={showPassword ? "text" : "password"} id="password" value={password}
                        onChange={handleInputChange(setPassword, 'password')}
                        required disabled={loading}
                        className={`w-full pl-10 pr-10 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out disabled:bg-gray-100 disabled:opacity-70 ${fieldErrors.password ? 'border-red-500 ring-red-500/30' : 'border-gray-300'}`}
                        placeholder="Minimal 6 karakter" aria-invalid={!!fieldErrors.password} aria-describedby="password-error"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 transition-colors duration-150"
                        aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} disabled={loading}
                    > {showPassword ? ( <EyeSlashIcon className="h-5 w-5" /> ) : ( <EyeIcon className="h-5 w-5" /> )} </button>
                </div>
                 <AnimatePresence>
                    {fieldErrors.password && (
                         <motion.p variants={errorVariants} initial="hidden" animate="visible" exit="hidden" id="password-error" className="text-xs text-red-600">
                             {fieldErrors.password}
                         </motion.p>
                     )}
                 </AnimatePresence>
            </div>

            <div>
                 <label htmlFor="confirmPassword"className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password</label>
                 <div className="relative">
                     <LockClosedIcon className="pointer-events-none w-5 h-5 text-gray-400 absolute top-1/2 transform -translate-y-1/2 left-3" />
                     <input
                         type={showConfirmPassword ? "text" : "password"}
                         id="confirmPassword" value={confirmPassword}
                         onChange={handleInputChange(setConfirmPassword, 'confirmPassword')}
                         required disabled={loading}
                         className={`w-full pl-10 pr-10 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out disabled:bg-gray-100 disabled:opacity-70 ${fieldErrors.confirmPassword ? 'border-red-500 ring-red-500/30' : 'border-gray-300'}`}
                         placeholder="Ulangi password"
                         aria-invalid={!!fieldErrors.confirmPassword}
                         aria-describedby="confirmPassword-error"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 transition-colors duration-150"
                        aria-label={showConfirmPassword ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
                        disabled={loading}
                    > {showConfirmPassword ? ( <EyeSlashIcon className="h-5 w-5" /> ) : ( <EyeIcon className="h-5 w-5" /> )} </button>
                 </div>
                  <AnimatePresence>
                     {fieldErrors.confirmPassword && (
                         <motion.p variants={errorVariants} initial="hidden" animate="visible" exit="hidden" id="confirmPassword-error" className="text-xs text-red-600">
                            {fieldErrors.confirmPassword}
                         </motion.p>
                     )}
                 </AnimatePresence>
             </div>

            <Button type="submit" variant="primary" size="lg" className="w-full inline-flex items-center justify-center gap-2 mt-2 transition-opacity duration-150" disabled={loading}>
                {loading && <ArrowPathIcon className="animate-spin h-5 w-5 mr-1" />}
                {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
            </Button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
            Sudah punya akun?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-emerald-600 hover:underline transition-colors duration-150">
                Masuk di sini
            </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default SignupPage; 