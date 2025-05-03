import { useState, useEffect, useCallback, Fragment } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Button from '../components/ui/Button';
import DonationCard from '../components/ui/DonationCard'; // Reuse donation card
import {
    UserCircleIcon, CalendarDaysIcon, ArrowPathIcon, InboxIcon,
    PencilSquareIcon, GiftIcon, IdentificationIcon, HashtagIcon,
    DocumentMagnifyingGlassIcon, SparklesIcon,
    CheckBadgeIcon, ClockIcon, XMarkIcon,
    QuestionMarkCircleIcon, // Default badge icon
    XMarkIcon as CloseIcon // For modal close
} from '@heroicons/react/24/outline';
import * as HIcons from '@heroicons/react/24/outline'; // Import all outline icons
import { Tab, Dialog, Transition } from '@headlessui/react';
import { useAuth } from '../contexts/AuthContext'; // To check if viewing own profile

// Helper to format date
function formatDate(dateString, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!dateString) return 'Tanggal tidak tersedia';
  try {
    return new Date(dateString).toLocaleDateString('id-ID', options);
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
}

// Constants
const DONATION_LIMIT = 6;
const REQUEST_LIMIT = 5; // Limit for sent requests tab

// Helper function for Tab classNames
function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

// Placeholder Components
function ProfileSkeleton() {
    return (
        <div className="animate-pulse">
            {/* Header Skeleton */}
            <div className="bg-white shadow border border-gray-100 rounded-lg p-6 md:p-8 mb-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-300 flex-shrink-0"></div>
                    <div className="flex-grow space-y-3 text-center sm:text-left">
                        <div className="h-7 bg-gray-300 rounded w-3/5 mx-auto sm:mx-0"></div> {/* Name */}
                        <div className="h-4 bg-gray-300 rounded w-2/5 mx-auto sm:mx-0"></div> {/* Join Date */}
                        <div className="h-4 bg-gray-300 rounded w-1/3 mx-auto sm:mx-0 mt-2"></div> {/* Stat */}
                        {/* Badges Skeleton (now part of header) */}
                        <div className="h-10 bg-gray-200 rounded w-full mt-4"></div>
                        <div className="h-8 bg-gray-300 rounded w-32 mt-3 mx-auto sm:mx-0"></div> {/* Edit Button placeholder */}
                    </div>
                </div>
            </div>

            {/* Tabs Section Skeleton */}
            <div className="bg-white shadow border border-gray-100 rounded-lg p-6 md:p-8">
                 <div className="border-b border-gray-200 mb-6">
                     <div className="h-10 bg-gray-200 rounded w-2/3"></div> {/* Tab List Placeholder */}
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                     {[...Array(3)].map((_, i) => (
                         <div key={i} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white"><div className="w-full aspect-video bg-gray-300"></div><div className="p-4 space-y-3"><div className="h-5 bg-gray-300 rounded w-3/4"></div><div className="h-3 bg-gray-300 rounded w-1/4"></div><div className="h-3 bg-gray-300 rounded w-1/2"></div></div></div>
                     ))}
                 </div>
             </div>
        </div>
    );
}

// Corrected EmptyPlaceholder
function EmptyPlaceholder({ icon: Icon = InboxIcon, message, children }) {
   return (
      <div className="text-center py-10 px-6 bg-gray-50/70 rounded-lg border border-dashed border-gray-300">
          {Icon ? <Icon className="h-10 w-10 mx-auto mb-3 text-gray-400" /> : <InboxIcon className="h-10 w-10 mx-auto mb-3 text-gray-400" />}
          <p className="text-gray-500 text-sm mb-4">{message}</p>
          {children}
       </div>
   );
}

// Updated BadgeDisplay to be clickable
function BadgeDisplay({ badge, onClick }) {
    const IconComponent = HIcons[badge.icon_name] || QuestionMarkCircleIcon;
    return (
        <button
            type="button"
            onClick={() => onClick(badge)} // Call onClick prop with badge data
            className="flex items-center gap-2 bg-gray-100/70 border border-gray-200/80 rounded-full px-3 py-1 group relative shadow-sm hover:bg-gray-200 hover:border-gray-300 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            title={`Klik untuk detail: ${badge.name}`}
        >
            <IconComponent className={`h-4 w-4 flex-shrink-0 ${badge.color_class || 'text-gray-500'}`} />
            <span className="text-xs font-medium text-gray-700 truncate group-hover:underline">{badge.name}</span>
        </button>
    );
}

// --- Badge Detail Modal Component ---
function BadgeDetailModal({ isOpen, onClose, badge }) {
    if (!badge) return null;
    const IconComponent = HIcons[badge.icon_name] || QuestionMarkCircleIcon;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 flex items-center gap-3 mb-2">
                                     <span className={`p-1.5 rounded-full ${badge.color_class ? badge.color_class.replace('text-', 'bg-').replace('-500', '-100') : 'bg-gray-100'}`}>
                                          <IconComponent className={`h-6 w-6 ${badge.color_class || 'text-gray-500'}`} />
                                     </span>
                                     {badge.name}
                                </Dialog.Title>
                                <button
                                    type="button"
                                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    onClick={onClose}
                                >
                                    <CloseIcon className="h-5 w-5" />
                                </button>
                                <div className="mt-3 space-y-3">
                                    <p className="text-sm text-gray-600">
                                        {badge.description}
                                    </p>
                                    <p className="text-xs text-gray-400 border-t pt-2 mt-3">
                                         Diperoleh pada: {formatDate(badge.earned_at, { dateStyle: 'full', timeStyle: 'short' })}
                                     </p>
                                </div>

                                <div className="mt-5 text-right">
                                    <Button variant="secondary" size="sm" onClick={onClose}>
                                        Tutup
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
// --- End Badge Modal ---

// Simple List Item for Sent Requests
function SentRequestItem({ request }) {
    // Status Badge Logic (similar to DashboardPage)
    let statusBgColor, statusTextColor, statusText;
    switch (request.status) {
        case 'pending': statusBgColor = 'bg-orange-100'; statusTextColor = 'text-orange-800'; statusText = 'Pending'; break;
        case 'diterima': statusBgColor = 'bg-sky-100'; statusTextColor = 'text-sky-800'; statusText = 'Diterima'; break;
        case 'ditolak': statusBgColor = 'bg-red-100'; statusTextColor = 'text-red-800'; statusText = 'Ditolak'; break;
        default: statusBgColor = 'bg-gray-100'; statusTextColor = 'text-gray-800'; statusText = request.status;
    }

    const statusIcon = request.status === 'pending' ? <ClockIcon className="h-3.5 w-3.5"/>
                      : request.status === 'diterima' ? <CheckBadgeIcon className="h-3.5 w-3.5"/>
                      : request.status === 'ditolak' ? <XMarkIcon className="h-3.5 w-3.5"/>
                      : null;

    return (
        <li className="bg-white p-4 rounded-md shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-grow">
                <p className="text-xs text-gray-500 mb-0.5">Permintaan untuk:</p>
                <Link to={`/donations/${request.id_donasi}`} className="hover:text-primary transition-colors mb-1 block">
                    <h4 className="text-sm font-semibold text-gray-800 leading-tight">{request.donasi?.judul || 'Donasi tidak dikenal'}</h4>
                </Link>
                <p className="text-xs text-gray-500 mb-2">Diajukan: {formatDate(request.created_at)}</p>
                <span className={`inline-flex items-center gap-1 capitalize ${statusBgColor} ${statusTextColor} px-2 py-0.5 rounded-full text-xs font-medium`}>
                   {statusIcon}
                   {statusText}
                 </span>
            </div>
            {/* Optional: Add action button like 'View Donation' or 'Chat' if accepted */}
            {/* <div className="flex-shrink-0 self-end sm:self-center">
                 <Link to={`/donations/${request.id_donasi}`}><Button size="xs" variant="outline">Lihat Donasi</Button></Link>
            </div> */}
        </li>
    );
}

// --- End Placeholders & Sub-components ---

function ProfilePage() {
  const { userId } = useParams();
  const { user: loggedInUser } = useAuth();
  const isOwnProfile = loggedInUser?.id === userId;

  const [profile, setProfile] = useState(null);
  const [donationCount, setDonationCount] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState([]); // State for earned badges
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorProfile, setErrorProfile] = useState(null);

  // Modal State
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);

  // State for Donations Tab
  const [donations, setDonations] = useState([]);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [errorDonations, setErrorDonations] = useState(null);
  const [donationsOffset, setDonationsOffset] = useState(0);
  const [hasMoreDonations, setHasMoreDonations] = useState(true);
  const [loadingMoreDonations, setLoadingMoreDonations] = useState(false);

  // State for Sent Requests Tab
  const [sentRequests, setSentRequests] = useState([]);
  const [loadingSentRequests, setLoadingSentRequests] = useState(true);
  const [errorSentRequests, setErrorSentRequests] = useState(null);
  const [sentRequestsOffset, setSentRequestsOffset] = useState(0);
  const [hasMoreSentRequests, setHasMoreSentRequests] = useState(true);
  const [loadingMoreSentRequests, setLoadingMoreSentRequests] = useState(false);


  // --- Fetch Profile, Count, and Badges ---
  useEffect(() => {
    const fetchProfileData = async () => {
        if (!userId) {
            setErrorProfile("User ID tidak valid."); setLoadingProfile(false); return;
        }
        setLoadingProfile(true); setErrorProfile(null); setDonationCount(0); setEarnedBadges([]);
        try {
            // Fetch profile, count, and badges concurrently
            const [profileResult, countResult, badgesResult] = await Promise.all([
                supabase.from('profil').select('id, nama_pengguna, nama_lengkap, avatar_url, created_at, bio').eq('id', userId).single(),
                supabase.from('donasi').select('id', { count: 'exact', head: true }).eq('id_donatur', userId),
                supabase.from('user_badges').select(`earned_at, badges ( id, name, description, icon_name, color_class )`).eq('user_id', userId).order('earned_at', { ascending: true })
            ]);
            // Profile
            if (profileResult.error) {
                if (profileResult.error.code === 'PGRST116') throw new Error("Profil pengguna tidak ditemukan.");
                throw profileResult.error;
            }
            setProfile(profileResult.data);
            // Count
            if (countResult.error) console.error("Error fetching donation count:", countResult.error);
            setDonationCount(countResult.count ?? 0);
            // Badges
            if (badgesResult.error) console.error("Error fetching earned badges:", badgesResult.error);
            setEarnedBadges(badgesResult.data?.map(item => ({ ...item.badges, earned_at: item.earned_at })) || []);

        } catch (err) {
            console.error("Error fetching profile data:", err);
            setErrorProfile(err.message || "Gagal memuat profil."); setProfile(null);
        } finally {
            setLoadingProfile(false);
        }
    };
    fetchProfileData();
  }, [userId]);

  // --- Fetch User's Donations (Pagination) ---
  const fetchDonations = useCallback(async (loadMore = false) => {
    if (!userId) return;
    const currentOffset = loadMore ? donationsOffset : 0;
    if (loadMore) setLoadingMoreDonations(true); else setLoadingDonations(true);
    if (!loadMore) {
        setDonationsOffset(0); // Reset offset only on initial load
        setHasMoreDonations(true); // Assume more initially
    }
    setErrorDonations(null);
    try {
        const { data, error } = await supabase
            .from('donasi').select('id, judul, url_gambar, status, lokasi_kecamatan, created_at, kategori ( nama )')
            .eq('id_donatur', userId).order('created_at', { ascending: false })
            .range(currentOffset, currentOffset + DONATION_LIMIT - 1);
        if (error) throw error;
        const newItems = data || [];
        setDonations(prev => loadMore ? [...prev, ...newItems] : newItems);
        setDonationsOffset(currentOffset + newItems.length);
        setHasMoreDonations(newItems.length === DONATION_LIMIT);
    } catch (err) {
        console.error("Error fetching donations:", err);
        setErrorDonations("Gagal memuat data donasi pengguna.");
        if (!loadMore) setDonations([]); setHasMoreDonations(false);
    } finally {
        if (loadMore) setLoadingMoreDonations(false); else setLoadingDonations(false);
    }
  }, [userId, donationsOffset]);

   // --- Fetch User's Sent Requests (Pagination) ---
   const fetchSentRequests = useCallback(async (loadMore = false) => {
    if (!userId) return;
    const currentOffset = loadMore ? sentRequestsOffset : 0;
    if (loadMore) setLoadingMoreSentRequests(true); else setLoadingSentRequests(true);
    if (!loadMore) {
        setSentRequestsOffset(0);
        setHasMoreSentRequests(true);
    }
    setErrorSentRequests(null);
    try {
        const { data, error } = await supabase
            .from('permintaan_donasi').select(`id, created_at, status, id_donasi, donasi ( judul )`, { count: 'exact' })
            .eq('id_peminta', userId).order('created_at', { ascending: false })
            .range(currentOffset, currentOffset + REQUEST_LIMIT - 1);
        if (error) throw error;
        const newItems = data || [];
        setSentRequests(prev => loadMore ? [...prev, ...newItems] : newItems);
        setSentRequestsOffset(currentOffset + newItems.length);
        setHasMoreSentRequests(newItems.length === REQUEST_LIMIT);
    } catch (err) {
        console.error("Error fetching sent requests:", err);
        setErrorSentRequests("Gagal memuat data permintaan Anda.");
        if (!loadMore) setSentRequests([]); setHasMoreSentRequests(false);
    } finally {
        if (loadMore) setLoadingMoreSentRequests(false); else setLoadingSentRequests(false);
    }
}, [userId, sentRequestsOffset]);

  // Initial data fetches based on profile load status
  useEffect(() => {
    if (!loadingProfile && userId) {
       fetchDonations(false);
       // Fetch sent requests only if viewing own profile
       if (isOwnProfile) {
           fetchSentRequests(false);
       }
    }
  }, [userId, loadingProfile, isOwnProfile, fetchDonations, fetchSentRequests]); // Added dependencies


  // --- Render Logic ---
  if (loadingProfile) {
    return <div className="container mx-auto py-10 px-4"><ProfileSkeleton /></div>;
  }
  if (errorProfile) {
     return <div className="container mx-auto py-10 px-4 text-center text-red-600 bg-red-50 p-4 rounded border border-red-200">{errorProfile}</div>;
  }
  if (!profile) {
     return <div className="container mx-auto py-10 px-4 text-center text-gray-500">Profil tidak ditemukan.</div>;
  }

  const getInitials = (name) => {
      if (!name) return '?'; const names = name.split(' ');
      if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      if (name.length > 0) return name[0].toUpperCase(); return '?';
  };

  // --- Handlers ---
  const handleOpenBadgeModal = (badge) => {
      setSelectedBadge(badge);
      setIsBadgeModalOpen(true);
  };
  const handleCloseBadgeModal = () => {
      setIsBadgeModalOpen(false);
      // Delay clearing selected badge to allow fade-out animation
      setTimeout(() => setSelectedBadge(null), 300);
  };

  return (
    <div className="container mx-auto py-10 px-4">
      {/* Profile Header - Reverted to simpler layout */}
      <div className="bg-white shadow border border-gray-100 rounded-lg p-6 md:p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-4xl md:text-5xl font-semibold overflow-hidden flex-shrink-0 border-2 border-emerald-200 shadow-sm mx-auto sm:mx-0">
             {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={`Avatar ${profile.nama_pengguna}`} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
             ) : (
                <span>{getInitials(profile.nama_pengguna)}</span>
             )}
          </div>
          {/* Info & Edit Button Container */}
          <div className="flex-grow text-center sm:text-left">
              {/* User Info */}
              <div className="space-y-1.5 mb-4">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{profile.nama_pengguna}</h1>
                  {profile.nama_lengkap && (<p className="text-md text-gray-600 flex items-center justify-center sm:justify-start gap-1.5"><IdentificationIcon className="h-5 w-5 text-gray-400"/> {profile.nama_lengkap}</p>)}
                  <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-start gap-1.5"><CalendarDaysIcon className="h-4 w-4"/> Bergabung sejak {formatDate(profile.created_at)}</p>
                  <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-start gap-1.5 pt-1"><HashtagIcon className="h-4 w-4"/> {donationCount} Donasi dibuat</p>
              </div>
               {/* Bio Section */}
               {profile.bio && (
                   <div className="mt-4 pt-4 border-t border-gray-100">
                       <p className="text-sm text-gray-600 italic whitespace-pre-wrap text-center sm:text-left">{profile.bio}</p>
                   </div>
                )}
              {/* Edit Profile Button */}
              {isOwnProfile && (
                  <div className="pt-4 mt-4 border-t border-gray-100 text-center sm:text-left"> {/* Adjusted margin/padding/border */}
                     <Link to="/edit-profile" aria-label="Edit Profil">
                         <Button variant="outline" size="sm">
                             <PencilSquareIcon className="h-4 w-4 mr-1.5 inline-block align-text-bottom" /> Edit Profil
                         </Button>
                     </Link>
                  </div>
               )}
          </div>
        </div>
      </div>

      {/* --- Badges Section (Dedicated Card) --- */}
      <div className="bg-white shadow border border-gray-100 rounded-lg p-6 md:p-8 mb-8">
          <h3 className="flex items-center gap-2 font-semibold text-gray-700 mb-4 text-lg">
             <SparklesIcon className="h-5 w-5 text-amber-500"/> Prestasi & Badge
          </h3>
          {earnedBadges.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                  {earnedBadges.map(badge => (
                      <BadgeDisplay key={badge.id} badge={badge} onClick={handleOpenBadgeModal} />
                  ))}
              </div>
          ) : (
              <p className="text-sm text-gray-500 italic">Pengguna ini belum memiliki badge.</p>
          )}
      </div>

      {/* --- Tabs Section --- */}
      <Tab.Group>
           <div className="border-b border-gray-200 mb-0">
              <Tab.List className="-mb-px flex space-x-1 sm:space-x-2 overflow-x-auto bg-gray-50 rounded-t-lg px-2 pt-2 border border-gray-200 border-b-0">
                  <Tab className={({ selected }) => classNames('whitespace-nowrap rounded-t-md py-2.5 px-4 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-opacity-50', selected ? 'bg-white text-emerald-700 border-gray-200 border-l border-t border-r' : 'text-gray-500 hover:bg-gray-100/60 hover:text-gray-700 border-transparent')}>
                      <GiftIcon className="inline h-4 w-4 mr-1.5 align-text-bottom"/> Donasi Dibuat ({donationCount})
                  </Tab>
                  {isOwnProfile && (
                      <Tab className={({ selected }) => classNames('whitespace-nowrap rounded-t-md py-2.5 px-4 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-opacity-50', selected ? 'bg-white text-emerald-700 border-gray-200 border-l border-t border-r' : 'text-gray-500 hover:bg-gray-100/60 hover:text-gray-700 border-transparent')}>
                          <DocumentMagnifyingGlassIcon className="inline h-4 w-4 mr-1.5 align-text-bottom"/> Permintaan Saya
                      </Tab>
                  )}
              </Tab.List>
           </div>
           <Tab.Panels as={Fragment}>
               {/* Panel Donasi Dibuat */}
               <Tab.Panel className="focus:outline-none ring-offset-0 ring-transparent p-0">
                   <div className="bg-white shadow-sm border border-gray-200 rounded-b-lg p-6 md:p-8">
                      {/* ... Donations content ... */}
                      {loadingDonations && donations.length === 0 && (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">{[...Array(3)].map((_, i) => (<div key={`skel-${i}`} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white"><div className="w-full aspect-video bg-gray-300"></div><div className="p-4 space-y-3"><div className="h-5 bg-gray-300 rounded w-3/4"></div><div className="h-3 bg-gray-300 rounded w-1/4"></div><div className="h-3 bg-gray-300 rounded w-1/2"></div></div></div>))}</div>)}
                      {!loadingDonations && errorDonations && (<div className="text-center text-red-600 bg-red-50 p-4 rounded border border-red-200">{errorDonations}</div>)}
                      {!loadingDonations && !errorDonations && donations.length === 0 && (<EmptyPlaceholder icon={GiftIcon} message={`${profile.nama_pengguna} belum membuat donasi.`}>{isOwnProfile && <Link to="/donate"><Button size="sm" variant="primary">Buat Donasi Pertama</Button></Link>}</EmptyPlaceholder>)}
                      {donations.length > 0 && (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{donations.map(donation => (<DonationCard key={donation.id} className="h-full transition-shadow duration-200 hover:shadow-xl" id={donation.id} title={donation.judul} imageUrl={donation.url_gambar?.[0]} category={donation.kategori?.nama} location={donation.lokasi_kecamatan} status={donation.status} date={donation.created_at}/>))}</div>)}
                      {hasMoreDonations && !loadingMoreDonations && !errorDonations && donations.length > 0 && (<div className="text-center mt-8"><Button variant="outline" onClick={() => fetchDonations(true)} disabled={loadingMoreDonations} className="inline-flex items-center justify-center gap-2"><ArrowPathIcon className="h-5 w-5 mr-1" /> Lihat Lebih Banyak</Button></div>)}
                      {loadingMoreDonations && (<div className="text-center mt-8"><ArrowPathIcon className="animate-spin h-6 w-6 text-gray-500 mx-auto" /></div>)}
                   </div>
               </Tab.Panel>
               {/* Panel Permintaan Saya */}
               {isOwnProfile && (
                   <Tab.Panel className="focus:outline-none ring-offset-0 ring-transparent p-0">
                       <div className="bg-white shadow-sm border border-gray-200 rounded-b-lg p-6 md:p-8">
                          {/* ... Sent Requests content ... */}
                          {loadingSentRequests && sentRequests.length === 0 && (<div className="space-y-4 animate-pulse">{[...Array(3)].map((_, i) => <div key={`req-skel-${i}`} className="h-20 bg-gray-200 rounded-md"></div>)}</div>)}
                          {!loadingSentRequests && errorSentRequests && (<div className="text-center text-red-600 bg-red-50 p-4 rounded border border-red-200">{errorSentRequests}</div>)}
                          {!loadingSentRequests && !errorSentRequests && sentRequests.length === 0 && (<EmptyPlaceholder icon={DocumentMagnifyingGlassIcon} message="Anda belum pernah mengajukan permintaan barang."><Link to="/browse"><Button size="sm" variant="outline">Cari Barang Donasi</Button></Link></EmptyPlaceholder>)}
                          {sentRequests.length > 0 && (<ul className="space-y-4">{sentRequests.map(request => <SentRequestItem key={request.id} request={request} />)}</ul>)}
                          {hasMoreSentRequests && !loadingMoreSentRequests && !errorSentRequests && sentRequests.length > 0 && (<div className="text-center mt-8"><Button variant="outline" onClick={() => fetchSentRequests(true)} disabled={loadingMoreSentRequests} className="inline-flex items-center justify-center gap-2"><ArrowPathIcon className="h-5 w-5 mr-1" /> Muat Permintaan Lainnya</Button></div>)}
                          {loadingMoreSentRequests && (<div className="text-center mt-8"><ArrowPathIcon className="animate-spin h-6 w-6 text-gray-500 mx-auto" /></div>)}
                       </div>
                   </Tab.Panel>
               )}
           </Tab.Panels>
       </Tab.Group>

        {/* Badge Detail Modal */}
        <BadgeDetailModal
            isOpen={isBadgeModalOpen}
            onClose={handleCloseBadgeModal}
            badge={selectedBadge}
        />
    </div>
  );
}

export default ProfilePage; 