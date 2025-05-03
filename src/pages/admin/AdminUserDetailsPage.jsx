import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient'; // Adjust path if needed
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon, UserCircleIcon, ArrowPathIcon, EnvelopeIcon, CalendarDaysIcon, ShieldCheckIcon, PencilIcon, TagIcon, MapPinIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';

// Helper to format date (reuse from other pages or define locally)
function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    } catch { return 'Invalid Date'; }
}

// Helper to get initials (reuse or define locally)
const getInitials = (name) => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

// Skeleton Loader for User Details
function UserDetailsSkeleton() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div> {/* Back button placeholder */}
            <div className="bg-white shadow-xl rounded-xl border border-gray-100 p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                    <div className="h-20 w-20 bg-gray-300 rounded-full"></div>
                    <div className="space-y-2">
                        <div className="h-7 bg-gray-300 rounded w-48"></div>
                        <div className="h-4 bg-gray-300 rounded w-32"></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="space-y-1">
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                            <div className="h-5 bg-gray-300 rounded w-full"></div>
                        </div>
                    ))}
                    <div className="md:col-span-2 space-y-1">
                         <div className="h-4 bg-gray-200 rounded w-16"></div>
                         <div className="h-16 bg-gray-300 rounded w-full"></div>
                    </div>
                </div>
            </div>
            {/* Placeholder for activity/actions */}
             <div className="bg-white shadow-xl rounded-xl border border-gray-100 p-6 md:p-8">
                 <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
                 <div className="h-10 bg-gray-200 rounded w-full"></div>
             </div>
        </div>
    );
}

function AdminUserDetailsPage() {
    const { userId } = useParams();
    const [userProfile, setUserProfile] = useState(null);
    const [userAuthData, setUserAuthData] = useState(null); // For email, etc.
    const [userActivity, setUserActivity] = useState({ donation_count: 0, request_count: 0 });
    const [loadingActivity, setLoadingActivity] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch user data
    useEffect(() => {
        const fetchUserData = async () => {
            if (!userId) {
                setError("User ID tidak ditemukan.");
                setLoading(false);
                return;
            }
            setLoading(true);
            setLoadingActivity(true);
            setError(null);

            try {
                // 1. Fetch Profile Data
                const { data: profileData, error: profileError } = await supabase
                    .from('profil')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (profileError) {
                     if (profileError.code === 'PGRST116') throw new Error("Profil pengguna tidak ditemukan.");
                    throw profileError;
                }
                setUserProfile(profileData);

                // 2. Fetch Auth Data (Requires Admin Privileges - Use RPC)
                //    We'll use an RPC function `get_user_auth_data` which needs to be created.
                //    This function should take a user_id and return { email, phone, etc. }
                //    It must run with security definer or bypass RLS.
                 try {
                     const { data: authData, error: rpcError } = await supabase
                         .rpc('get_user_auth_data', { user_id_input: userId });
 
                     if (rpcError) {
                         console.warn("RPC Error fetching auth data:", rpcError);
                         toast.error(`Gagal memuat data auth: ${rpcError.message}`);
                         // Continue without auth data, profile is already loaded
                         setUserAuthData(null); 
                     } else {
                         setUserAuthData(authData);
                     }
                 } catch (rpcCatchError) {
                     console.error("Error calling RPC function:", rpcCatchError);
                     toast.error("Kesalahan sistem saat mengambil data auth.");
                     setUserAuthData(null);
                 }

                // 3. Fetch Activity Summary (RPC)
                try {
                    const { data: activityData, error: activityError } = await supabase
                        .rpc('get_user_activity_summary', { user_id_input: userId });
                    
                    if (activityError) {
                         console.warn("RPC Error fetching activity summary:", activityError);
                         // Don't block the page for this, just show default counts
                         toast.error(`Gagal memuat ringkasan aktivitas: ${activityError.message}`);
                         setUserActivity({ donation_count: 'N/A', request_count: 'N/A' }); 
                    } else {
                         setUserActivity(activityData || { donation_count: 0, request_count: 0 });
                    }
                } catch (activityCatchError) {
                     console.error("Error calling activity RPC:", activityCatchError);
                     toast.error("Kesalahan sistem saat mengambil aktivitas.");
                     setUserActivity({ donation_count: 'N/A', request_count: 'N/A' });
                }

            } catch (err) {
                console.error("Error fetching user details:", err);
                setError(err.message || "Gagal memuat detail pengguna.");
                setUserProfile(null);
                setUserAuthData(null);
                setUserActivity({ donation_count: 'N/A', request_count: 'N/A' });
            } finally {
                setLoading(false);
                setLoadingActivity(false);
            }
        };

        fetchUserData();
    }, [userId]);

    if (loading) {
        return <div className="p-4 md:p-6"><UserDetailsSkeleton /></div>;
    }

    if (error) {
        return (
            <div className="p-4 md:p-6 space-y-4">
                 <Link to="/admin/users" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                    <ArrowLeftIcon className="h-4 w-4"/> Kembali ke Daftar Pengguna
                </Link>
                <div className="bg-red-50 text-red-700 p-4 rounded border border-red-200">Error: {error}</div>
            </div>
        );
    }

    if (!userProfile) {
         return (
            <div className="p-4 md:p-6 space-y-4">
                 <Link to="/admin/users" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                    <ArrowLeftIcon className="h-4 w-4"/> Kembali ke Daftar Pengguna
                </Link>
                <div className="bg-yellow-50 text-yellow-700 p-4 rounded border border-yellow-200">Data profil untuk pengguna ini tidak ditemukan.</div>
            </div>
        );
    }

    // Combine data for display
    const displayData = {
        ...userProfile,
        email: userAuthData?.email || 'N/A',
        // Add other auth fields if needed, e.g., phone: userAuthData?.phone
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
             {/* Back Button */}
            <div>
                <Link to="/admin/users" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                    <ArrowLeftIcon className="h-4 w-4"/> Kembali ke Daftar Pengguna
                </Link>
            </div>

            {/* User Header & Basic Info Card */}
            <div className="bg-white shadow-xl rounded-xl border border-gray-100 p-6 md:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                     {/* Avatar */} 
                    <div className="flex-shrink-0 h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center ring-2 ring-offset-2 ring-emerald-200">
                        {displayData.avatar_url ? (
                            <img src={displayData.avatar_url} alt={displayData.nama_pengguna} className="h-full w-full rounded-full object-cover"/>
                        ) : (
                            <span className="text-3xl font-semibold text-emerald-700">{getInitials(displayData.nama_pengguna)}</span>
                        )}
                    </div>
                     {/* Name & Role */} 
                    <div className="flex-grow">
                        <h1 className="text-2xl font-bold text-gray-800">{displayData.nama_pengguna}</h1>
                        <p className="text-sm text-gray-500 capitalize">
                            Role: <span className={`font-medium ${displayData.role === 'admin' ? 'text-orange-600' : 'text-gray-700'}`}>{displayData.role}</span>
                        </p>
                         {/* Maybe add Edit Role button here later */} 
                    </div>
                     {/* Placeholder for Quick Actions */} 
                     {/* <div className="flex-shrink-0"> <Button>Aksi Cepat</Button> </div> */}
                </div>

                {/* Detailed Information Grid */}
                 <h2 className="text-lg font-semibold text-gray-700 mb-4">Informasi Detail</h2>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                    <div className="border-b pb-3">
                        <dt className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1.5"><UserCircleIcon className="h-4 w-4"/> Nama Lengkap</dt>
                        <dd className="mt-1 text-base text-gray-900">{displayData.nama_lengkap || <span className="italic text-gray-400">--</span>}</dd>
                    </div>
                    <div className="border-b pb-3">
                        <dt className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1.5"><EnvelopeIcon className="h-4 w-4"/> Email</dt>
                        <dd className="mt-1 text-base text-gray-900">{displayData.email}</dd>
                    </div>
                    <div className="border-b pb-3">
                        <dt className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1.5"><CalendarDaysIcon className="h-4 w-4"/> Bergabung Sejak</dt>
                        <dd className="mt-1 text-base text-gray-900">{formatDate(displayData.created_at)}</dd>
                    </div>
                     <div className="border-b pb-3">
                        <dt className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1.5"><ShieldCheckIcon className="h-4 w-4"/> Role</dt>
                        <dd className="mt-1 text-base text-gray-900 capitalize">{displayData.role}</dd>
                    </div>
                     {/* Add more fields as needed (e.g., last sign in, phone) */} 
                    <div className="md:col-span-2 border-b pb-3">
                         <dt className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1.5"><PencilIcon className="h-4 w-4"/> Bio</dt>
                         <dd className="mt-1 text-base text-gray-900 whitespace-pre-wrap break-words">{displayData.bio || <span className="italic text-gray-400">Bio kosong</span>}</dd>
                    </div>
                </dl>
            </div>

            {/* User Activity Section */}
            <div className="bg-white shadow-xl rounded-xl border border-gray-100 p-6 md:p-8">
                 <h2 className="text-lg font-semibold text-gray-700 mb-4">Ringkasan Aktivitas</h2>
                 {loadingActivity ? (
                     <div className="flex items-center text-gray-500">
                         <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" /> Memuat aktivitas...
                     </div>
                 ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Donation Count */}
                        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                            <dt className="text-sm font-medium text-emerald-800">Jumlah Donasi Dibuat</dt>
                            <dd className="mt-1 text-2xl font-semibold text-emerald-900">{userActivity.donation_count}</dd>
                            {/* Optional Link to filter donations */}
                            {/* <Link to={`/admin/donations?donorId=${userId}`} className="text-xs text-emerald-700 hover:underline mt-1 block">Lihat Donasi</Link> */}
                        </div>
                        {/* Request Count */}
                        <div className="bg-sky-50 p-4 rounded-lg border border-sky-100">
                            <dt className="text-sm font-medium text-sky-800">Jumlah Permintaan Diajukan</dt>
                            <dd className="mt-1 text-2xl font-semibold text-sky-900">{userActivity.request_count}</dd>
                             {/* Optional Link? Maybe not needed */}
                        </div>
                    </div>
                 )}
            </div>

        </div>
    );
}

export default AdminUserDetailsPage; 