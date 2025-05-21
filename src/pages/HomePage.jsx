import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Button from '../components/ui/Button';
import DonationCard from '../components/ui/DonationCard';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { GiftIcon, ArrowRightIcon, ClockIcon, HeartIcon, SparklesIcon, ChevronDownIcon, InboxIcon, DocumentPlusIcon, ChatBubbleLeftRightIcon, CheckCircleIcon, ArrowLongRightIcon, TagIcon, MapPinIcon, CalendarDaysIcon, ListBulletIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

import heroImageUrl from '../assets/hero.png';

function PlaceholderDonationCard() {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white animate-pulse">
      <div className="w-full h-48 bg-gray-300"></div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-3 bg-gray-300 rounded w-1/4"></div>
        <div className="h-3 bg-gray-300 rounded w-full"></div>
        <div className="h-3 bg-gray-300 rounded w-5/6"></div>
      </div>
    </div>
  );
}

function WishlistCard({ item }) {
    const getInitials = (name) => {
        if (!name) return '?';
        const names = name.split(' ');
        return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name[0]?.toUpperCase() || '?';
    };
    const timeAgo = item.created_at ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: localeID }) : '-';

    return (
        <div className="h-full flex flex-col border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white transition-shadow duration-200 hover:shadow-md">
            <div className="px-4 py-3 bg-gray-50/70 border-b border-gray-100 flex items-center gap-2">
                <Link to={`/profile/${item.profil.id}`} className="block h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-semibold overflow-hidden flex-shrink-0 ring-1 ring-white hover:ring-emerald-200 transition-all" title={item.profil?.nama_pengguna || 'User'}>
                    {item.profil?.avatar_url ? (
                        <img src={item.profil.avatar_url} alt="Avatar" className="rounded-full h-full w-full object-cover" />
                    ) : (
                        <span>{getInitials(item.profil?.nama_pengguna)}</span>
                    )}
                </Link>
                <div>
                    <p className="text-xs text-gray-500">Diminta oleh:</p>
                    <Link to={`/profile/${item.profil.id}`} className="text-sm font-medium text-gray-700 hover:text-primary truncate block">
                         {item.profil?.nama_pengguna || 'Anonim'}
                    </Link>
                </div>
            </div>
            <div className="p-4 flex-grow flex flex-col">
                <h3 className="text-base font-semibold text-gray-800 mb-1 line-clamp-2 flex-grow">
                    <Link to={`/wishlist/${item.id}`} className="hover:text-primary transition-colors">
                        {item.judul}
                    </Link>
                </h3>
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                    <span className="flex items-center gap-1.5">
                        <TagIcon className="h-3.5 w-3.5 text-emerald-500" />
                        {item.kategori?.nama || 'Lainnya'}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <CalendarDaysIcon className="h-3.5 w-3.5 text-gray-400" />
                        {timeAgo}
                    </span>
                </div>
            </div>
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 mt-auto">
                 <Link to={`/wishlist/${item.id}`} className="w-full block text-center">
                    <Button variant="outline" size="sm" className="w-full border-primary text-primary hover:bg-emerald-50">
                        Lihat Detail
                    </Button>
                </Link>
            </div>
        </div>
    );
}

function PlaceholderWishlistCard() {
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white animate-pulse">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
                <div className="space-y-1.5 flex-grow">
                    <div className="h-2.5 bg-gray-300 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </div>
            </div>
            <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2 pt-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/3"></div>
            </div>
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                 <div className="h-8 bg-gray-300 rounded w-full"></div>
            </div>
        </div>
    );
}

function HomePage() {
  // State untuk donasi terbaru
  const [recentDonations, setRecentDonations] = useState([]);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [errorDonations, setErrorDonations] = useState(null);

  // State untuk wishlist terbaru
  const [recentWishlist, setRecentWishlist] = useState([]);
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  const [errorWishlist, setErrorWishlist] = useState(null);

  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  // Fetch donasi terbaru
  useEffect(() => {
    const fetchRecentDonations = async () => {
      setLoadingDonations(true);
      setErrorDonations(null);
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
            lokasi_kecamatan,
            kategori ( nama )
          `)
          .eq('status', 'tersedia')
          .order('created_at', { ascending: false })
          .limit(3); // Ambil 3 donasi terbaru

        if (fetchError) throw fetchError;
        setRecentDonations(data || []);
      } catch (err) {
        console.error("Error fetching recent donations:", err);
        setErrorDonations("Gagal memuat donasi terbaru.");
      } finally {
        setLoadingDonations(false);
      }
    };
    fetchRecentDonations();
  }, []);

  // Fetch wishlist terbaru
  useEffect(() => {
    const fetchRecentWishlist = async () => {
        setLoadingWishlist(true);
        setErrorWishlist(null);
        try {
            const { data, error: fetchError } = await supabase
                .from('permintaan_barang')
                .select(`id, judul, created_at, kategori ( nama ), profil ( id, nama_pengguna, avatar_url )`)
                .eq('status', 'aktif')
                .order('created_at', { ascending: false })
                .limit(3); // Ambil 3 wishlist terbaru
            
            if (fetchError) throw fetchError;
            setRecentWishlist(data || []);
        } catch (err) {
            console.error("Error fetching recent wishlist:", err);
            setErrorWishlist("Gagal memuat permintaan terbaru.");
        } finally {
            setLoadingWishlist(false);
        }
    };
    fetchRecentWishlist();
  }, []);

  // <-- useEffect untuk MENGATUR visibility indicator berdasarkan scroll -->
  useEffect(() => {
    let lastKnownScrollPosition = 0;
    let ticking = false;

    const handleScrollIndicator = () => {
      lastKnownScrollPosition = window.scrollY;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Tampilkan jika di paling atas (atau sangat dekat)
          if (lastKnownScrollPosition <= 10) {
            setShowScrollIndicator(true);
          } else {
            // Sembunyikan jika sudah scroll ke bawah
            setShowScrollIndicator(false);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    // Panggil sekali saat mount untuk set state awal yang benar
    handleScrollIndicator(); 

    // Tambahkan listener scroll
    window.addEventListener('scroll', handleScrollIndicator, { passive: true });

    // Cleanup listener saat komponen unmount
    return () => {
      window.removeEventListener('scroll', handleScrollIndicator);
    };
  }, []); // <-- Dependency array KOSONG agar listener hanya dipasang/dilepas sekali

  return (
    <div className="space-y-12 md:space-y-20">
      {/* Hero Section - Refactored */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-20 pb-32 md:pt-24 md:pb-40 overflow-hidden">
         {/* Background Gradient (Tetap) */}
         <div aria-hidden="true" className="absolute inset-0 -z-10">
             <div className="h-full bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50"></div>
         </div>

         {/* Content Wrapper - Two Columns on Large Screens */}
         <div className="container mx-auto lg:flex lg:items-start lg:gap-12">

            {/* Kolom Visual - Responsive Image */}
            <motion.div 
                className="lg:w-1/2 lg:order-last mb-10 lg:mb-0" 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.6, delay: 0.4 }}
            >
                {/* Hapus aspect ratio container, batasi max-height jika perlu, sesuaikan img */}
                <div className="rounded-2xl shadow-lg overflow-hidden max-h-[500px]">
                   {/* Gunakan h-auto agar proporsional, object-cover agar mengisi & dipotong jika perlu */}
                   <img src={heroImageUrl} alt="Ilustrasi Donasi" className="w-full h-auto object-cover" />
                </div>
            </motion.div>

            {/* Kolom Teks & CTA - Kiri di LG */}
            <div className="lg:w-1/2 text-center lg:text-left">
                <motion.h1 
                    className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-800 mb-5"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                  Donasi Barang Bekas, Berbagi Berkat
                </motion.h1>
                <motion.p 
                    className="text-lg md:text-xl text-gray-600 mb-10 max-w-xl mx-auto lg:mx-0"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Platform mudah untuk menyalurkan barang layak pakai Anda kepada mereka yang lebih membutuhkan. Ciptakan dampak positif dari barang yang sudah tidak terpakai.
                </motion.p>
                <motion.div 
                    className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Link to="/donate">
                        <Button variant="primary" className="px-7 py-3 text-base font-semibold w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow flex items-center justify-center gap-2">
                          <GiftIcon className="h-5 w-5"/>
                          Mulai Donasi Sekarang
                        </Button>
                    </Link>
                    <Link to="/browse">
                        <Button variant="outline" className="px-7 py-3 text-base font-semibold w-full sm:w-auto bg-white border-gray-300 text-gray-700 hover:bg-emerald-50 hover:border-emerald-100 flex items-center justify-center gap-2">
                          Lihat Barang Donasi
                          <ArrowRightIcon className="h-5 w-5"/>
                        </Button>
                    </Link>
                </motion.div>

                {/* Value Proposition Section - Improved Cards */}
                <motion.div 
                    className="mt-10 pt-8 border-t border-gray-200/60 grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6" // Use grid layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.6, staggerChildren: 0.1 }} // Stagger children animation
                >
                    {/* Card 1 */} 
                    <motion.div
                        className="p-4 rounded-lg bg-white/60 backdrop-blur-sm text-center transition-shadow hover:shadow-lg"
                        whileHover={{ scale: 1.05, y: -5 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <ClockIcon className="h-7 w-7 text-emerald-500 mx-auto mb-3" />
                        <span className="text-sm font-medium text-gray-700 block ">Proses Cepat & Mudah</span>
                    </motion.div>
                    {/* Card 2 */} 
                    <motion.div
                        className="p-4 rounded-lg bg-white/60 backdrop-blur-sm text-center transition-shadow hover:shadow-lg"
                         whileHover={{ scale: 1.05, y: -5 }}
                         transition={{ type: 'spring', stiffness: 300 }}
                     >
                        <HeartIcon className="h-7 w-7 text-emerald-500 mx-auto mb-3" />
                        <span className="text-sm font-medium text-gray-700 block">Dampak Langsung Terasa</span>
                    </motion.div>
                    {/* Card 3 */} 
                    <motion.div
                        className="p-4 rounded-lg bg-white/60 backdrop-blur-sm text-center transition-shadow hover:shadow-lg"
                         whileHover={{ scale: 1.05, y: -5 }}
                         transition={{ type: 'spring', stiffness: 300 }}
                     >
                        <SparklesIcon className="h-7 w-7 text-emerald-500 mx-auto mb-3" />
                        <span className="text-sm font-medium text-gray-700 block">Beri Kehidupan Kedua</span>
                    </motion.div>
                </motion.div>

            </div>
         </div>

         {/* Scroll Down Indicator Wrapper */}
         <AnimatePresence>
            {showScrollIndicator && (
              <motion.div 
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-emerald-600 opacity-80 cursor-pointer z-10" // Tambah z-index jika perlu
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, y: [0, 10, 0] }} 
                  exit={{ opacity: 0, transition: { duration: 0.3 } }} // <-- Animasi keluar
                  transition={{ 
                      opacity: { delay: 1.5, duration: 0.5 }, 
                      y: { duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 } 
                  }}
                  onClick={() => {
                      // Hanya sembunyikan saat klik, scroll akan menampilkannya lagi jika perlu
                      setShowScrollIndicator(false); 
                      window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'smooth' }); 
                  }}
              >
                  <span className="text-xs mb-1">Scroll ke bawah</span>
                  <ChevronDownIcon className="h-6 w-6"/>
              </motion.div>
            )}
          </AnimatePresence>

      </section>

      {/* Recent Donations Section - Improved */}
      <section>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Judul Section */}
            <motion.h2 
                className="text-4xl md:text-5xl font-bold text-emerald-600 mb-12 md:mb-16 text-center" // Ukuran lebih besar, warna, margin bawah
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5 }}
            >
                Kebaikan Terbaru yang Dibagikan
            </motion.h2>

            {/* Loading State with Placeholders */}
            {loadingDonations && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                    <PlaceholderDonationCard />
                    <PlaceholderDonationCard />
                    <PlaceholderDonationCard />
                </div>
            )}

            {/* Error State */}
            {errorDonations && (
                <div className="text-center py-10 text-red-600">
                    <p>Oops! Terjadi kesalahan:</p> 
                    <p className="text-sm">{errorDonations}</p> 
                </div>
            )}

            {/* Grid Donasi dengan Animasi */}
            {!loadingDonations && !errorDonations && recentDonations.length > 0 && (
                <motion.div 
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ staggerChildren: 0.1 }}
                >
                    {recentDonations.map((donation) => (
                        <motion.div
                            key={donation.id}
                            variants={{ // Variasi animasi untuk anak
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 }
                            }}
                            whileHover={{ y: -5, scale: 1.02 }} // Efek hover
                            transition={{ type: 'spring', stiffness: 300 }}
                        >
                            <DonationCard
                                className="h-full transition-shadow duration-200 hover:shadow-lg border border-gray-200 hover:border-gray-300 rounded-lg overflow-hidden" // Added explicit styling here
                                id={donation.id}
                                title={donation.judul}
                                category={donation.kategori?.nama || 'Lainnya'}
                                description={donation.deskripsi}
                                imageUrl={donation.url_gambar?.[0] || null}
                                postedAt={donation.created_at}
                                location={donation.lokasi_kecamatan}
                                condition={donation.kondisi}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Empty State dengan Ikon */}
            {!loadingDonations && !errorDonations && recentDonations.length === 0 && (
                 <div className="text-center text-gray-500 py-16">
                    <InboxIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Belum ada donasi terbaru saat ini.</p>
                    <p className="text-sm">Jadilah yang pertama berbagi kebaikan!</p>
                 </div>
            )}

            {/* Tombol Lihat Semua */}
            {!loadingDonations && recentDonations.length > 0 && ( 
                 <motion.div 
                    className="text-center mt-12 md:mt-16"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5, delay: 0.5 }} // Muncul setelah card
                 >
                    <Link to="/browse">
                         <Button variant="outline" className="inline-flex items-center gap-2 px-6 py-3">
                            Lihat Semua Donasi
                            <ArrowRightIcon className="h-5 w-5"/>
                         </Button>
                     </Link>
                 </motion.div>
            )}
        </div>
      </section>

      {/* === Recent Wishlist Section - BARU === */}
      <section>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Judul Section */}
            <motion.h2
                className="text-4xl md:text-5xl font-bold text-emerald-600 mb-12 md:mb-16 text-center" // Warna beda (biru langit)
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5 }}
            >
                Komunitas Sedang Mencari
            </motion.h2>

            {/* Loading State Wishlist */}
            {loadingWishlist && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                    <PlaceholderWishlistCard />
                    <PlaceholderWishlistCard />
                    <PlaceholderWishlistCard />
                </div>
            )}

            {/* Error State Wishlist */}
            {errorWishlist && (
                <div className="text-center py-10 text-red-600">
                    <p>Oops! Terjadi kesalahan:</p>
                    <p className="text-sm">{errorWishlist}</p>
                </div>
            )}

            {/* Grid Wishlist */}
            {!loadingWishlist && !errorWishlist && recentWishlist.length > 0 && (
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ staggerChildren: 0.1 }}
                >
                    {recentWishlist.map((item) => (
                        <motion.div
                            key={item.id}
                            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                            whileHover={{ y: -5, scale: 1.02 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                        >
                            <WishlistCard item={item} />
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Empty State Wishlist */}
            {!loadingWishlist && !errorWishlist && recentWishlist.length === 0 && (
                <div className="text-center text-gray-500 py-16">
                    <InboxIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Tidak ada permintaan barang terbaru saat ini.</p>
                </div>
            )}

            {/* Tombol Lihat Semua Wishlist */}
            {!loadingWishlist && recentWishlist.length > 0 && (
                 <motion.div
                    className="text-center mt-12 md:mt-16"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5, delay: 0.2 }} // Sedikit delay
                 >
                    <Link to="/wishlist/browse">
                         <Button variant="outline" className="inline-flex items-center gap-2 px-6 py-3 border-emerald-500 text-emerald-600 hover:bg-emerald-50">
                            Lihat Semua Permintaan
                            <ArrowRightIcon className="h-5 w-5"/>
                         </Button>
                     </Link>
                 </motion.div>
            )}
        </div>
      </section>
      {/* === End Recent Wishlist Section === */}

      {/* Section Cara Kerja - Flow Visualization & CTA */}
      <section className="bg-white py-16 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto text-center">
              {/* Judul Section (Tetap Sama) */}
              <motion.h2 
                  className="text-4xl md:text-5xl font-bold text-emerald-600 mb-12 md:mb-16 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5 }}
              >
                  Bagaimana Cara Kerjanya?
              </motion.h2>
              {/* Grid Langkah */}
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 relative"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                transition={{ staggerChildren: 0.15 }}
              >
                  {/* Langkah 1: Daftarkan Barang */}
                  <motion.div 
                    className="p-6 bg-white rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative"
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                  >
                      <DocumentPlusIcon className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">
                        Daftarkan Barang
                      </h3>
                      <p className="text-gray-600">Buat postingan detail barang yang ingin Anda donasikan beserta foto.</p>
                      <ArrowLongRightIcon className="hidden md:block absolute top-1/2 -translate-y-1/2 -right-7 h-8 w-8 text-gray-300" />
                  </motion.div>
                  
                  {/* Langkah 2: Diskusi & Koordinasi */}
                   <motion.div 
                    className="p-6 bg-white rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative"
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                   >
                      <ChatBubbleLeftRightIcon className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">
                        Diskusi & Koordinasi
                      </h3>
                      <p className="text-gray-600">Tangapi permintaan dan atur jadwal atau lokasi pengambilan dengan calon penerima.</p>
                      <ArrowLongRightIcon className="hidden md:block absolute top-1/2 -translate-y-1/2 -right-7 h-8 w-8 text-gray-300" />
                  </motion.div>
                  
                  {/* Langkah 3: Serah Terima */} 
                   <motion.div 
                    className="p-6 bg-white rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                   >
                      <CheckCircleIcon className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">
                        Serah Terima
                      </h3>
                      <p className="text-gray-600">Lakukan serah terima barang sesuai kesepakatan yang telah dibuat.</p>
                  </motion.div>
              </motion.div>

              {/* Tombol CTA */}
              <motion.div 
                className="mt-16 text-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                  <Link to="/donate">
                      <Button variant="primary" className="px-8 py-3 text-lg font-semibold inline-flex items-center gap-2 shadow hover:shadow-md">
                          <GiftIcon className="h-5 w-5"/>
                          Mulai Donasi Sekarang
                      </Button>
                  </Link>
                  <p className="mt-4 text-sm">
                      <Link to="/faq" className="text-gray-500 hover:text-emerald-600 hover:underline transition-colors duration-150">
                          Punya pertanyaan? Lihat FAQ
                      </Link>
                  </p>
              </motion.div>

          </div>
      </section>

    </div>
  );
}

export default HomePage; 