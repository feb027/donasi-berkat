import React, { useState, useEffect, useRef, Fragment } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import Button from '../components/ui/Button';
import {
  ArrowPathIcon, UserCircleIcon, CheckIcon, PhotoIcon,
  IdentificationIcon, AtSymbolIcon, LockClosedIcon, ArrowUpTrayIcon,
  ExclamationTriangleIcon, TrashIcon, EyeIcon, EyeSlashIcon,
  PencilIcon, // For Bio
  XMarkIcon // For closing modal
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css'; // Import crop styles

// Helper function for class names
function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Minimum password length
const MIN_PASSWORD_LENGTH = 6;
const MAX_AVATAR_SIZE_MB = 5;
const ASPECT_RATIO = 1; // Square crop
const MIN_DIMENSION = 150; // Minimum dimension for cropped image

// Helper function to generate cropped image blob (requires canvas)
function getCroppedImg(
  image, // HTMLImageElement
  crop, // PixelCrop (Type hint, not needed for runtime import)
  fileName // string
) {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  ctx.save();

  // Move the crop origin to the canvas origin (0,0)
  ctx.translate(-cropX, -cropY);
  // Move the origin to the center of the original position
  ctx.translate(centerX, centerY);
  // Rotate around the center
  // ctx.rotate((rotate * Math.PI) / 180); // Rotation logic if needed
  // Move the origin back and draw the image
  ctx.translate(-centerX, -centerY);
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight
  );

  ctx.restore();

  // Return a promise that resolves with the blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        blob.name = fileName;
        resolve(blob);
      },
      'image/png', // or 'image/jpeg' depending on preference
      0.9 // Quality for JPEG, ignored for PNG
    );
  });
}

function EditProfilePage() {
  const { user, profile, setProfile, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  // --- State Variables ---
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // Avatar (Original File, Cropped Blob, Preview URL)
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarSrc, setAvatarSrc] = useState(''); // Source for the cropper
  const [avatarPreview, setAvatarPreview] = useState(null); // URL for display
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const fileInputRef = useRef(null);
  const imgRef = useRef(null); // Ref for the image in the cropper

  // Cropping State
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [isCroppingModalOpen, setIsCroppingModalOpen] = useState(false);

  // Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Delete Account
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  // Initial Fetch State
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);

  // Validation Errors
  const [validationErrors, setValidationErrors] = useState({});

  // --- Effects ---
  useEffect(() => {
    if (!authLoading && profile) {
      setUsername(profile.nama_pengguna || '');
      setFullName(profile.nama_lengkap || '');
      setBio(profile.bio || '');
      setAvatarPreview(profile.avatar_url || null); // Set initial avatar display URL
      setIsFetchingProfile(false);
    } else if (!authLoading && !profile) {
      setIsFetchingProfile(false);
      toast.error('Gagal memuat data profil. Silakan coba lagi.');
      navigate('/');
    }
  }, [profile, authLoading, navigate]);

  // --- Validation --- 
  const validateProfile = () => {
    const errors = {};
    if (!username.trim()) errors.username = 'Nama pengguna tidak boleh kosong.';
    // Add username format/length validation if needed
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = () => {
    const errors = {};
    if (!newPassword) errors.newPassword = 'Password baru tidak boleh kosong.';
    else if (newPassword.length < MIN_PASSWORD_LENGTH) errors.newPassword = `Password baru minimal ${MIN_PASSWORD_LENGTH} karakter.`;
    if (newPassword !== confirmPassword) errors.confirmPassword = 'Konfirmasi password tidak cocok.';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --- Handlers ---

  // Update Profile Info (Username, Full Name, Bio)
  const handleUpdateProfileInfo = async () => {
    if (!validateProfile()) return;
    if (!user) {
      toast.error('Sesi tidak valid. Silakan login kembali.');
      return;
    }

    setIsProfileLoading(true);
    const loadingToastId = toast.loading('Memperbarui info profil...');

    try {
      const updates = {
        id: user.id,
        nama_pengguna: username.trim(),
        nama_lengkap: fullName.trim() || null,
        bio: bio.trim() || null,
        updated_at: new Date(),
      };

      // Create a diff to only update changed fields
      const changedUpdates = Object.keys(updates).reduce((acc, key) => {
         if (key === 'id' || key === 'updated_at' || updates[key] !== (profile[key] ?? (key === 'bio' ? '' : null) ?? null)) {
            acc[key] = updates[key];
         } // Handle nullish coalescing for potential null values in profile
         return acc;
      }, {});

      if (Object.keys(changedUpdates).length <= 2) { // Only id and updated_at
         toast('Tidak ada perubahan informasi profil untuk disimpan.', { id: loadingToastId, icon: 'ℹ️' });
         setIsProfileLoading(false);
         return;
      }

      const { data, error } = await supabase
        .from('profil')
        .upsert(changedUpdates)
        .select()
        .single();

      if (error) {
        if (error.code === '23505' && error.message.includes('profil_nama_pengguna_key')) {
          setValidationErrors({ username: 'Nama pengguna sudah digunakan.' });
          throw new Error('Nama pengguna sudah digunakan.');
        } else if (error.message.includes('check constraint')) { // Example general constraint check
            throw new Error('Input tidak valid, periksa kembali data Anda.');
        } else {
            throw new Error(error.message || 'Gagal menyimpan profil.'); // Rethrow generic Supabase errors
        }
      }

      if (data) setProfile(data);
      toast.success('Info profil berhasil diperbarui!', { id: loadingToastId });

    } catch (error) {
      console.error('Error updating profile info:', error);
      toast.error(error.message || 'Terjadi kesalahan saat memperbarui profil.', { id: loadingToastId });
    } finally {
      setIsProfileLoading(false);
    }
  };

  // Handle Avatar File Selection (Opens Cropper)
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Size validation
    if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
        toast.error(`Ukuran file maksimal ${MAX_AVATAR_SIZE_MB}MB.`);
        if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
        return;
    }

    if (file.type.startsWith('image/')) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarSrc(reader.result?.toString() || ''); // Set source for cropper
        setIsCroppingModalOpen(true); // Open the cropping modal
        setCrop(undefined); // Reset crop state
        setCompletedCrop(undefined);
      };
      reader.readAsDataURL(file);
      setValidationErrors({});
    } else {
      toast.error('Hanya file gambar (JPG, PNG, GIF) yang diperbolehkan.');
       if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Cropper: Center crop on image load
  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
        toast.error(`Dimensi gambar minimal ${MIN_DIMENSION}x${MIN_DIMENSION} piksel.`);
        setIsCroppingModalOpen(false); // Close modal if image too small
        setAvatarSrc('');
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
    }
    const crop = centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90, // Initial crop selection size (%)
            },
            ASPECT_RATIO,
            width,
            height
        ),
        width,
        height
    );
    setCrop(crop);
  }

  // Handle Final Cropped Avatar Upload
  const handleAvatarUpdate = async () => {
      if (!completedCrop || !imgRef.current || !avatarSrc) {
          toast.error('Gagal memproses gambar. Coba pilih lagi.');
          return;
      }
      if (!user) {
         toast.error('Sesi tidak valid. Silakan login kembali.');
         return;
      }

      setIsAvatarLoading(true);
      setIsCroppingModalOpen(false); // Close modal before upload
      const loadingToastId = toast.loading('Mengunggah foto profil...');

      try {
          const originalFileName = avatarFile?.name || 'avatar.png';
          const croppedBlob = await getCroppedImg(
              imgRef.current,
              completedCrop,
              originalFileName // Pass original name for potential use or keep generic
          );

         const fileExt = croppedBlob.name.split('.').pop() || 'png'; // Use extension from name or default
         const fileName = `${Date.now()}_cropped.${fileExt}`;
         const filePath = `public/${user.id}/${fileName}`;

         // --- Check size again after crop? Optional, but good practice --- 
         if (croppedBlob.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
            throw new Error(`Ukuran file setelah crop melebihi ${MAX_AVATAR_SIZE_MB}MB.`);
         }

         // Upload CROPPED blob to Supabase Storage
         const { error: uploadError } = await supabase.storage
             .from('donation-images')
             .upload(filePath, croppedBlob, { contentType: croppedBlob.type }); // Specify content type
          if (uploadError) {
             // Granular storage error handling
             if (uploadError.message.includes('Bucket not found')) {
                 throw new Error('Kesalahan konfigurasi penyimpanan (Bucket not found).');
             } else if (uploadError.message.includes('policy')) {
                  throw new Error('Anda tidak memiliki izin untuk mengunggah.');
             } else {
                  throw new Error(uploadError.message || 'Gagal mengunggah file.');
             }
          }

         // Get Public URL
         const { data: urlData } = supabase.storage
             .from('donation-images')
             .getPublicUrl(filePath);
         if (!urlData || !urlData.publicUrl) throw new Error('Gagal mendapatkan URL publik avatar.');
         const newAvatarUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`; // Add timestamp for cache busting

         // Update profile table
         const { data, error: updateError } = await supabase
            .from('profil')
            .update({ avatar_url: newAvatarUrl, updated_at: new Date() })
            .eq('id', user.id)
            .select()
            .single();
          if (updateError) throw updateError;

         if (data) {
            setProfile(data); // Update context
            setAvatarPreview(newAvatarUrl); // Update local preview immediately
         }
         setAvatarFile(null); // Clear original file state
         setAvatarSrc(''); // Clear cropper source
         setCompletedCrop(undefined);
         setCrop(undefined);
         if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
         toast.success('Foto profil berhasil diperbarui!', { id: loadingToastId });

      } catch (error) {
         console.error('Error uploading avatar:', error);
         toast.error(error.message || 'Gagal mengunggah foto profil.', { id: loadingToastId });
         // Reset states on error
         setIsCroppingModalOpen(false);
         setAvatarSrc('');
         setCompletedCrop(undefined);
         setCrop(undefined);
         if(fileInputRef.current) fileInputRef.current.value = "";
      } finally {
          setIsAvatarLoading(false);
      }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    if (!user) {
        toast.error('Sesi tidak valid. Silakan login kembali.');
        return;
    }

    setIsPasswordLoading(true);
    const loadingToastId = toast.loading('Mengubah password...');

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
         // Granular Auth errors
         if (error.message.includes('Password should be at least 6 characters')) {
             setValidationErrors({ newPassword: `Password baru minimal ${MIN_PASSWORD_LENGTH} karakter.` });
             throw new Error(`Password baru minimal ${MIN_PASSWORD_LENGTH} karakter.`);
         } else if (error.message.includes('same password')) { // Might need adjustment based on exact Supabase message
             setValidationErrors({ newPassword: 'Password baru tidak boleh sama dengan password lama.'});
             throw new Error('Password baru tidak boleh sama dengan password lama.');
         } else {
             throw new Error(error.message || 'Gagal mengubah password.');
         }
      }

      toast.success('Password berhasil diubah!', { id: loadingToastId });
      setNewPassword('');
      setConfirmPassword('');
      setValidationErrors({});

    } catch (error) {
      console.error('Error changing password:', error);
      // Ensure error message is shown, even if handled above
      toast.error(error.message || 'Terjadi kesalahan saat mengubah password.', { id: loadingToastId });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  // Handle Delete Account
  const handleDeleteAccount = async () => {
      if (deleteConfirmInput !== profile?.nama_pengguna) {
          toast.error('Konfirmasi nama pengguna tidak cocok.');
          return;
      }
      setIsDeleteLoading(true);
      const loadingToastId = toast.loading('Menghapus akun...');

      try {
         // --- Placeholder: Backend Function Call --- 
         // This function MUST be implemented securely on your backend (e.g., Supabase Edge Function).
         // It should perform actions like:
         // 1. Verify user authentication/authorization.
         // 2. Delete the user from Supabase Auth (`supabase.auth.admin.deleteUser(userId)`).
         // 3. Delete the corresponding row from the `profil` table.
         // 4. Delete any associated data in other tables (donasi, permintaan_donasi, user_badges, etc.) according to your app's logic (cascade delete or manual).
         // 5. Delete user's files from Supabase Storage (e.g., avatars bucket: `supabase.storage.from('avatars').remove([folderPath])`).
         // 6. Return success or error status.
         console.warn(`Placeholder: Invoking backend function 'delete-user' for user ID: ${user.id}`);
         // Example call: 
         // const { data, error: functionError } = await supabase.functions.invoke('delete-user');
         // if (functionError) throw functionError;

         // --- Simulation (REMOVE IN PRODUCTION) ---
         await new Promise(resolve => setTimeout(resolve, 2000));
         // --- End Simulation ---

         toast.success('Akun berhasil dihapus.', { id: loadingToastId });
         setIsDeleteDialogOpen(false);
         await signOut(); 
         navigate('/', { replace: true }); 

      } catch (error) {
          console.error('Error deleting account (Placeholder Triggered):', error);
          // Provide more specific feedback if possible based on function error
          toast.error(error.message || 'Gagal menghapus akun. Terjadi kesalahan di server.', { id: loadingToastId });
          setIsDeleteLoading(false);
      } 
      // Loading state ideally handled by success/error or page navigation
  };

  // --- Skeleton Loader ---
  if (isFetchingProfile || authLoading) {
    // Skeleton remains largely the same, maybe slightly adjusted for new layout
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-8 text-gray-800">Pengaturan Akun</h1>
        <div className="space-y-10">
            {/* Avatar Skeleton */} 
             <div className="bg-white shadow-lg rounded-xl p-6 md:p-10 animate-pulse">
                 <h2 className="text-lg font-semibold text-gray-400 mb-6 h-6 w-1/4 bg-gray-200 rounded"></h2>
                 <div className="flex items-center gap-5">
                     <div className="h-20 w-20 rounded-full bg-gray-200"></div>
                     <div className="flex-grow space-y-2">
                         <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                         <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                     </div>
                 </div>
             </div>
            {/* Profile Info Skeleton */} 
            <div className="bg-white shadow-lg rounded-xl p-6 md:p-10 animate-pulse">
                 <h2 className="text-lg font-semibold text-gray-400 mb-6 h-6 w-1/3 bg-gray-200 rounded"></h2>
                 <div className="space-y-8">
                    {[...Array(3)].map((_, i) => (
                         <div key={i} >
                             <div className="h-5 bg-gray-200 rounded w-1/4 mb-2"></div>
                             <div className="h-10 bg-gray-200 rounded-md w-full"></div>
                         </div>
                    ))}
                    <div className="flex justify-end pt-5 mt-4">
                        <div className="h-9 bg-gray-300 rounded-md w-32"></div>
                    </div>
                 </div>
            </div>
             {/* Password Skeleton */}
            <div className="bg-white shadow-lg rounded-xl p-6 md:p-10 animate-pulse">
                 <h2 className="text-lg font-semibold text-gray-400 mb-6 h-6 w-1/3 bg-gray-200 rounded"></h2>
                 <div className="space-y-8">
                    {[...Array(2)].map((_, i) => (
                         <div key={i} >
                             <div className="h-5 bg-gray-200 rounded w-1/4 mb-2"></div>
                             <div className="h-10 bg-gray-200 rounded-md w-full"></div>
                         </div>
                    ))}
                     <div className="flex justify-end pt-5 mt-4">
                         <div className="h-9 bg-gray-300 rounded-md w-32"></div>
                     </div>
                </div>
            </div>
             {/* Danger Zone Skeleton */} 
             <div className="bg-red-50 border border-red-200 rounded-xl p-6 md:p-10 animate-pulse">
                 <div className="h-6 w-1/3 bg-red-200 rounded mb-4"></div>
                 <div className="h-5 w-full bg-red-100 rounded mb-4"></div>
                 <div className="h-9 w-36 bg-red-200 rounded"></div>
             </div>
        </div>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-8 text-gray-800">Pengaturan Akun</h1>

      {/* --- Avatar Section (Moved Up) --- */} 
      <div className="bg-white shadow-lg rounded-xl mb-10 overflow-hidden">
         <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700">Foto Profil</h2>
          </div>
          <div className="p-6 md:p-8">
             <div className="flex flex-col sm:flex-row items-center gap-6">
                 <div className="flex-shrink-0 relative group">
                     {/* Display Area */}
                     <div className="h-24 w-24 rounded-full ring-2 ring-offset-2 ring-emerald-300 bg-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                            <UserCircleIcon className="h-20 w-20 text-gray-400" />
                        )}
                     </div>
                      {/* Change Button */}
                      <button 
                         type="button"
                         onClick={() => fileInputRef.current?.click()} 
                         className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-md border border-gray-300 hover:bg-gray-100 transition text-gray-600 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary opacity-80 group-hover:opacity-100"
                         title="Ubah Foto Profil"
                         aria-label="Ubah Foto Profil"
                      >
                          <PencilIcon className="h-5 w-5" />
                      </button>
                 </div>
                 <div className="flex-grow text-center sm:text-left">
                    <h3 className="text-md font-medium text-gray-800 mb-1">Ubah Foto Profil Anda</h3>
                    <p className="text-sm text-gray-500 mb-3">Klik ikon pensil untuk memilih gambar baru.</p>
                    <p className="text-xs text-gray-400">Format: JPG, PNG, GIF. Maks: {MAX_AVATAR_SIZE_MB}MB. Min: {MIN_DIMENSION}x{MIN_DIMENSION}px.</p>
                 </div>
                  {/* Hidden File Input */} 
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/gif"
                    className="hidden"
                   />
             </div>
           </div>
      </div>

       {/* --- Profile Information Section --- */}
       <div className="bg-white shadow-lg rounded-xl mb-10 overflow-hidden">
           <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200">
             <h2 className="text-lg font-semibold text-gray-700">Informasi Profil</h2>
           </div>
           <div className="p-6 md:p-8 space-y-8">
              {/* Username Input */}
              <div>
                 <label htmlFor="username" className="block text-sm font-semibold text-gray-600 mb-2">
                   Nama Pengguna <span className="text-red-500">*</span>
                 </label>
                  <div className="relative">
                     <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                       <AtSymbolIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                     </div>
                     <input
                       type="text"
                       id="username"
                       name="username"
                       value={username}
                       onChange={(e) => setUsername(e.target.value)}
                       required
                       className={classNames(
                          "block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm",
                          validationErrors.username ? 'border-red-500' : 'border-gray-300'
                        )}
                       placeholder="cth: johndoe123"
                       aria-describedby="username-desc"
                       aria-invalid={!!validationErrors.username}
                     />
                 </div>
                  {validationErrors.username && <p className="mt-1 text-xs text-red-600">{validationErrors.username}</p>}
                 <p className="mt-2 text-xs text-gray-500" id="username-desc">Nama unik Anda di platform ini. Harus unik.</p>
              </div>

              {/* Full Name Input */}
               <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-600 mb-2">
                  Nama Lengkap
                </label>
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <IdentificationIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="cth: John Doe"
                      aria-describedby="fullName-desc"
                    />
                 </div>
                 <p className="mt-2 text-xs text-gray-500" id="fullName-desc">Nama asli Anda, akan ditampilkan di profil Anda (opsional).</p>
               </div>

             {/* Bio Input */}
              <div>
                 <label htmlFor="bio" className="block text-sm font-semibold text-gray-600 mb-2">
                   Bio Singkat
                 </label>
                 <div className="relative">
                      <div className="pointer-events-none absolute top-3 left-0 flex items-center pl-3">
                         <PencilIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <textarea
                         id="bio"
                         name="bio"
                         rows={3}
                         value={bio}
                         onChange={(e) => setBio(e.target.value)}
                         className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                         placeholder="Ceritakan sedikit tentang diri Anda... (opsional)"
                         aria-describedby="bio-desc"
                      />
                  </div>
                  <p className="mt-2 text-xs text-gray-500" id="bio-desc">Akan ditampilkan di halaman profil Anda.</p>
              </div>

              {/* Submit Profile Info Button */}
               <div className="flex justify-end pt-5 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleUpdateProfileInfo}
                    disabled={isProfileLoading || isAvatarLoading || isPasswordLoading || isDeleteLoading}
                    className="inline-flex items-center justify-center px-5"
                  >
                    {isProfileLoading ? (
                      <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                    ) : (
                      <CheckIcon className="h-5 w-5 mr-1.5" />
                    )}
                    {isProfileLoading ? 'Menyimpan Info...' : 'Simpan Informasi Profil'}
                  </Button>
                </div>
           </div>
       </div>

       {/* --- Change Password Section --- */}
       <div className="bg-white shadow-lg rounded-xl mb-10 overflow-hidden">
          <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-700">Ubah Password</h2>
          </div>
           <form onSubmit={handleChangePassword} className="p-6 md:p-8 space-y-8">
              {/* New Password Input */}
              <div>
                 <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-600 mb-2">
                   Password Baru
                 </label>
                 <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                         <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <input
                         type={showNewPassword ? 'text' : 'password'}
                         id="newPassword"
                         name="newPassword"
                         value={newPassword}
                         onChange={(e) => setNewPassword(e.target.value)}
                         required
                         className={classNames(
                           "block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm",
                           validationErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                         )}
                         placeholder="Minimal 6 karakter"
                         aria-describedby="newPassword-desc"
                         aria-invalid={!!validationErrors.newPassword}
                      />
                       <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-emerald-600">
                           {showNewPassword ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>} 
                       </button>
                  </div>
                  {validationErrors.newPassword && <p className="mt-1 text-xs text-red-600">{validationErrors.newPassword}</p>}
              </div>

              {/* Confirm Password Input */}
              <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-600 mb-2">
                    Konfirmasi Password Baru
                  </label>
                  <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <input
                         type={showConfirmPassword ? 'text' : 'password'}
                         id="confirmPassword"
                         name="confirmPassword"
                         value={confirmPassword}
                         onChange={(e) => setConfirmPassword(e.target.value)}
                         required
                         className={classNames(
                            "block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm",
                            validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                          )}
                          placeholder="Ulangi password baru"
                          aria-invalid={!!validationErrors.confirmPassword}
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-emerald-600">
                          {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>} 
                      </button>
                  </div>
                  {validationErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{validationErrors.confirmPassword}</p>}
              </div>

              {/* Submit Password Change Button */}
              <div className="flex justify-end pt-5 border-t border-gray-100">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={isPasswordLoading || isProfileLoading || isAvatarLoading || isDeleteLoading}
                  className="inline-flex items-center justify-center px-5"
                >
                  {isPasswordLoading ? (
                    <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                  ) : (
                    <LockClosedIcon className="h-5 w-5 mr-1.5" />
                  )}
                  {isPasswordLoading ? 'Menyimpan...' : 'Ubah Password'}
                </Button>
              </div>
          </form>
       </div>

       {/* --- Danger Zone Section --- */}
        <div className="bg-red-50 border-2 border-red-200/80 rounded-xl mb-10 overflow-hidden">
           <div className="bg-red-100/60 px-6 py-4 border-b border-red-200/80">
               <h2 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                   <ExclamationTriangleIcon className="h-5 w-5 text-red-600"/> Zona Berbahaya
               </h2>
           </div>
            <div className="p-6 md:p-8 space-y-4">
               <p className="text-sm text-red-700">
                   Tindakan berikut bersifat permanen dan tidak dapat dibatalkan. Harap pertimbangkan dengan matang.
               </p>
               <div className="flex justify-start">
                   <Button
                      type="button"
                      variant="danger"
                      onClick={() => setIsDeleteDialogOpen(true)}
                      disabled={isDeleteLoading || isProfileLoading || isAvatarLoading || isPasswordLoading}
                      className="inline-flex items-center justify-center px-5"
                   >
                       <TrashIcon className="h-5 w-5 mr-1.5"/>
                      Hapus Akun Saya
                   </Button>
               </div>
           </div>
        </div>

       {/* --- Modals --- */}

       {/* Cropping Modal */} 
       <Transition appear show={isCroppingModalOpen} as={Fragment}>
         <Dialog as="div" className="relative z-50" onClose={() => setIsCroppingModalOpen(false)}>
             <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0" >
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
            </Transition.Child>
             <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                     <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95" >
                        <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                             <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4 flex justify-between items-center">
                                Potong Gambar Profil
                                <button onClick={() => setIsCroppingModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-5 w-5"/></button>
                            </Dialog.Title>
                            {avatarSrc && (
                                <div className="mt-2 flex flex-col items-center">
                                     <ReactCrop
                                        crop={crop}
                                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                                        onComplete={(c) => setCompletedCrop(c)}
                                        aspect={ASPECT_RATIO}
                                        minWidth={MIN_DIMENSION} // Min crop selection size
                                        minHeight={MIN_DIMENSION}
                                        circularCrop // Optional: for circular appearance
                                        className="max-w-full max-h-[60vh]"
                                    >
                                         <img
                                            ref={imgRef}
                                            alt="Crop me" 
                                            src={avatarSrc}
                                            style={{ maxHeight: '70vh' }}
                                            onLoad={onImageLoad} 
                                        />
                                     </ReactCrop>
                                     <p className="text-xs text-gray-500 mt-3">Geser dan ubah ukuran kotak untuk memotong.</p>
                                </div>
                            )}
                             <div className="mt-6 flex justify-end gap-3">
                                <Button type="button" variant="secondary" onClick={() => setIsCroppingModalOpen(false)} disabled={isAvatarLoading} > Batal </Button>
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={handleAvatarUpdate} 
                                    disabled={!completedCrop || isAvatarLoading}
                                    className="inline-flex items-center justify-center gap-2"
                                >
                                     {isAvatarLoading ? <ArrowPathIcon className="animate-spin h-5 w-5"/> : <CheckIcon className="h-5 w-5"/>}
                                     {isAvatarLoading ? 'Memproses...' : 'Terapkan Potongan'}
                                </Button>
                             </div>
                         </Dialog.Panel>
                     </Transition.Child>
                 </div>
             </div>
         </Dialog>
       </Transition>

       {/* Delete Confirmation Modal */} 
       <Transition appear show={isDeleteDialogOpen} as={Fragment}>
           <Dialog as="div" className="relative z-50" onClose={() => !isDeleteLoading && setIsDeleteDialogOpen(false)}>
               {/* Backdrop */} 
               <Transition.Child
                   as={Fragment}
                   enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                   leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
               >
                   <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
               </Transition.Child>

               {/* Modal Content */} 
               <div className="fixed inset-0 overflow-y-auto">
                   <div className="flex min-h-full items-center justify-center p-4 text-center">
                       <Transition.Child
                           as={Fragment}
                           enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                           leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                       >
                           <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                               <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-red-800 flex items-center gap-2">
                                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600"/> Konfirmasi Hapus Akun
                               </Dialog.Title>
                               <div className="mt-4 space-y-4">
                                   <p className="text-sm text-gray-600">
                                       Ini adalah aksi permanen. Semua data Anda (profil, donasi, permintaan, dll.) akan dihapus.
                                        Untuk melanjutkan, ketik nama pengguna Anda (<strong className="font-medium text-gray-800">{profile?.nama_pengguna}</strong>) di bawah ini.
                                   </p>
                                    <div>
                                        <label htmlFor="deleteConfirm" className="sr-only">Ketik nama pengguna untuk konfirmasi</label>
                                        <input
                                            type="text"
                                            id="deleteConfirm"
                                            value={deleteConfirmInput}
                                            onChange={(e) => setDeleteConfirmInput(e.target.value)}
                                            placeholder={profile?.nama_pengguna}
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                                            disabled={isDeleteLoading}
                                        />
                                    </div>
                               </div>

                               <div className="mt-6 flex justify-end gap-3">
                                   <Button
                                       type="button"
                                       variant="secondary"
                                       onClick={() => setIsDeleteDialogOpen(false)}
                                       disabled={isDeleteLoading}
                                   >
                                       Batal
                                   </Button>
                                    <Button
                                       type="button"
                                       variant="danger"
                                       onClick={handleDeleteAccount}
                                       disabled={isDeleteLoading || deleteConfirmInput !== profile?.nama_pengguna}
                                       className="inline-flex items-center justify-center"
                                   >
                                       {isDeleteLoading ? (
                                           <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                                       ) : (
                                           <TrashIcon className="h-5 w-5 mr-1.5" />
                                       )}
                                       {isDeleteLoading ? 'Menghapus...' : 'Ya, Hapus Akun Saya'}
                                   </Button>
                               </div>
                           </Dialog.Panel>
                       </Transition.Child>
                   </div>
               </div>
           </Dialog>
       </Transition>

   </div> // End Container
 );
}

export default EditProfilePage; 