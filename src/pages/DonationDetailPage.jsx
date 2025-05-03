import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import DonationCard from '../components/ui/DonationCard'; // For related donations
import DonationDiscussion from '../components/features/DonationDiscussion'; // Import komponen baru
// import { toast } from 'react-hot-toast'; // Opsional

// -- Swiper --
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules'; // Import modules
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import {
  PhotoIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  MapPinIcon,
  CheckCircleIcon,
  ShareIcon, // For share button
  XMarkIcon, // For modal close
  ChevronLeftIcon, // For lightbox nav
  ChevronRightIcon, // For lightbox nav
  PencilSquareIcon, // For Edit button
  CheckBadgeIcon, // For Mark as Donated button
  ChatBubbleLeftEllipsisIcon, // For Discussion Placeholder
  ArrowPathIcon, // For loading spinners
  InformationCircleIcon, // For info messages
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { TagIcon } from '@heroicons/react/20/solid'; // Solid icon for category

// Helper untuk format tanggal (opsional)
function formatDate(dateString) {
  if (!dateString) return 'Tanggal tidak tersedia';
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString; // Kembalikan string asli jika format gagal
  }
}

// --- Placeholder Image URL ---
const PLACEHOLDER_IMAGE_URL = 'https://via.placeholder.com/300x200/f0fdf4/cccccc?text=Gagal+Muat';

// --- Placeholder Components ---
// Basic Placeholder for Related Donation Cards
function PlaceholderRelatedCard() {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white animate-pulse">
      <div className="w-full aspect-video bg-gray-300"></div>
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-300 rounded w-3/4"></div>
        <div className="h-3 bg-gray-300 rounded w-1/4"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
      </div>
    </div>
  );
}

// Skeleton for the entire Detail Page
function DonationDetailSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl animate-pulse">
      {/* Main Detail Card Placeholder */}
      <div className="bg-surface rounded-lg shadow-lg overflow-hidden border border-gray-200 mb-8">
        <div className="w-full aspect-video bg-gray-300"></div>
        <div className="p-6 md:p-8">
          <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-5">
             {/* ... meta placeholders ... */}
          </div>
          <div className="mb-4">
             {/* ... condition placeholders ... */}
          </div>
          <div className="mb-6">
             {/* ... description placeholders ... */}
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
             {/* ... button placeholders ... */}
          </div>
        </div>
      </div>

      {/* Donor Info Placeholder */}
      <div className="bg-surface rounded-lg shadow-lg overflow-hidden border border-gray-200 p-6 md:p-8 mb-8">
         <div className="h-6 bg-gray-300 rounded w-1/3 mb-5"></div> {/* Section Title */}
         <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-gray-300 rounded-full"></div> {/* Avatar */}
            <div className="space-y-2 flex-grow">
               <div className="h-5 bg-gray-300 rounded w-1/2"></div> {/* Name */}
               <div className="h-3 bg-gray-300 rounded w-1/3"></div> {/* Join date */}
               <div className="h-3 bg-gray-300 rounded w-1/4 mt-1"></div> {/* Profile link */}
            </div>
         </div>
      </div>

      {/* Related Donations Placeholder */}
      <div className="bg-surface rounded-lg shadow-lg overflow-hidden border border-gray-200 p-6 md:p-8 mb-8">
         <div className="h-6 bg-gray-300 rounded w-1/4 mb-5"></div> {/* Section Title */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             <PlaceholderRelatedCard />
             <PlaceholderRelatedCard />
             <PlaceholderRelatedCard />
         </div>
      </div>

    </div>
  );
}
// --- End Placeholder Components ---

// --- Lightbox Modal Component - Enhanced ---
function ImageLightbox({ images, selectedIndex, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(selectedIndex);

    // Keyboard Navigation & Close
    const handleKeyDown = useCallback((event) => {
        if (event.key === 'Escape') {
            onClose();
        } else if (event.key === 'ArrowLeft' && images.length > 1) {
            setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        } else if (event.key === 'ArrowRight' && images.length > 1) {
            setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        }
    }, [onClose, images.length]);

    useEffect(() => {
        if (selectedIndex !== null && selectedIndex >= 0) {
            setCurrentIndex(selectedIndex);
            document.addEventListener('keydown', handleKeyDown);
        } else {
            document.removeEventListener('keydown', handleKeyDown);
        }
        // Cleanup listener on component unmount or when closed
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedIndex, handleKeyDown]);

    if (selectedIndex === null || selectedIndex < 0) return null;

    const handlePrev = (e) => {
        e.stopPropagation(); 
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    };

    const handleNext = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    };

    // Image error handler for lightbox image itself
    const handleImageError = (e) => {
      e.target.src = PLACEHOLDER_IMAGE_URL; // Replace with placeholder on error
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
            onClick={onClose} 
        >
            {/* Close Button */} 
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
             >
                <XMarkIcon className="h-8 w-8"/>
             </button>

            {/* Navigation Buttons */} 
             {images.length > 1 && (
                 <>
                    <button 
                        onClick={handlePrev} 
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 bg-black/50 rounded-full hover:bg-black/70 z-50 transition-colors"
                    >
                        <ChevronLeftIcon className="h-6 w-6"/>
                    </button>
                    <button 
                        onClick={handleNext} 
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 bg-black/50 rounded-full hover:bg-black/70 z-50 transition-colors"
                    >
                        <ChevronRightIcon className="h-6 w-6"/>
                    </button>
                 </>
             )}
            
             {/* Image Display & Counter */}
            <div className="relative" onClick={(e) => e.stopPropagation()}> 
                <img 
                    src={currentIndex !== null && currentIndex >= 0 ? images[currentIndex] : ''} 
                    alt={currentIndex !== null && currentIndex >= 0 ? `Donation Image ${currentIndex + 1}` : ''} 
                    className={`max-w-full max-h-[90vh] object-contain cursor-default block ${currentIndex === null || currentIndex < 0 ? 'hidden' : ''}`} 
                    onError={handleImageError}
                 />
                 {/* Counter */} 
                 {images.length > 1 && (
                     <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                         {currentIndex + 1} / {images.length}
                     </div>
                 )}
            </div>
        </div>
    );
}
// --- End Lightbox Modal ---

// --- Confirmation Modal for Mark as Donated ---
function MarkAsDonatedConfirmationModal({ isOpen, onClose, onConfirm, isLoading }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 sm:mx-0 sm:h-10 sm:w-10">
                        <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                           Konfirmasi Aksi
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">
                                Apakah Anda yakin ingin menandai donasi ini sebagai "Sudah Didonasikan"? Aksi ini tidak dapat dibatalkan dan akan menyembunyikan tombol permintaan.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                    <Button
                        variant="warning" // Or another suitable variant
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="w-full inline-flex justify-center sm:w-auto"
                    >
                         {isLoading ? <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" /> : <CheckBadgeIcon className="h-5 w-5 mr-2" />} 
                         {isLoading ? 'Memproses...' : 'Ya, Tandai Sudah Didonasikan'}
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

function DonationDetailPage() {
  const { id: donationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate(); // For "Lihat Semua Serupa"

  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- State for User Request Actions ---
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [userRequestStatus, setUserRequestStatus] = useState('idle'); // idle, loading, requested, not_requested, error
  const [loadingUserRequest, setLoadingUserRequest] = useState(true); // Separate loading for this check

  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Related Donations State
  const [relatedDonations, setRelatedDonations] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const RELATED_LIMIT = 3;

  // --- State for Mark As Donated action ---
  const [markLoading, setMarkLoading] = useState(false);
  const [markError, setMarkError] = useState(null);
  const [markSuccessMessage, setMarkSuccessMessage] = useState('');
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false); // State for confirmation modal

  useEffect(() => {
    const fetchDonationDetails = async () => {
      if (!donationId) return;
      setLoading(true);
      setError(null);
      setDonation(null); // Reset donation state
      setRelatedDonations([]); // Reset related donations
      try {
        const { data, error: fetchError } = await supabase
          .from('donasi')
          .select(`
            id,
            judul,
            deskripsi,
            kondisi,
            url_gambar,
            created_at,
            status,
            id_donatur,
            lokasi_kecamatan,
            id_kategori,
            profil ( id, nama_pengguna, avatar_url, created_at ),
            kategori ( nama )
          `)
          .eq('id', donationId)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') { // Kode error Supabase untuk "Not Found"
            throw new Error("Donasi tidak ditemukan.");
          } else {
            throw fetchError;
          }
        }
        setDonation(data);
      } catch (err) {
        console.error("Error fetching donation details:", err);
        setError(err.message || "Gagal memuat detail donasi.");
      } finally {
        setLoading(false);
      }
    };

    fetchDonationDetails();
  }, [donationId]); // Jalankan ulang effect jika ID berubah

  // --- Effect for Fetching User Request Status ---
  useEffect(() => {
    if (!user || !donation || donation.status !== 'tersedia') {
        // No need to check if not logged in, donation not loaded, or donation not available
        setLoadingUserRequest(false);
        setUserRequestStatus('idle'); // Or 'not_applicable'?
        return;
    }
    
    // Don't check if user is the owner
    if (user.id === donation.id_donatur) {
         setLoadingUserRequest(false);
         setUserRequestStatus('is_owner');
         return;
    }

    const checkUserRequest = async () => {
        setLoadingUserRequest(true);
        // Default to not_requested, will be overwritten if a request is found
        setUserRequestStatus('not_requested'); 
        setRequestError(null); 
        try {
            // Fetch the status of the MOST RECENT request for this user/donation
            const { data: latestRequest, error: checkError } = await supabase
                .from('permintaan_donasi')
                .select('status') // Select the status
                .eq('id_donasi', donation.id)
                .eq('id_peminta', user.id)
                .order('created_at', { ascending: false }) // Get the latest one first
                .limit(1)
                .maybeSingle(); // Get one record or null
            
            if (checkError && checkError.code !== 'PGRST116') { // Ignore row not found
                 throw checkError;
             }

            // If a latest request record exists, set its status
            if (latestRequest) {
                console.log("Latest request status found:", latestRequest.status);
                setUserRequestStatus(latestRequest.status);
            } else {
                // No request record exists at all
                console.log("No previous request found.");
                setUserRequestStatus('not_requested');
            }
        } catch (err) {
            console.error("Error checking user request status:", err);
            setUserRequestStatus('error');
            // Optionally set a specific error message for the user?
        } finally {
            setLoadingUserRequest(false);
        }
    };

    checkUserRequest();

  }, [user, donation]); // Rerun when user or donation data changes

  // --- Effect for fetching Related Donations ---
  useEffect(() => {
      if (!donation || !donation.id_kategori) return; // Need donation and category ID

      const fetchRelatedDonations = async () => {
          setLoadingRelated(true);
          // setErrorRelated(null);
          try {
              const { data, error: relatedError } = await supabase
                  .from('donasi')
                  .select(`
                      id,
                      judul,
                      url_gambar,
                      lokasi_kecamatan,
                      kategori ( nama )
                  `) // Select fields needed for DonationCard
                  .eq('id_kategori', donation.id_kategori)
                  .eq('status', 'tersedia') // Only show available related items
                  .neq('id', donation.id) // Exclude current donation
                  .limit(3); // Limit to 3 related items

              if (relatedError) throw relatedError;
              setRelatedDonations(data || []);
          } catch (err) {
              console.error("Error fetching related donations:", err);
              // setErrorRelated("Gagal memuat donasi terkait.");
          } finally {
              setLoadingRelated(false);
          }
      };

      fetchRelatedDonations();

  }, [donation]); // Run when donation data is available/updated
  // --- End Related Donations Effect ---

  // Handler untuk tombol minta donasi (Reverted Logic)
  const handleRequestDonation = async () => {
    if (!user || !donation || user.id === donation.id_donatur || userRequestStatus === 'requested') { // Check against UI status
      setRequestError("Aksi tidak diizinkan atau Anda sudah meminta barang ini.");
      return;
    }

    setRequestLoading(true); 
    setRequestError(null);

    try {
      // --- REVERTED: Directly attempt INSERT ---
      console.log("Attempting to insert new request...");
      const requestData = {
        id_donasi: donation.id,
        id_peminta: user.id, 
        status: 'pending'
      };
      const { error: insertError } = await supabase
          .from('permintaan_donasi')
          .insert([requestData]);
      
      if (insertError) {
         // Check for unique constraint violation specifically
         if (insertError.code === '23505') { 
           throw new Error("Anda sudah pernah meminta barang ini.");
         } else {
           throw insertError;
         }
      }
      console.log("New request inserted successfully.");
      // ------------------------------------------
      
      setUserRequestStatus('requested'); // Update UI status after successful insert

    } catch (err) {
      console.error("Error requesting donation (reverted logic):", err);
      setRequestError(err.message || "Gagal mengirim permintaan.");
    } finally {
      setRequestLoading(false);
    }
  };

  // --- Share Functionality ---
  const handleShare = async () => {
    const shareData = {
      title: `Donasi: ${donation?.judul || 'Barang'}`,
      text: `Lihat donasi menarik ini: ${donation?.judul || 'Barang'}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        console.log('Donation shared successfully');
        // toast.success('Link dibagikan!'); // Optional feedback
      } else {
        // Fallback for browsers that don't support navigator.share
        await navigator.clipboard.writeText(window.location.href);
        alert('Link donasi telah disalin ke clipboard!'); // Simple alert fallback
        // toast.success('Link disalin ke clipboard!'); // Optional feedback
      }
    } catch (err) {
      console.error('Error sharing donation:', err);
      alert('Gagal membagikan donasi.'); // Simple alert fallback
      // toast.error('Gagal membagikan.'); // Optional feedback
    }
  };
  // --- End Share Functionality ---

  // --- Handlers for Mark as Donated ---
  const handleMarkAsDonated = () => {
      // Open confirmation modal instead of direct action
       if (!user || !donation || user.id !== donation.id_donatur || donation.status === 'didonasikan') return;
       setIsMarkModalOpen(true);
  };

  const confirmMarkAsDonated = async () => {
    // This function contains the actual logic, called from the modal
    if (!user || !donation || user.id !== donation.id_donatur) return;

    setMarkLoading(true);
    setMarkError(null);
    setMarkSuccessMessage('');
    const previousStatus = donation.status; 

    try {
        // Optimistic UI update
        setDonation(prev => prev ? { ...prev, status: 'didonasikan' } : null);

        const { error: updateError } = await supabase
            .from('donasi')
            .update({ status: 'didonasikan' })
            .eq('id', donation.id)
            .eq('id_donatur', user.id);

        if (updateError) {
            setDonation(prev => prev ? { ...prev, status: previousStatus } : null);
            throw updateError;
        }
        setMarkSuccessMessage("Status donasi berhasil diperbarui menjadi 'didonasikan'.");
        setTimeout(() => setMarkSuccessMessage(''), 5000);
        setIsMarkModalOpen(false); // Close modal on success
    } catch (err) {
        console.error("Error marking donation as donated:", err);
        setMarkError(err.message || "Gagal memperbarui status donasi.");
        // Keep modal open on error?
    } finally {
        setMarkLoading(false);
    }
  };

  // Render Loading using Skeleton
  if (loading) {
    return <DonationDetailSkeleton />;
  }

  // Render Error
  if (error) {
    return <div className="container mx-auto py-10 px-4 text-center text-error">Error: {error}</div>;
  }

  // Render Not Found (jika data null setelah loading selesai)
  if (!donation) {
      return <div className="container mx-auto py-10 px-4 text-center text-text-secondary">Donasi tidak ditemukan.</div>;
  }

  const isOwner = user && user.id === donation?.id_donatur;
  const canPotentiallyRequest = user && donation?.status === 'tersedia' && !isOwner;

  // Image error handler for Swiper slide image
  const handleSwiperImageError = (e) => {
      e.target.src = PLACEHOLDER_IMAGE_URL;
      // Optional: could also add a class to the slide to indicate error
  };

  // Render Detail Donasi
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="bg-surface rounded-lg shadow-lg overflow-hidden border border-gray-200 mb-8">
        {/* Image Carousel Area */}
        {donation?.url_gambar && donation.url_gambar.length > 0 ? (
            <Swiper
              modules={[Navigation, Pagination, A11y]} // Register modules
              spaceBetween={10}
              slidesPerView={1}
              navigation // Enable navigation arrows
              pagination={{ clickable: true }} // Enable pagination dots
              className="aspect-video bg-gray-100" // Consistent aspect ratio
            >
              {donation.url_gambar.map((url, index) => (
                <SwiperSlide key={index} onClick={() => setLightboxIndex(index)} className="cursor-pointer bg-gray-200">
                  <img
                    src={url}
                    alt={`${donation.judul} - Gambar ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={handleSwiperImageError}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
             {/* No Image Placeholder */}
          )}

        <div className="p-6 md:p-8">
          {/* Share Button */}
           <button
              onClick={handleShare}
              className="float-right ml-4 -mt-2 mb-2 p-2 text-gray-500 hover:text-emerald-600 rounded-full hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
              title="Bagikan Donasi Ini"
           >
              <ShareIcon className="h-5 w-5"/>
           </button>
          {/* Judul */}
          <h1 className="text-2xl md:text-3xl font-bold text-secondary mb-3">{donation.judul}</h1>

          {/* Info Meta (Kategori, Donatur, Tanggal, Lokasi) */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-x-4 gap-y-2 text-sm text-text-secondary mb-4">
            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-medium">
              <TagIcon className="h-4 w-4"/>
              {donation.kategori?.nama || 'Lainnya'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UserCircleIcon className="h-4 w-4"/>
              oleh
              {donation.profil?.id ? (
                 <Link to={`/profile/${donation.profil.id}`} className="font-medium text-primary hover:underline hover:text-emerald-700 transition-colors duration-150">
                     {donation.profil.nama_pengguna || 'Anonim'}
                 </Link>
              ) : (
                  <span className="font-medium text-text-primary">{donation.profil?.nama_pengguna || 'Anonim'}</span>
              )}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDaysIcon className="h-4 w-4"/>
              {formatDate(donation.created_at)}
            </span>
            {donation.lokasi_kecamatan && (
                <span className="inline-flex items-center gap-1.5">
                   <MapPinIcon className="h-4 w-4"/>
                   {donation.lokasi_kecamatan}
                </span>
            )}
            <span className={`inline-flex items-center gap-1.5 capitalize px-2.5 py-0.5 rounded-full font-medium text-xs
              ${donation.status === 'tersedia' ? 'bg-green-100 text-green-800' :
                 donation.status === 'dipesan' ? 'bg-amber-100 text-amber-800' :
                 'bg-gray-100 text-gray-800'}`}>
              {donation.status === 'tersedia' ? <CheckCircleIcon className="h-3.5 w-3.5"/> : donation.status === 'dipesan' ? <ArrowPathIcon className="h-3.5 w-3.5"/> : <XMarkIcon className="h-3.5 w-3.5"/>}
              Status: {donation.status}
            </span>
          </div>

          {/* Kondisi */}
          <div className="mb-4">
            <h3 className="font-semibold text-text-primary mb-1">Kondisi Barang:</h3>
            <p className="text-text-secondary">{donation.kondisi || 'Tidak disebutkan'}</p>
          </div>

          {/* Deskripsi */}
          {donation.deskripsi && (
             <div className="mb-6">
                <h3 className="font-semibold text-text-primary mb-1">Deskripsi:</h3>
                <p className="text-text-secondary whitespace-pre-wrap">{donation.deskripsi}</p>
             </div>
          )}

          {/* === Action Buttons Section === */} 
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-4"> 
                {/* --- Request Donation Section --- */} 
                {canPotentiallyRequest && (
                   <div>
                        {/* Loading State for Request Check */} 
                        {loadingUserRequest && (
                           <div className="flex items-center text-sm text-gray-500">
                              <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" /> Memeriksa status permintaan...
                           </div>
                        )}

                        {/* --- Show Button OR Status Message based on userRequestStatus --- */} 
                        {!loadingUserRequest && userRequestStatus === 'not_requested' && (
                           <> 
                             <h3 className="font-semibold text-text-primary mb-2">Tertarik dengan barang ini?</h3>
                              {/* Request Button with Loading State */} 
                              <Button
                                  onClick={handleRequestDonation}
                                  disabled={requestLoading} // Disable only while submitting
                                  variant="primary"
                                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 min-w-[150px]"
                              >
                                   {requestLoading ? <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" /> : null}
                                   {requestLoading ? 'Mengirim Permintaan...' : 'Minta Barang Ini'}
                              </Button>
                           </>
                        )}

                        {/* Status: Pending */} 
                        {!loadingUserRequest && userRequestStatus === 'pending' && (
                            <div className="flex items-center gap-2 bg-orange-50 text-orange-700 p-3 rounded-md text-sm">
                                <ClockIcon className="h-5 w-5 flex-shrink-0"/>
                                <span>Permintaan Anda sedang ditinjau oleh donatur.</span>
                            </div>
                        )}

                        {/* Status: Disetujui */} 
                        {!loadingUserRequest && userRequestStatus === 'disetujui' && (
                            <div className="flex items-center gap-2 bg-sky-50 text-sky-700 p-3 rounded-md text-sm">
                                <CheckCircleIcon className="h-5 w-5 flex-shrink-0"/>
                                <span>Permintaan Anda disetujui! Silakan cek chat untuk koordinasi.</span>
                            </div>
                        )}

                        {/* Status: Ditolak */} 
                        {!loadingUserRequest && userRequestStatus === 'ditolak' && (
                            <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-md text-sm">
                                <XCircleIcon className="h-5 w-5 flex-shrink-0"/>
                                <span>Maaf, permintaan Anda untuk barang ini sebelumnya ditolak.</span>
                            </div>
                        )}

                        {/* Status: Selesai */} 
                        {!loadingUserRequest && userRequestStatus === 'selesai' && (
                            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 p-3 rounded-md text-sm">
                                <CheckBadgeIcon className="h-5 w-5 flex-shrink-0"/>
                                <span>Anda telah menyelesaikan transaksi untuk barang ini.</span>
                            </div>
                        )}

                        {/* Request Error Message (from submission attempt) */} 
                        {requestError && (
                             <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-md text-sm">
                                 <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0"/>
                                 <span>Error: {requestError}</span>
                             </div>
                        )}
                        {/* Error checking status */} 
                         {userRequestStatus === 'error' && !requestError && (
                            <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 p-3 rounded-md text-sm">
                                <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0"/>
                                <span>Gagal memeriksa status permintaan Anda. Coba muat ulang halaman.</span>
                            </div>
                         )}
                   </div>
                )}

                {/* --- Owner Actions Section --- */} 
                {isOwner && (
                   <div className="space-y-3"> 
                       <div className="md:flex md:items-center md:justify-between md:gap-4"> 
                          <h3 className="font-semibold text-text-primary mb-2 md:mb-0 md:flex-shrink-0">Aksi Pemilik:</h3>
                          {/* Consistent Button Layout */} 
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-grow sm:justify-end"> 
                             <Link to={`/donations/${donationId}/edit`} className="w-full sm:w-auto"> 
                                 <Button variant="outline" className="w-full inline-flex items-center justify-center gap-2"> 
                                     <PencilSquareIcon className="h-5 w-5"/> Edit Donasi
                                 </Button>
                             </Link>
                             <Button
                                 onClick={handleMarkAsDonated} // Opens modal now
                                 disabled={donation?.status === 'didonasikan' || markLoading} // Disable button if already done or modal loading
                                 variant={donation?.status === 'didonasikan' ? 'secondary' : 'success'}
                                 className="w-full sm:w-auto inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                 {/* Keep icon consistent, loading handled in modal */}
                                 <CheckBadgeIcon className="h-5 w-5"/>
                                 {donation?.status === 'didonasikan' ? 'Sudah Didonasikan' : 'Tandai Sudah Didonasikan'}
                             </Button>
                          </div>
                       </div>
                       {/* Display Area for Feedback (after modal confirmation) */} 
                        {markError && ( 
                             <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-md text-sm mt-2">
                                 <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0"/>
                                 <span>Error: {markError}</span>
                             </div>
                        )} 
                        {markSuccessMessage && !markError && (
                             <div className="flex items-center gap-2 bg-green-50 text-green-700 p-3 rounded-md text-sm mt-2 fade-out-fast">
                                 <CheckCircleIcon className="h-5 w-5 flex-shrink-0"/>
                                 <span>{markSuccessMessage}</span>
                             </div>
                        )}
                    </div>
                )}

                {/* --- Not Logged In Prompt --- */} 
                {!user && donation?.status === 'tersedia' && (
                    <p className="text-sm text-text-secondary">Silakan <Link to="/login" className="text-primary font-medium hover:underline">masuk</Link> atau <Link to="/signup" className="text-primary font-medium hover:underline">daftar</Link> untuk meminta barang ini.</p>
                )}
          </div>
          {/* === End Action Buttons Section === */} 

        </div>
      </div>

      {/* Informasi Donatur Section - Consistent Styling */}
      {donation?.profil && (
          <div className="bg-surface rounded-lg shadow-lg p-6 md:p-8 border border-gray-200 mb-8"> {/* Matched styles */}
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Tentang Donatur</h2>
              <div className="flex items-center gap-4">
                  {/* Avatar or Icon */}
                  {donation.profil.avatar_url ? (
                      <img src={donation.profil.avatar_url} alt={donation.profil.nama_pengguna} className="h-14 w-14 rounded-full object-cover border-2 border-gray-200" onError={(e) => e.target.style.display='none'} />
                  ) : (
                      <UserCircleIcon className="h-14 w-14 text-gray-400"/>
                  )}
                  <div className="space-y-0.5">
                      <p className="font-semibold text-gray-900 text-lg">{donation.profil.nama_pengguna || 'Anonim'}</p>
                      {/* Join Date */}
                      {donation.profil.created_at && (
                          <p className="text-xs text-gray-500">(Bergabung sejak {formatDate(donation.profil.created_at).split(' pukul')[0]})</p>
                      )}
                      {/* Profile Link */}
                       {donation.profil.id && (
                           <Link to={`/profile/${donation.profil.id}`} className="text-sm text-emerald-600 hover:underline block pt-1">
                               Lihat Profil Lengkap
                           </Link>
                       )}
                  </div>
              </div>
               {/* Note about contacting: shown only if contact info is not displayed */}
               <p className="text-xs text-gray-500 mt-3 italic">
                   Informasi kontak akan tersedia setelah permintaan Anda disetujui oleh donatur.
               </p>
          </div>
      )}

       {/* --- Discussion Section (Now using DonationDiscussion) --- */}
       {!loading && donation && ( // Pastikan donasi sudah load sebelum render diskusi
            <div className="mb-8">
                <DonationDiscussion 
                    donationId={donation.id}
                    donatorId={donation.id_donatur}
                />
            </div>
       )}
       {/* --- End Discussion Section --- */}

      {/* Related Donations Section - Consistent Styling & Placeholder */}
      {(loadingRelated || relatedDonations.length > 0) && ( // Show section container if loading or has results
            <div className="bg-surface rounded-lg shadow-lg p-6 md:p-8 border border-gray-200 mb-8"> {/* Matched styles */}
                 <h2 className="text-xl font-semibold text-gray-800 mb-4">Donasi Serupa</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6"> {/* Added mb-6 */}
                    {loadingRelated ? (
                        [...Array(3)].map((_, i) => <PlaceholderRelatedCard key={i} />) // Use specific placeholder
                    ) : (
                        relatedDonations.map(related => (
                           <Link to={`/donations/${related.id}`} key={related.id} className="block h-full group">
                              <DonationCard
                                 className="h-full transition-shadow duration-200 group-hover:shadow-xl" // Added group-hover
                                 id={related.id}
                                 title={related.judul}
                                 category={related.kategori?.nama || 'Lainnya'}
                                 imageUrl={related.url_gambar?.[0] || null}
                                 location={related.lokasi_kecamatan}
                               />
                           </Link>
                        ))
                    )}
                 </div>
                 {/* --- Lihat Semua Button --- */} 
                 {!loadingRelated && relatedDonations.length >= RELATED_LIMIT && donation.id_kategori && ( 
                     <div className="text-center">
                         <Button 
                             variant="ghost" 
                             onClick={() => navigate(`/browse?category=${donation.id_kategori}`)} // Navigate with category filter
                             className="text-primary font-medium"
                         >
                            Lihat Semua Donasi Serupa &rarr;
                         </Button>
                     </div>
                 )}
            </div>
      )}

      {/* Lightbox Modal */}
      <ImageLightbox
        images={donation?.url_gambar || []}
        selectedIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />

       {/* Mark as Donated Confirmation Modal */} 
       <MarkAsDonatedConfirmationModal 
           isOpen={isMarkModalOpen}
           onClose={() => setIsMarkModalOpen(false)}
           onConfirm={confirmMarkAsDonated}
           isLoading={markLoading}
       />

    </div>
  );
}

export default DonationDetailPage;