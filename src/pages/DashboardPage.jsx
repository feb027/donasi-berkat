import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import Button from '../components/ui/Button';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import { Tab } from '@headlessui/react';
import {
  ExclamationTriangleIcon,
  TrashIcon,
  PencilIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  InboxIcon,
  GiftIcon,
  DocumentMagnifyingGlassIcon,
  ArrowDownCircleIcon,
  XMarkIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
  TagIcon,
  MapPinIcon,
  CalendarDaysIcon,
  EyeIcon,
  BellAlertIcon,
  ChatBubbleBottomCenterTextIcon,
  CheckBadgeIcon,
  HandThumbUpIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { TagIcon as TagSolidIcon } from '@heroicons/react/20/solid';
import MyWishlistItems from '../components/MyWishlistItems';

// Helper format tanggal dari fase sebelumnya
function formatDate(dateString) {
  if (!dateString) return 'Tanggal tidak tersedia';
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric' // Format lebih ringkas
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
}

// Komponen untuk Status Badge (contoh inline)
function StatusBadge({ status }) {
  let bgColor, textColor, text, Icon;
  switch (status?.toLowerCase()) {
    // Donation Statuses
    case 'tersedia':
      bgColor = 'bg-green-100'; textColor = 'text-green-800'; text = 'Tersedia'; Icon = CheckCircleIcon; break;
    case 'dipesan':
      bgColor = 'bg-yellow-100'; textColor = 'text-yellow-800'; text = 'Dipesan'; Icon = ClockIcon; break;
    case 'didonasikan':
      bgColor = 'bg-blue-100'; textColor = 'text-blue-800'; text = 'Didonasikan'; Icon = GiftIcon; break;

    // Request Statuses
    case 'pending':
       bgColor = 'bg-orange-100'; textColor = 'text-orange-800'; text = 'Pending'; Icon = ClockIcon; break;
    // --- NEW: Status 'disetujui' ---
    case 'disetujui':
        bgColor = 'bg-sky-100'; textColor = 'text-sky-800'; text = 'Disetujui'; Icon = HandThumbUpIcon; break;
    case 'ditolak':
        bgColor = 'bg-red-100'; textColor = 'text-red-800'; text = 'Ditolak'; Icon = XCircleIcon; break;
    // --- NEW: Status 'selesai' ---
    case 'selesai':
        bgColor = 'bg-emerald-100'; textColor = 'text-emerald-800'; text = 'Selesai'; Icon = CheckBadgeIcon; break;

    default:
      bgColor = 'bg-gray-100'; textColor = 'text-gray-800'; text = status || 'Unknown'; Icon = ExclamationTriangleIcon; // Use a default icon
  }
  return (
    <span className={`inline-flex items-center gap-1.5 ${bgColor} ${textColor} px-1.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap`}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {text}
    </span>
  );
}

// --- Confirmation Modal for Delete Donation ---
function DeleteDonationConfirmationModal({ isOpen, onClose, onConfirm, isLoading }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                           Hapus Donasi
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">
                                Apakah Anda yakin ingin menghapus donasi ini? Semua data terkait (termasuk permintaan dan diskusi) akan hilang secara permanen. Aksi ini tidak dapat dibatalkan.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                    <Button
                        variant="danger"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="w-full inline-flex justify-center sm:w-auto"
                    >
                        {isLoading ? <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" /> : <TrashIcon className="h-5 w-5 mr-1" />}
                        {isLoading ? 'Menghapus...' : 'Ya, Hapus Donasi'}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full inline-flex justify-center mt-3 sm:mt-0 sm:w-auto"
                    >
                        Batal
                    </Button>
                </div>
            </div>
        </div>
    );
}

// --- Consistent Loading Placeholder ---
function LoadingPlaceholder({ text = "Memuat data..." }) {
  return (
    <div className="text-center py-10">
      <div className="flex justify-center items-center text-text-secondary">
         <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
         <span>{text}</span>
      </div>
    </div>
  );
}

// --- Consistent Error Placeholder ---
function ErrorPlaceholder({ message }) {
  return (
    <div className="text-center py-10 px-4">
       <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-100">
           <XCircleIcon className="h-5 w-5 flex-shrink-0"/>
           <span>Error: {message}</span>
       </div>
    </div>
  );
}

// --- Consistent Empty State Placeholder ---
// eslint-disable-next-line no-unused-vars
function EmptyPlaceholder({ icon: IconComponent = InboxIcon, message, children }) {
   return (
      <div className="text-center py-10 px-6 bg-gray-50/70 rounded-lg border border-dashed border-gray-300">
          <IconComponent className="h-10 w-10 mx-auto mb-3 text-gray-400" />
          <p className="text-text-secondary text-sm mb-4">{message}</p>
          {children} 
       </div>
   );
}

// --- Skeleton Loader Components ---
function DonationItemSkeleton() {
    return (
        <div className="bg-surface p-4 rounded-lg shadow border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-pulse">
            <div className="w-full sm:w-20 h-20 rounded-md flex-shrink-0 bg-gray-300"></div>
            <div className="flex-grow w-full space-y-3">
                <div className="flex justify-between items-start">
                    <div className="h-5 bg-gray-300 rounded w-3/5"></div> {/* Title placeholder */}
                    <div className="h-4 bg-gray-300 rounded-full w-16"></div> {/* Badge placeholder */}
                </div>
                <div className="h-3 bg-gray-300 rounded w-4/5"></div> {/* Meta placeholder */}
                <div className="h-3 bg-gray-300 rounded w-1/2"></div> {/* Meta placeholder shorter */}
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                    <div className="h-8 bg-gray-300 rounded w-24"></div> {/* Button placeholder */}
                    <div className="h-8 bg-gray-300 rounded w-20"></div> {/* Button placeholder */}
                    <div className="h-8 bg-gray-300 rounded w-20"></div> {/* Button placeholder */}
                </div>
            </div>
        </div>
    );
}

function RequestItemSkeleton() {
    return (
        <div className="bg-surface p-4 rounded-lg shadow border border-gray-200 flex flex-col md:flex-row justify-between items-start gap-4 animate-pulse">
            <div className="flex-grow w-full space-y-3">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div> {/* Title placeholder */}
                <div className="h-3 bg-gray-300 rounded w-1/2"></div> {/* User placeholder */}
                <div className="h-3 bg-gray-300 rounded w-1/3"></div> {/* Date placeholder */}
                <div className="h-4 bg-gray-300 rounded-full w-16 mt-1"></div> {/* Badge placeholder */}
            </div>
            <div className="flex flex-shrink-0 gap-2 mt-2 md:mt-0 self-end md:self-center">
                 <div className="h-8 bg-gray-300 rounded w-20"></div> {/* Button placeholder */}
                 <div className="h-8 bg-gray-300 rounded w-20"></div> {/* Button placeholder */}
            </div>
        </div>
    );
}

// --- Stat Card Component ---
function StatCard({ icon, title, value, color: _color = 'primary' }) {
    const colorClasses = {
        primary: 'bg-emerald-50 text-emerald-700',
        amber: 'bg-amber-50 text-amber-700',
        blue: 'bg-sky-50 text-sky-700',
    };
    const Icon = icon;
    return (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center space-x-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClasses[_color] || colorClasses.primary}`}>
                {Icon && <Icon className="h-5 w-5" />}
            </div>
            <div>
                <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                <dd className="mt-0.5 text-xl font-semibold text-gray-900">{value}</dd>
            </div>
        </div>
    );
}

// --- Placeholder Image Component (Add Pulse Animation) ---
function PlaceholderImage({ className = "" }) {
    return (
        <div className={`flex items-center justify-center bg-gray-200 text-gray-400 animate-pulse ${className}`}>
            <GiftIcon className="h-1/2 w-1/2 opacity-40" />
        </div>
    );
}

// --- Pagination Constants ---
const DONATION_LIMIT = 5;
const REQUEST_LIMIT = 5;

function DashboardPage() {
  const { user } = useAuth();
  const { startOrOpenChat } = useChat();

  // State untuk Donasi Saya
  const [myDonations, setMyDonations] = useState([]);
  const [loadingMyDonations, setLoadingMyDonations] = useState(true);
  const [errorMyDonations, setErrorMyDonations] = useState(null);
  const [myDonationsOffset, setMyDonationsOffset] = useState(0);
  const [hasMoreMyDonations, setHasMoreMyDonations] = useState(true);
  const [loadingMoreMyDonations, setLoadingMoreMyDonations] = useState(false);

  // State untuk Permintaan Diterima (Keep offset state)
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [errorRequests, setErrorRequests] = useState(null);
  const [receivedRequestsOffset, setReceivedRequestsOffset] = useState(0);
  const [hasMoreReceivedRequests, setHasMoreReceivedRequests] = useState(true);
  const [loadingMoreReceivedRequests, setLoadingMoreReceivedRequests] = useState(false);

  // State untuk aksi (Terima/Tolak)
  const [actionLoading, setActionLoading] = useState(null); // requestId being processed

  // State baru untuk Permintaan Saya
  const [mySentRequests, setMySentRequests] = useState([]);
  const [loadingSentRequests, setLoadingSentRequests] = useState(true);
  const [errorSentRequests, setErrorSentRequests] = useState(null);
  const [sentRequestsOffset, setSentRequestsOffset] = useState(0);
  const [hasMoreSentRequests, setHasMoreSentRequests] = useState(true);
  const [loadingMoreSentRequests, setLoadingMoreSentRequests] = useState(false);

  // --- State for Delete Donation Action ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [donationToDeleteId, setDonationToDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Cancel Sent Request
  const [cancelLoading, setCancelLoading] = useState(null); // requestId being processed

  // --- NEW: State for Confirming Receipt ---
  const [confirmLoading, setConfirmLoading] = useState(null); // requestId being processed

  // State for Dashboard Stats (Dummy data for now)
  const [dashboardStats, setDashboardStats] = useState({
      activeDonations: 0,
      pendingReceived: 0,
      pendingSent: 0,
      isLoading: true, // Add loading state for stats
  });

  // --- Refactor fetchStats into useCallback ---
  const fetchStats = useCallback(async () => {
      if (!user?.id) {
          setDashboardStats({ activeDonations: 0, pendingReceived: 0, pendingSent: 0, isLoading: false });
          return;
      }
      setDashboardStats(prev => ({ ...prev, isLoading: true }));
      try {
          // ... (Actual stat fetching logic as before)
          const { count: activeDonationsCount } = await supabase
              .from('donasi')
              .select('id', { count: 'exact', head: true })
              .eq('id_donatur', user.id)
              .in('status', ['tersedia', 'dipesan']);

          const { data: userDonations, error: donationsError } = await supabase
              .from('donasi')
              .select('id')
              .eq('id_donatur', user.id);
          
          if (donationsError) throw donationsError;
          const userDonationIds = userDonations.map(d => d.id);
          let pendingReceivedCount = 0;
          if (userDonationIds.length > 0) {
             const { count: receivedCount, error: receivedError } = await supabase
                .from('permintaan_donasi')
                .select('id', { count: 'exact', head: true })
                .in('id_donasi', userDonationIds)
                .eq('status', 'pending');
             if (receivedError) throw receivedError;
             pendingReceivedCount = receivedCount;
          }

          const { count: pendingSentCount, error: sentError } = await supabase
             .from('permintaan_donasi')
             .select('id', { count: 'exact', head: true })
             .eq('id_peminta', user.id)
             .eq('status', 'pending');
          
          if (sentError) throw sentError;

          setDashboardStats({
             activeDonations: activeDonationsCount ?? 0,
             pendingReceived: pendingReceivedCount ?? 0,
             pendingSent: pendingSentCount ?? 0,
             isLoading: false
          });

      } catch (error) {
          console.error("Error fetching dashboard stats:", error);
          setDashboardStats({ activeDonations: 'N/A', pendingReceived: 'N/A', pendingSent: 'N/A', isLoading: false });
      }
  }, [user?.id]);
  // ------------------------------------------

  // Fungsi Fetch Donasi Saya (Restore logic, fix useCallback deps)
  const fetchMyDonations = useCallback(async (userId, loadMore = false) => {
    if (!userId) return;

    const currentOffset = loadMore ? myDonationsOffset : 0;
    if (loadMore) setLoadingMoreMyDonations(true); else setLoadingMyDonations(true);
    setErrorMyDonations(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('donasi')
        .select('id, judul, status, created_at, url_gambar, lokasi_kecamatan, kategori ( nama )')
        .eq('id_donatur', userId)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + DONATION_LIMIT - 1);

      if (fetchError) throw fetchError;

      const newItems = data || [];
      setMyDonations(prev => loadMore ? [...prev, ...newItems] : newItems);
      setMyDonationsOffset(currentOffset + newItems.length);
      setHasMoreMyDonations(newItems.length === DONATION_LIMIT);

    } catch (err) {
      console.error("Error fetching my donations:", err);
      setErrorMyDonations("Gagal memuat data donasi Anda.");
      if (!loadMore) setMyDonations([]);
      setHasMoreMyDonations(false);
    } finally {
      setLoadingMyDonations(false);
      setLoadingMoreMyDonations(false);
    }
  }, [user?.id, myDonationsOffset]);

  // Fungsi Fetch Permintaan Diterima (Restore logic, fix useCallback deps)
  const fetchReceivedRequests = useCallback(async (userId, loadMore = false) => {
    if (!userId) return;
    const currentOffset = loadMore ? receivedRequestsOffset : 0;
    if (loadMore) setLoadingMoreReceivedRequests(true); else setLoadingRequests(true);
    setErrorRequests(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('permintaan_donasi')
        .select('id, created_at, status, pesan, id_donasi, id_peminta, donasi!inner ( judul, id_donatur ), profil ( nama_pengguna )', { count: 'exact' })
        .eq('donasi.id_donatur', userId)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + REQUEST_LIMIT - 1);

      if (fetchError) throw fetchError;

      const newItems = data || [];
      setReceivedRequests(prev => loadMore ? [...prev, ...newItems] : newItems);
      setReceivedRequestsOffset(currentOffset + newItems.length);
      setHasMoreReceivedRequests(newItems.length === REQUEST_LIMIT);

    } catch (err) {
      console.error("Error fetching received requests:", err);
      setErrorRequests("Gagal memuat data permintaan.");
      if (!loadMore) setReceivedRequests([]);
      setHasMoreReceivedRequests(false);
    } finally {
      setLoadingRequests(false);
      setLoadingMoreReceivedRequests(false);
    }
  }, [user?.id, receivedRequestsOffset]);

  // Fungsi Fetch Permintaan Saya (Restore logic, fix useCallback deps)
   const fetchMySentRequests = useCallback(async (userId, loadMore = false) => {
     if (!userId) return;
     const currentOffset = loadMore ? sentRequestsOffset : 0;
     if (loadMore) setLoadingMoreSentRequests(true); else setLoadingSentRequests(true);
     setErrorSentRequests(null);

     try {
       const { data, error: fetchError } = await supabase
         .from('permintaan_donasi')
         .select('id, created_at, status, id_donasi, donasi ( judul, profil!id_donatur ( nama_pengguna ) )', { count: 'exact' })
         .eq('id_peminta', userId)
         .order('created_at', { ascending: false })
         .range(currentOffset, currentOffset + REQUEST_LIMIT - 1);
 
       if (fetchError) throw fetchError;

       const newItems = data || [];
       setMySentRequests(prev => loadMore ? [...prev, ...newItems] : newItems);
       setSentRequestsOffset(currentOffset + newItems.length);
       setHasMoreSentRequests(newItems.length === REQUEST_LIMIT);

     } catch (err) {
       console.error("Error fetching sent requests:", err);
       setErrorSentRequests("Gagal memuat data permintaan Anda.");
       if (!loadMore) setMySentRequests([]);
       setHasMoreSentRequests(false);
     } finally {
       setLoadingSentRequests(false);
       setLoadingMoreSentRequests(false);
     }
   }, [user?.id, sentRequestsOffset]);

   // --- IMPORTANT FIX FOR THE LOOP --- 
   // We need stable references for the fetch functions inside the realtime useEffect.
   // Create refs to hold the latest versions of the fetch functions.
   const fetchMyDonationsRef = useRef(fetchMyDonations);
   const fetchReceivedRequestsRef = useRef(fetchReceivedRequests);
   const fetchMySentRequestsRef = useRef(fetchMySentRequests);
   const fetchStatsRef = useRef(fetchStats);

   // Update refs whenever the functions change (due to offset or user changes)
   useEffect(() => { fetchMyDonationsRef.current = fetchMyDonations; }, [fetchMyDonations]);
   useEffect(() => { fetchReceivedRequestsRef.current = fetchReceivedRequests; }, [fetchReceivedRequests]);
   useEffect(() => { fetchMySentRequestsRef.current = fetchMySentRequests; }, [fetchMySentRequests]);
   useEffect(() => { fetchStatsRef.current = fetchStats; }, [fetchStats]);
   // ------------------------------------ 

  // Effect utama untuk fetch data awal saat user berubah
  useEffect(() => {
    if (user?.id) {
      setMyDonationsOffset(0); setMyDonations([]); setHasMoreMyDonations(true);
      setReceivedRequestsOffset(0); setReceivedRequests([]); setHasMoreReceivedRequests(true);
      setSentRequestsOffset(0); setMySentRequests([]); setHasMoreSentRequests(true);
      // Call fetch functions on initial load / user change
      fetchMyDonations(user.id, false);
      fetchReceivedRequests(user.id, false);
      fetchMySentRequests(user.id, false);
      fetchStats();
    } else {
      // Reset state jika user logout
      setLoadingMyDonations(false); setMyDonations([]); setHasMoreMyDonations(false);
      setLoadingRequests(false); setReceivedRequests([]); setHasMoreReceivedRequests(false);
      setLoadingSentRequests(false); setMySentRequests([]); setHasMoreSentRequests(false);
    }
    // ONLY depend on user.id to prevent infinite loops
  }, [user?.id]);

  // Effect for Realtime Subscriptions (Use Refs to fix loop)
  useEffect(() => {
      if (!user?.id) return;

      console.log("Dashboard: Setting up realtime subscriptions.");

      const handleDonasiChange = (payload) => {
          console.log("Dashboard: Donasi change detected", payload);
          const oldRecord = payload.old;
          const newRecord = payload.new;
          if (newRecord?.id_donatur === user.id || oldRecord?.id_donatur === user.id) {
              console.log("-> Relevant donasi change, refetching My Donations and Stats...");
              fetchMyDonationsRef.current(user.id, false); 
              fetchStatsRef.current();
          }
      };

      const handlePermintaanChange = async (payload) => {
          console.log("Dashboard: Permintaan change detected", payload);
          const oldRecord = payload.old;
          const newRecord = payload.new;
          let isRelevant = false;

          // Check if user is the requester
          if (newRecord?.id_peminta === user.id || oldRecord?.id_peminta === user.id) {
              isRelevant = true;
          }

          // Check if user is the donor (needs extra query for donation owner)
          if (!isRelevant) {
              const donationId = newRecord?.id_donasi || oldRecord?.id_donasi;
              if (donationId) {
                  try {
                      const { data: donationOwner, error } = await supabase
                          .from('donasi')
                          .select('id_donatur')
                          .eq('id', donationId)
                          .single();
                      if (!error && donationOwner?.id_donatur === user.id) {
                          isRelevant = true;
                      }
                  } catch (err) {
                      console.error("Error checking donation owner for relevance:", err);
                  }
              }
          }

          if (isRelevant) {
              console.log("-> Relevant permintaan change, refetching Request lists and Stats...");
              fetchReceivedRequestsRef.current(user.id, false);
              fetchMySentRequestsRef.current(user.id, false);
              fetchStatsRef.current();
          }
      };

      // --- Setup Channels ---
      const donasiChannel = supabase.channel('dashboard-donasi-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'donasi' }, handleDonasiChange)
          .subscribe((status, err) => {
              if (err) console.error("Donasi Subscription Error:", err);
          });

      const permintaanChannel = supabase.channel('dashboard-permintaan-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'permintaan_donasi' }, handlePermintaanChange)
          .subscribe((status, err) => {
              if (err) console.error("Permintaan Subscription Error:", err);
          });

      // --- Cleanup Function ---
      return () => {
          console.log("Dashboard: Removing realtime subscriptions.");
          supabase.removeChannel(donasiChannel);
          supabase.removeChannel(permintaanChannel);
      };

  }, [user?.id]);
  // -------------------------------------------------------

  // Handler Terima Permintaan - Updated Feedback & Status
  const handleAcceptRequest = async (requestId, donationId) => {
    setActionLoading(requestId);
    const loadingToastId = toast.loading('Memproses permintaan...');
    try {
      // 1. Update status permintaan menjadi 'disetujui'
      const { error: reqUpdateError } = await supabase
        .from('permintaan_donasi')
        .update({ status: 'disetujui' })
        .eq('id', requestId);
      if (reqUpdateError) throw reqUpdateError;

      // 2. Update status donasi menjadi 'dipesan'
      const { error: donUpdateError } = await supabase
        .from('donasi')
        .update({ status: 'dipesan' })
        .eq('id', donationId);
      if (donUpdateError) {
           console.warn(`Request ${requestId} approved, but failed to update donation ${donationId} status:`, donUpdateError);
           // Potentially revert request status or notify user? For now, just log.
      }

      // 3. Update state lokal
      setReceivedRequests(prev => prev.map(req =>
          req.id === requestId ? { ...req, status: 'disetujui' } : req
      ));
      setMyDonations(prev => prev.map(don =>
          don.id === donationId ? { ...don, status: 'dipesan' } : don
      ));

      toast.success('Permintaan berhasil disetujui.', { id: loadingToastId });

    } catch (error) {
        console.error("Error approving request:", error);
        const message = error.message || "Gagal menyetujui permintaan.";
        toast.error(message, { id: loadingToastId });
    } finally {
        setActionLoading(null);
    }
  };

  // Handler Tolak Permintaan - (No changes needed here)
  const handleRejectRequest = async (requestId) => {
      setActionLoading(requestId);
      const loadingToastId = toast.loading('Memproses penolakan...');
      try {
          const { error: reqUpdateError } = await supabase
              .from('permintaan_donasi')
              .update({ status: 'ditolak' })
              .eq('id', requestId);
          if (reqUpdateError) throw reqUpdateError;

          // Update state lokal
          setReceivedRequests(prev => prev.map(req =>
              req.id === requestId ? { ...req, status: 'ditolak' } : req
          ));

          toast.success('Permintaan berhasil ditolak.', { id: loadingToastId });

      } catch (error) {
          console.error("Error rejecting request:", error);
           const message = error.message || "Gagal menolak permintaan.";
           toast.error(message, { id: loadingToastId });
      } finally {
          setActionLoading(null);
      }
  };

  // --- Handlers for Delete Donation - Updated Feedback ---
  const handleDeleteDonation = (donationId) => {
    setDonationToDeleteId(donationId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteDonation = async () => {
    if (!donationToDeleteId || !user) return;
    const idToDelete = donationToDeleteId; // Store ID before clearing state

    setDeleteLoading(true);

    try {
      const { error } = await supabase
        .from('donasi')
        .delete()
        .eq('id', donationToDeleteId)
        .eq('id_donatur', user.id); // Ensure user owns the donation

      if (error) throw error;

      // Remove the donation from the local state (optimistic update)
      setMyDonations(prev => prev.filter(d => d.id !== idToDelete));
      setIsDeleteModalOpen(false);
      setDonationToDeleteId(null);
      
      toast.success("Donasi berhasil dihapus.");

    } catch (err) {
      console.error("Error deleting donation:", err);
      const message = err.message || "Gagal menghapus donasi.";
      toast.error(message);
      setIsDeleteModalOpen(false);
      setDonationToDeleteId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Batalkan Permintaan Saya -> Use Toast
  const handleCancelRequest = async (requestId) => {
      if (!user) return;
      setCancelLoading(requestId);
      const loadingToastId = toast.loading('Membatalkan permintaan...');

      try {
          const { error } = await supabase
              .from('permintaan_donasi')
              .delete()
              .eq('id', requestId)
              .eq('id_peminta', user.id) // Ensure user owns the request
              .eq('status', 'pending'); // Only allow cancelling pending requests

          if (error) throw error;

          // Update local state
          setMySentRequests(prev => prev.filter(req => req.id !== requestId));
          toast.success('Permintaan berhasil dibatalkan.', { id: loadingToastId });

      } catch (error) {
          console.error("Error cancelling request:", error);
          const message = error.message || "Gagal membatalkan permintaan.";
          toast.error(message, { id: loadingToastId });
      } finally {
          setCancelLoading(null);
      }
  };

  // --- NEW: Handler for Confirming Receipt (by Receiver) ---
  const handleConfirmReceipt = async (requestId, donationId) => {
      if (!user) return;
      setConfirmLoading(requestId); // Use confirmLoading state
      const loadingToastId = toast.loading('Mengonfirmasi penerimaan...');

      try {
          // --- CALL EDGE FUNCTION --- 
          console.log(`Invoking confirm-receipt for request ID: ${requestId}`);
          const { data: functionData, error: functionError } = await supabase.functions.invoke(
              'confirm-receipt',
              { body: { requestId } } // Pass requestId in the body
          );

          if (functionError) {
              console.error('Edge function invocation error:', functionError);
              // Try to get a more specific message from the function's response if available
              let errMsg = functionError.message;
               try {
                   const errJson = JSON.parse(functionError.context?.responseText || 'null');
                   if (errJson?.error) {
                       errMsg = errJson.error;
                   }
               } catch { /* ignore parsing error */ }
              throw new Error(errMsg || 'Gagal menghubungi fungsi konfirmasi.');
          }

          if (functionData?.error) { // Check for error message within function's successful response
             console.error('Edge function returned error:', functionData.error);
             throw new Error(functionData.error);
          }
          
          console.log('confirm-receipt function response:', functionData);
          // ---------------------------

          // -- Existing Database Updates are REMOVED --
          // const { error: reqUpdateError } = await supabase ...
          // const { error: donUpdateError } = await supabase ...

          // --- UPDATE LOCAL STATE OPTIMISTICALLY (or based on function success) ---
          // Update "Permintaan Saya" list
          setMySentRequests(prev => prev.map(req =>
              req.id === requestId ? { ...req, status: 'selesai' } : req
          ));
          // Update "Donasi Saya" list
          setMyDonations(prev => prev.map(don =>
              don.id === donationId ? { ...don, status: 'didonasikan' } : don
          ));
          // Update "Permintaan Masuk" list
          setReceivedRequests(prev => prev.map(req =>
              req.id === requestId ? { ...req, status: 'selesai' } : req
           ));
          // ----------------------------------------------------------------------

          toast.success('Konfirmasi penerimaan berhasil!', { id: loadingToastId });

      } catch (error) {
          console.error("Error confirming receipt via function:", error);
          const message = error.message || "Gagal mengonfirmasi penerimaan.";
          toast.error(message, { id: loadingToastId });
      } finally {
          setConfirmLoading(null);
      }
  };

  // Render list Donasi Saya (Updated Actions)
  const renderDonationList = () => {
    if (loadingMyDonations && myDonations.length === 0) return <div className="space-y-5">{[...Array(3)].map((_, i) => <DonationItemSkeleton key={i} />)}</div>;
    if (errorMyDonations && myDonations.length === 0) return <ErrorPlaceholder message={errorMyDonations} />;
    if (!loadingMyDonations && myDonations.length === 0) {
      return (
        <EmptyPlaceholder message="Anda belum pernah membuat donasi barang." icon={GiftIcon}>
          <Link to="/donate">
            <Button variant="primary" size="sm" className="inline-flex items-center gap-1.5">
                 <GiftIcon className="h-4 w-4"/> Buat Donasi Pertama Anda
             </Button>
          </Link>
        </EmptyPlaceholder>
      );
    }

    const statusBorderColor = {
        tersedia: 'border-l-emerald-500',
        dipesan: 'border-l-yellow-400',
        didonasikan: 'border-l-blue-500',
    };

    return (
      <div className="space-y-5">
        <ul className="space-y-5">
          {myDonations.map((donation) => {
             const borderClass = statusBorderColor[donation.status] || 'border-l-gray-300';
             return (
                <li key={donation.id} className={`bg-white rounded-lg shadow border border-gray-100 flex flex-col sm:flex-row items-stretch gap-0 relative transition-shadow duration-200 hover:shadow-lg overflow-hidden border-l-4 ${borderClass}`}>
                    <div className="w-full sm:w-32 h-32 sm:h-auto flex-shrink-0 bg-gray-100">
                         {donation.url_gambar?.[0] ? (
                             <img src={donation.url_gambar[0]} alt={`Thumbnail ${donation.judul}`} className="w-full h-full object-cover" loading="lazy" />
                         ) : (
                             <PlaceholderImage className="w-full h-full" />
                         )}
                    </div>
                     <div className="flex-grow flex flex-col justify-between p-4 md:p-5">
                          <div>
                             <div className="flex justify-between items-start mb-1.5 gap-2">
                                <Link to={`/donations/${donation.id}`} className="hover:text-primary transition-colors pr-2">
                                   <h3 className="text-base sm:text-lg font-semibold text-gray-800 leading-tight">{donation.judul}</h3>
                                </Link>
                                <div className="flex-shrink-0 pt-0.5 flex items-center gap-2">
                                    <StatusBadge status={donation.status} />
                                </div>
                             </div>
                             <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-3">
                                  {donation.kategori?.nama && ( <span className="inline-flex items-center gap-1.5" title="Kategori"><TagIcon className="h-3.5 w-3.5 text-gray-400" /> {donation.kategori.nama}</span> )}
                                  <span className="inline-flex items-center gap-1.5" title="Tanggal Dibuat"><CalendarDaysIcon className="h-3.5 w-3.5 text-gray-400" /> {formatDate(donation.created_at)}</span>
                                  {donation.lokasi_kecamatan && ( <span className="inline-flex items-center gap-1.5" title="Lokasi"><MapPinIcon className="h-3.5 w-3.5 text-gray-400" /> {donation.lokasi_kecamatan}</span> )}
                             </div>
                         </div>
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                           <Link to={`/donations/${donation.id}`}><Button size="sm" variant="outline" className="inline-flex items-center gap-1.5"><EyeIcon className="h-4 w-4"/> Detail</Button></Link>
                           {donation.status !== 'didonasikan' && (<Link to={`/donations/${donation.id}/edit`}><Button size="sm" variant="secondary" className="inline-flex items-center gap-1.5"><PencilIcon className="h-4 w-4"/> Edit</Button></Link>)}
                           <Button
                               size="sm"
                               variant="ghost"
                               className="text-red-600 hover:bg-red-50 hover:text-red-700 inline-flex items-center gap-1.5 px-2 py-1"
                               onClick={() => handleDeleteDonation(donation.id)}
                               disabled={deleteLoading && donationToDeleteId === donation.id}
                               aria-label="Hapus Donasi"
                           >
                               {deleteLoading && donationToDeleteId === donation.id ? <ArrowPathIcon className="animate-spin h-4 w-4"/> : <TrashIcon className="h-4 w-4"/>}
                                <span className="hidden sm:inline">Hapus</span>
                           </Button>
                           {donation.status === 'dipesan' && (() => {
                                const approvedRequest = receivedRequests.find(req => req.id_donasi === donation.id && req.status === 'disetujui');
                                if (!approvedRequest) return null;
                                return (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-primary text-primary hover:bg-emerald-50 inline-flex items-center justify-center gap-1.5 w-full md:w-auto"
                                        onClick={() => {
                                            const partnerId = approvedRequest?.id_peminta;
                                            console.log("[DashboardPage: MyDonations] Chat Penerima Clicked. Partner ID:", partnerId);
                                            partnerId ? startOrOpenChat(partnerId) : console.error('Missing requester ID for chat');
                                        }}
                                        title="Buka Chat Penerima"
                                    >
                                        <ChatBubbleLeftEllipsisIcon className="h-4 w-4" /> Chat Penerima
                                     </Button>
                                );
                           })()}
                        </div>
                     </div>
                 </li>
              );
           })}
        </ul>
        {hasMoreMyDonations && !errorMyDonations && ( <div className="text-center pt-4">
                 <Button onClick={() => fetchMyDonations(user.id, true)} disabled={loadingMoreMyDonations} variant="outline" size="sm" className="inline-flex items-center justify-center gap-2 text-sm">
                     {loadingMoreMyDonations ? <ArrowPathIcon className="animate-spin h-4 w-4"/> : <ArrowDownCircleIcon className="h-5 w-5" />}
                     {loadingMoreMyDonations ? 'Memuat...' : 'Muat Lebih Banyak'}
                 </Button>
             </div> )}
      </div>
    );
  };

  // Render Received Requests List (Final Polish)
  const renderReceivedRequests = () => {
     if (loadingRequests && receivedRequests.length === 0) return <div className="space-y-5">{[...Array(3)].map((_, i) => <RequestItemSkeleton key={i} />)}</div>;
     if (errorRequests && receivedRequests.length === 0) return <ErrorPlaceholder message={errorRequests} />;
     if (!loadingRequests && receivedRequests.length === 0) {
         return <EmptyPlaceholder message="Belum ada permintaan masuk untuk donasi Anda." icon={InboxIcon} />;
     }

     return (
       <div className="space-y-5">
          <ul className="space-y-5">
            {receivedRequests.map((request) => {
                const isLoading = actionLoading === request.id;
                return (
                  <li key={request.id} className="bg-white p-4 md:p-5 rounded-lg shadow border border-gray-100 flex flex-col md:flex-row justify-between items-start gap-4 transition-shadow duration-200 hover:shadow-lg">
                      <div className="flex-grow w-full md:w-auto">
                          <p className="text-xs text-gray-500 mb-0.5">Permintaan untuk:</p>
                          <Link to={`/donations/${request.id_donasi}`} className="hover:text-primary transition-colors mb-1 block">
                              <h4 className="text-base font-semibold text-primary leading-tight">{request.donasi?.judul || 'Donasi tidak dikenal'}</h4>
                          </Link>
                          <p className="text-xs text-gray-500 mb-0.5"><span className="font-medium text-gray-600">Dari:</span></p>
                          <p className="text-sm font-medium text-gray-800 mb-1">{request.profil?.nama_pengguna || 'Anonim'}</p>
                          <p className="text-xs text-gray-500 mb-3">Diajukan: {formatDate(request.created_at)}</p>

                          <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                              {request.pesan && (
                                  <div className="text-sm bg-gray-50 p-3 rounded border border-gray-200 text-gray-700 italic relative">
                                     <ChatBubbleBottomCenterTextIcon className="h-4 w-4 absolute top-2.5 left-2.5 text-gray-400" />
                                     <p className="pl-6">"{request.pesan}"</p>
                                  </div>
                               )}
                               <StatusBadge status={request.status} />
                          </div>
                      </div>
                       <div className="flex flex-shrink-0 gap-2 mt-3 md:mt-0 self-stretch md:self-center flex-col md:flex-row w-full md:w-auto">
                          {request.status === 'pending' && (
                               <>
                                  <Button
                                      size="sm"
                                      variant="success"
                                      onClick={() => handleAcceptRequest(request.id, request.id_donasi)}
                                      disabled={isLoading}
                                      className="inline-flex items-center justify-center gap-1.5 flex-grow md:flex-grow-0 hover:bg-emerald-700"
                                  >
                                      {isLoading ? <ArrowPathIcon className="animate-spin h-4 w-4"/> : <CheckCircleIcon className="h-4 w-4" />} Terima
                                  </Button>
                                  <Button
                                      size="sm"
                                      variant="danger"
                                      onClick={() => handleRejectRequest(request.id)}
                                      disabled={isLoading}
                                      className="inline-flex items-center justify-center gap-1.5 flex-grow md:flex-grow-0 hover:bg-red-700"
                                  >
                                      {isLoading ? <ArrowPathIcon className="animate-spin h-4 w-4"/> : <XCircleIcon className="h-4 w-4" />} Tolak
                                  </Button>
                               </>
                          )}
                          {request.status === 'disetujui' && (
                              <Button size="sm" variant="secondary" onClick={() => {
                                  const partnerId = request?.id_peminta;
                                  console.log("[DashboardPage: ReceivedRequests] Chat Clicked. Partner ID:", partnerId);
                                  partnerId ? startOrOpenChat(partnerId) : console.error('Missing requester ID (id_peminta) for chat');
                              }} title="Buka Chat">
                                  <ChatBubbleLeftEllipsisIcon className="h-4 w-4" /> Chat
                              </Button>
                           )}
                           {request.status === 'selesai' && (
                               <p className="text-sm text-emerald-700 font-medium flex items-center gap-1.5 w-full justify-center md:justify-start">
                                  <CheckBadgeIcon className="h-5 w-5"/> Telah Selesai
                               </p>
                           )}
                       </div>
                  </li>
                );
             })}
          </ul>
           {hasMoreReceivedRequests && !errorRequests && (
                <div className="text-center pt-4">
                    <Button onClick={() => fetchReceivedRequests(user.id, true)} disabled={loadingMoreReceivedRequests} variant="outline" size="sm" className="inline-flex items-center justify-center gap-2 text-sm">
                        {loadingMoreReceivedRequests ? <ArrowPathIcon className="animate-spin h-4 w-4"/> : <ArrowDownCircleIcon className="h-5 w-5" />}
                        {loadingMoreReceivedRequests ? 'Memuat...' : 'Muat Lebih Banyak'}
                    </Button>
                </div>
            )}
       </div>
     );
   };

  // Render My Sent Requests List (UI Improvements)
  const renderMySentRequests = () => {
     if (loadingSentRequests && mySentRequests.length === 0) return <div className="space-y-5">{[...Array(3)].map((_, i) => <RequestItemSkeleton key={i} />)}</div>;
     if (errorSentRequests && mySentRequests.length === 0) return <ErrorPlaceholder message={errorSentRequests} />;
     if (!loadingSentRequests && mySentRequests.length === 0) {
       return (
         <EmptyPlaceholder message="Anda belum mengajukan permintaan barang." icon={DocumentMagnifyingGlassIcon}>
            <Link to="/browse"> <Button variant="outline" size="sm">Cari Barang Donasi</Button> </Link>
         </EmptyPlaceholder>
       );
     }

     return (
       <div className="space-y-5">
          <ul className="space-y-5">
            {mySentRequests.map((request) => {
                const isCancelLoading = cancelLoading === request.id;
                const isConfirmLoading = confirmLoading === request.id; // Use new loading state

                return (
                  <li key={request.id} className="bg-white p-4 md:p-5 rounded-lg shadow border border-gray-100 flex flex-col md:flex-row justify-between items-start gap-4 transition-shadow duration-200 hover:shadow-lg">
                    <div className="flex-grow w-full md:w-auto">
                           {/* Donation Title */}
                           <p className="text-xs text-gray-500 mb-0.5">Permintaan untuk:</p>
                           <Link to={`/donations/${request.id_donasi}`} className="hover:text-primary transition-colors mb-1 block">
                               <h4 className="text-base font-semibold text-primary leading-tight">{request.donasi?.judul || 'Donasi tidak dikenal'}</h4>
                           </Link>
                          {/* Donor Info */}
                           <p className="text-xs text-gray-500 mb-0.5"><span className="font-medium text-gray-600">Donatur:</span></p>
                           <p className="text-sm font-medium text-gray-800 mb-1">{request.donasi?.profil?.nama_pengguna || 'Anonim'}</p>
                           <p className="text-xs text-gray-500 mb-3">Diajukan: {formatDate(request.created_at)}</p>
                          {/* Status Badge - Placed after primary info */}
                          <StatusBadge status={request.status} />
                      </div>
                       {/* Action Buttons Container */}
                       <div className="flex flex-shrink-0 gap-2 mt-3 md:mt-0 self-stretch md:self-center flex-col md:flex-row w-full md:w-auto">
                          {request.status === 'disetujui' && (
                              <>
                                  {/* Use startOrOpenChat with the donor's ID */}
                                  <Button size="sm" variant="secondary" onClick={() => {
                                      const partnerId = request?.donasi?.id_pengguna;
                                      console.log("[DashboardPage: MySentRequests] Chat Clicked. Partner ID:", partnerId);
                                      partnerId ? startOrOpenChat(partnerId) : console.error('Missing donor ID for chat');
                                  }} title="Buka Chat">
                                      <ChatBubbleLeftEllipsisIcon className="h-4 w-4" /> Chat
                                  </Button>
                                  <Button
                                      size="sm"
                                      variant="success"
                                      onClick={() => handleConfirmReceipt(request.id, request.id_donasi)}
                                      disabled={isConfirmLoading}
                                      className="inline-flex items-center justify-center gap-1.5 w-full md:w-auto"
                                  >
                                      {isConfirmLoading ? <ArrowPathIcon className="animate-spin h-4 w-4"/> : <CheckBadgeIcon className="h-4 w-4" />}
                                      Konfirmasi Terima
                                  </Button>
                              </>
                           )}
                          {request.status === 'pending' && (
                              <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-gray-600 border-gray-300 hover:bg-red-50 hover:text-red-700 hover:border-red-200 inline-flex items-center justify-center gap-1.5 w-full md:w-auto"
                                  onClick={() => handleCancelRequest(request.id)}
                                  disabled={isCancelLoading}
                              >
                                  {isCancelLoading ? <ArrowPathIcon className="animate-spin h-4 w-4"/> : <XMarkIcon className="h-4 w-4" />}
                                  Batalkan
                              </Button>
                          )}
                           {request.status === 'selesai' && (
                               <p className="text-sm text-emerald-700 font-medium flex items-center gap-1.5 w-full justify-center md:justify-start">
                                  <CheckBadgeIcon className="h-5 w-5"/> Diterima & Selesai
                               </p>
                           )}
                       </div>
                  </li>
                );
            })}
          </ul>
           {/* Load More Button */}
           {hasMoreSentRequests && !errorSentRequests && (
               <div className="text-center pt-4">
                   <Button onClick={() => fetchMySentRequests(user.id, true)} disabled={loadingMoreSentRequests} variant="outline" size="sm" className="inline-flex items-center justify-center gap-2 text-sm">
                       {loadingMoreSentRequests ? <ArrowPathIcon className="animate-spin h-4 w-4"/> : <ArrowDownCircleIcon className="h-5 w-5" />}
                       {loadingMoreSentRequests ? 'Memuat...' : 'Muat Lebih Banyak'}
                   </Button>
               </div>
           )}
       </div>
     );
   };

  // Helper function for Tab classNames
  function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }

  const tabs = [
    { name: 'Donasi Saya', icon: GiftIcon },
    { name: 'Permintaan Diterima', icon: DocumentMagnifyingGlassIcon },
    { name: 'Permintaan Terkirim', icon: ArrowDownCircleIcon },
    { name: 'Permintaan Saya (Wishlist)', icon: QuestionMarkCircleIcon },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>

      {/* --- Dashboard Stats --- */}
       <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
                icon={GiftIcon}
                title="Donasi Aktif"
                value={dashboardStats.isLoading ? '⋯' : dashboardStats.activeDonations}
                color="primary"
            />
            <StatCard
                icon={InboxIcon}
                title="Permintaan Masuk Pending"
                value={dashboardStats.isLoading ? '⋯' : dashboardStats.pendingReceived}
                color="amber"
            />
            <StatCard
                icon={ClockIcon}
                title="Permintaan Saya Pending"
                value={dashboardStats.isLoading ? '⋯' : dashboardStats.pendingSent}
                color="blue"
            />
       </div>

      {/* --- Tabs --- */}
      <Tab.Group>
          <div className="border-b border-gray-200 mb-6">
             <Tab.List className="-mb-px flex space-x-1 sm:space-x-2 overflow-x-auto">
                {tabs.map((tab) => (
                    <Tab
                        key={tab.name}
                        className={({ selected }) =>
                           classNames(
                               'whitespace-nowrap rounded-t-md py-2.5 px-4 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-opacity-50',
                               selected
                                 ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600'
                                 : 'text-gray-500 hover:bg-gray-100/60 hover:text-gray-700'
                           )
                        }
                    >
                        <tab.icon className="h-5 w-5" />
                        {tab.name}
                    </Tab>
                ))}
             </Tab.List>
          </div>

          <Tab.Panels className="mt-6">
             {/* Panel Donasi Saya */}
             <Tab.Panel className="focus:outline-none ring-offset-0 ring-transparent">
                 <div className="flex justify-end mb-5">
                    <Link to="/donate" className="flex-shrink-0"><Button variant="primary" size="sm" className="inline-flex items-center gap-1"><GiftIcon className="h-4 w-4"/> Buat Donasi</Button></Link>
                 </div>
                 {renderDonationList()}
             </Tab.Panel>

             {/* Panel Permintaan Diterima */}
             <Tab.Panel className="focus:outline-none ring-offset-0 ring-transparent">
                {renderReceivedRequests()}
             </Tab.Panel>

             {/* Panel Permintaan Saya */}
             <Tab.Panel className="focus:outline-none ring-offset-0 ring-transparent">
                <div className="bg-gray-50/60 p-4 md:p-6 rounded-lg border border-gray-100">
                    {renderMySentRequests()}
                </div>
             </Tab.Panel>

             {/* Panel Permintaan Saya (Wishlist) */}
             <Tab.Panel className="focus:outline-none ring-offset-0 ring-transparent">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Permintaan Barang Anda (Wishlist)</h2>
                <MyWishlistItems />
             </Tab.Panel>
          </Tab.Panels>
      </Tab.Group>

        {/* --- Modals --- */}
        <DeleteDonationConfirmationModal
           isOpen={isDeleteModalOpen}
           onClose={() => { if (!deleteLoading) setIsDeleteModalOpen(false); }}
           onConfirm={confirmDeleteDonation}
           isLoading={deleteLoading}
        />
    </div>
  );
}

// Prop types untuk StatusBadge jika dipisah
StatusBadge.propTypes = {
    status: PropTypes.string,
    type: PropTypes.oneOf(['donation', 'request']).isRequired
};

// Add StatCard PropTypes
StatCard.propTypes = {
    icon: PropTypes.elementType.isRequired,
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    color: PropTypes.string,
};

// Add PlaceholderImage PropTypes
PlaceholderImage.propTypes = { className: PropTypes.string };

export default DashboardPage; 