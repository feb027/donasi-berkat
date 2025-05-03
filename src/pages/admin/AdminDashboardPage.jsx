import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Adjust path as needed
import { supabase } from '../../lib/supabaseClient'; // Import Supabase client
import { UserGroupIcon, GiftIcon, InboxArrowDownIcon, ArrowPathIcon, ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline'; // Icons for cards & links
import { Link } from 'react-router-dom'; // Import Link for quick links

// Helper component for Stat Card Skeleton
function StatCardSkeleton() {
    return (
        <div className="bg-white p-5 rounded-lg shadow border border-gray-100 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div> {/* Title */} 
            <div className="h-8 bg-gray-300 rounded w-1/4"></div> {/* Count */} 
        </div>
    );
}

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    } catch {
        return 'Invalid Date';
    }
}

// Helper to get initials
const getInitials = (name) => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

function AdminDashboardPage() {
    const { profile } = useAuth(); // Get profile for greeting
    const [stats, setStats] = useState({ users: null, activeDonations: null, pendingRequests: null });
    const [loadingStats, setLoadingStats] = useState(true);
    const [errorStats, setErrorStats] = useState(null);

    // --- NEW: State for Recent Users ---
    const [recentUsers, setRecentUsers] = useState([]);
    const [loadingRecentUsers, setLoadingRecentUsers] = useState(true);
    const [errorRecentUsers, setErrorRecentUsers] = useState(null);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoadingStats(true);
            setLoadingRecentUsers(true);
            setErrorStats(null);
            setErrorRecentUsers(null);

            try {
                // Fetch counts and recent users concurrently
                const [userCountRes, donationCountRes, requestCountRes, recentUsersRes] = await Promise.all([
                    supabase.from('profil').select('*', { count: 'exact', head: true }),
                    supabase.from('donasi').select('*', { count: 'exact', head: true }).eq('status', 'tersedia'),
                    supabase.from('permintaan_donasi').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                    supabase.from('profil').select('id, nama_pengguna, avatar_url, created_at').order('created_at', { ascending: false }).limit(5)
                ]);

                // Check for stats errors
                if (userCountRes.error) throw new Error(`Stats Error (Users): ${userCountRes.error.message}`);
                if (donationCountRes.error) throw new Error(`Stats Error (Donations): ${donationCountRes.error.message}`);
                if (requestCountRes.error) throw new Error(`Stats Error (Requests): ${requestCountRes.error.message}`);

                setStats({
                    users: userCountRes.count,
                    activeDonations: donationCountRes.count,
                    pendingRequests: requestCountRes.count
                });
                setLoadingStats(false); // Stats loaded

                // Check for recent users error
                if (recentUsersRes.error) throw new Error(`Recent Users Error: ${recentUsersRes.error.message}`);
                setRecentUsers(recentUsersRes.data || []);
                setLoadingRecentUsers(false); // Recent users loaded

            } catch (err) {
                console.error("Error fetching dashboard stats:", err);
                
                // Set specific errors or a general one
                if (err.message.startsWith('Stats Error')) {
                    setErrorStats(err.message);
                    setLoadingStats(false); // Stop stats loading on error
                } else if (err.message.startsWith('Recent Users Error')) {
                    setErrorRecentUsers(err.message);
                    setLoadingRecentUsers(false); // Stop recent users loading on error
                } else {
                    setErrorStats("Gagal memuat statistik.");
                    setErrorRecentUsers("Gagal memuat pengguna terbaru.");
                    setLoadingStats(false);
                    setLoadingRecentUsers(false);
                }
            }
        };

        fetchAllData();
    }, []); // Run once on mount

    return (
        <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Selamat Datang, {profile?.nama_pengguna || 'Admin'}!
            </h1>

            <p className="text-gray-600">
                Ini adalah dashboard admin. Dari sini Anda dapat mengelola berbagai aspek aplikasi.
            </p>

            {/* Display error if fetching stats failed */} 
            {errorStats && !loadingStats && (
                 <div className="rounded-md bg-red-50 p-4 border border-red-200">
                     <p className="text-sm text-red-700">Error memuat statistik: {errorStats}</p>
                 </div>
            )}

            {/* Statistics Cards */} 
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {/* Users Card */} 
                 {loadingStats ? <StatCardSkeleton /> : (
                    <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100 flex items-start gap-4 transition hover:shadow-emerald-100 hover:border-emerald-200">
                         <div className="flex-shrink-0 p-3 bg-emerald-100 rounded-lg">
                            <UserGroupIcon className="h-6 w-6 text-emerald-600" />
                         </div>
                         <div>
                             <h3 className="text-sm font-medium text-gray-500 mb-1">Total Pengguna</h3>
                             <p className="text-3xl font-bold text-gray-800">{stats.users ?? '-'}</p>
                         </div>
                     </div>
                 )}

                 {/* Active Donations Card */} 
                 {loadingStats ? <StatCardSkeleton /> : (
                     <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100 flex items-start gap-4 transition hover:shadow-blue-100 hover:border-blue-200">
                         <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
                            <GiftIcon className="h-6 w-6 text-blue-600" />
                         </div>
                         <div>
                             <h3 className="text-sm font-medium text-gray-500 mb-1">Total Donasi Aktif</h3>
                             <p className="text-3xl font-bold text-gray-800">{stats.activeDonations ?? '-'}</p>
                         </div>
                     </div>
                 )}

                 {/* Pending Requests Card */} 
                 {loadingStats ? <StatCardSkeleton /> : (
                     <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100 flex items-start gap-4 transition hover:shadow-yellow-100 hover:border-yellow-200">
                         <div className="flex-shrink-0 p-3 bg-yellow-100 rounded-lg">
                            <InboxArrowDownIcon className="h-6 w-6 text-yellow-600" />
                         </div>
                         <div>
                             <h3 className="text-sm font-medium text-gray-500 mb-1">Permintaan Pending</h3>
                             <p className="text-3xl font-bold text-gray-800">{stats.pendingRequests ?? '-'}</p>
                         </div>
                     </div>
                 )}
            </div>

            {/* --- NEW: Main Content Area (Recent Users & Quick Links) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">

                {/* Recent Users Section (Takes 2 columns on large screens) */}
                <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Pengguna Terbaru</h3>
                    {loadingRecentUsers ? (
                         <div className="space-y-3 animate-pulse">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                                    <div className="flex-grow space-y-1">
                                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                                    </div>
                                </div>
                            ))}
                         </div>
                    ) : errorRecentUsers ? (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-100">Error: {errorRecentUsers}</div>
                    ) : recentUsers.length === 0 ? (
                         <p className="text-sm text-gray-500 italic">Belum ada pengguna yang terdaftar.</p>
                    ) : (
                         <ul className="divide-y divide-gray-100">
                            {recentUsers.map(user => (
                                <li key={user.id} className="py-3 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        {user.avatar_url ? (
                                            <img className="h-10 w-10 rounded-full object-cover bg-gray-100 ring-1 ring-gray-200" src={user.avatar_url} alt="Avatar" />
                                        ) : (
                                            <span className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-semibold ring-1 ring-emerald-200">{getInitials(user.nama_pengguna)}</span>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 truncate">{user.nama_pengguna}</p>
                                            <p className="text-xs text-gray-500">Bergabung: {formatDate(user.created_at)}</p>
                                        </div>
                                    </div>
                                     <Link to={`/admin/users/${user.id}`} className="text-xs text-emerald-600 hover:text-emerald-800 font-medium p-1 rounded hover:bg-emerald-50" title="Lihat Detail">
                                         <ArrowRightIcon className="h-4 w-4" />
                                     </Link>
                                </li>
                            ))}
                         </ul>
                    )}
                     {/* Optional: Link to full users page */} 
                     {!loadingRecentUsers && !errorRecentUsers && recentUsers.length > 0 && (
                         <div className="mt-4 text-right">
                            <Link to="/admin/users" className="text-sm font-medium text-emerald-600 hover:text-emerald-800 hover:underline">
                                Lihat Semua Pengguna &rarr;
                             </Link>
                         </div>
                     )}
                </div>

                {/* Quick Links Section (Takes 1 column) */}
                 <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100">
                     <h3 className="text-lg font-semibold text-gray-800 mb-4">Akses Cepat</h3>
                     <div className="space-y-3">
                         <Link to="/admin/users" className="flex items-center justify-between p-3 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 rounded-lg transition text-gray-700 hover:text-emerald-700 group">
                             <span className="flex items-center gap-2 font-medium">
                                <UserGroupIcon className="h-5 w-5 text-gray-400 group-hover:text-emerald-600" />
                                Kelola Pengguna
                             </span>
                             <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-emerald-600" />
                         </Link>
                          <Link to="/admin/donations" className="flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg transition text-gray-700 hover:text-blue-700 group">
                             <span className="flex items-center gap-2 font-medium">
                                <GiftIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                                Kelola Donasi
                             </span>
                             <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                         </Link>
                          <Link to="/admin/badges" className="flex items-center justify-between p-3 bg-gray-50 hover:bg-yellow-50 border border-gray-200 hover:border-yellow-200 rounded-lg transition text-gray-700 hover:text-yellow-700 group">
                             <span className="flex items-center gap-2 font-medium">
                                <SparklesIcon className="h-5 w-5 text-gray-400 group-hover:text-yellow-600" />
                                Kelola Badge
                             </span>
                             <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-yellow-600" />
                         </Link>
                         {/* Add more links as needed */}
                     </div>
                 </div>

            </div>

            <div className="mt-8 text-sm text-gray-500">
                Pilih menu di sidebar kiri untuk mulai mengelola.
            </div>
        </div>
    );
}

export default AdminDashboardPage; 