import { useState, useEffect, useCallback, Fragment } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import DonationCard from '../components/ui/DonationCard';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, FunnelIcon, ArrowsUpDownIcon, InboxIcon, XMarkIcon, AdjustmentsHorizontalIcon, ViewColumnsIcon, Bars3Icon, MapPinIcon, CalendarDaysIcon, TagIcon, CheckBadgeIcon, GiftIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import Button from '../components/ui/Button';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// --- useDebounce Hook ---
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}
// --- End useDebounce Hook ---

// Komponen Placeholder Card (mirip HomePage)
function PlaceholderDonationCard() {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white animate-pulse">
      <div className="w-full aspect-video bg-gray-300"></div>
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
            <div className="h-3 bg-gray-300 rounded w-1/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/3"></div>
        </div>
        <div className="h-5 bg-gray-300 rounded w-3/4"></div> {/* Title */}
        <div className="space-y-1.5">
            <div className="h-3 bg-gray-300 rounded w-full"></div>
            <div className="h-3 bg-gray-300 rounded w-5/6"></div>
        </div>
         <div className="h-3 bg-gray-300 rounded w-1/2 pt-2 mt-2 border-t"></div> {/* Condition */}
      </div>
    </div>
  );
}

// Placeholder untuk List Item - Always Row
function PlaceholderDonationListItem() {
  return (
    <div className="flex flex-row gap-3 p-3 border border-gray-100 rounded-lg bg-white animate-pulse"> {/* Always row, smaller gap/padding */}
      <div className="w-24 h-24 bg-gray-300 rounded flex-shrink-0"></div> {/* Smaller image placeholder */}
      <div className="flex-grow flex flex-col space-y-1.5"> {/* Adjusted spacing */}
        <div className="h-4 bg-gray-300 rounded w-5/6"></div> {/* Title Placeholder */}
        {/* Placeholder for Meta Info Icons + Text (Simpler for smaller space) */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 bg-gray-300 rounded-sm"></div> {/* Icon Placeholder */}
            <div className="h-2.5 bg-gray-300 rounded w-12"></div> {/* Text Placeholder */}
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 bg-gray-300 rounded-sm"></div>
            <div className="h-2.5 bg-gray-300 rounded w-16"></div>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 bg-gray-300 rounded-sm"></div>
            <div className="h-2.5 bg-gray-300 rounded w-12"></div>
          </div>
        </div>
        {/* Placeholder for Description (Shorter) */}
        <div className="space-y-1 pt-0.5">
            <div className="h-2.5 bg-gray-300 rounded w-full"></div>
            <div className="h-2.5 bg-gray-300 rounded w-10/12"></div>
        </div>
        {/* Placeholder for Button (Smaller)*/}
        <div className="h-6 bg-gray-300 rounded w-20 ml-auto mt-auto"></div>
      </div>
    </div>
  );
}

// Komponen Pagination - Enhanced
function PaginationControls({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const pageNumbers = [];
  const maxPagesToShow = 3; // Tampilkan N nomor di sekitar halaman aktif
  const ellipsis = '...';

  // Logic untuk page numbers dengan ellipsis
  if (totalPages <= maxPagesToShow + 2) { // Jika total halaman sedikit, tampilkan semua
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    pageNumbers.push(1); // Selalu tampilkan halaman 1
    let start = Math.max(2, currentPage - Math.floor((maxPagesToShow - 1) / 2));
    let end = Math.min(totalPages - 1, currentPage + Math.floor(maxPagesToShow / 2));

    if (currentPage <= maxPagesToShow - 1) {
        end = maxPagesToShow;
    }
    if (currentPage >= totalPages - (maxPagesToShow - 2)) {
        start = totalPages - maxPagesToShow + 1;
    }

    if (start > 2) pageNumbers.push(ellipsis); // Ellipsis setelah halaman 1

    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }

    if (end < totalPages - 1) pageNumbers.push(ellipsis); // Ellipsis sebelum halaman terakhir

    pageNumbers.push(totalPages); // Selalu tampilkan halaman terakhir
  }

  return (
    <div className="mt-8 flex justify-center items-center gap-1 sm:gap-2 flex-wrap">
      {/* Tombol First */}
      <Button size="sm" variant="outline" onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="border-gray-300 text-gray-600 px-2">&laquo;&laquo;</Button>
      {/* Tombol Prev */}
      <Button size="sm" variant="outline" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="border-gray-300 text-gray-600 px-2">&laquo;</Button>
      
      {pageNumbers.map((num, index) => (
        num === ellipsis ? (
          <span key={`${num}-${index}`} className="text-gray-500 px-1 sm:px-2">...</span>
        ) : (
          <Button
            key={num}
            size="sm"
            variant={currentPage === num ? 'primary' : 'outline'}
            onClick={() => handlePageChange(num)}
            className={`min-w-[32px] px-2 ${currentPage === num ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 text-gray-600'}`}
          >
            {num}
          </Button>
        )
      ))}
      
      {/* Tombol Next */}
      <Button size="sm" variant="outline" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="border-gray-300 text-gray-600 px-2">&raquo;</Button>
      {/* Tombol Last */}
      <Button size="sm" variant="outline" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className="border-gray-300 text-gray-600 px-2">&raquo;&raquo;</Button>
    </div>
  );
}

// Komponen List Item - Always Row Layout
function DonationListItem({ donation }) {
  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch { return null; }
  };
  const formattedDate = formatDate(donation.postedAt);

  return (
    <li className="flex flex-row gap-3 p-3 border border-gray-200 rounded-lg bg-white hover:shadow-lg hover:border-gray-300 hover:bg-emerald-50/50 transition-all duration-200"> {/* Always row, smaller gap/padding */}
      {/* Image Wrapper: Smaller fixed size for all screens */}
      <Link to={`/donations/${donation.id}`} className="block w-24 h-24 flex-shrink-0 overflow-hidden rounded group">
        <img 
          src={donation.imageUrl || 'https://via.placeholder.com/150/f0fdf4/cccccc?text=No+Image'} 
          alt={donation.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </Link>
      {/* Text Content Wrapper */}
      <div className="flex-grow flex flex-col">
        {/* Title - Smaller text might be needed on very small screens */}
        <Link to={`/donations/${donation.id}`} className="hover:text-emerald-600 mb-1"> 
          <h3 className="text-base font-semibold text-gray-800 line-clamp-2 group-hover:text-emerald-600">{donation.title}</h3> {/* Reduced font size */}
        </Link>
        {/* Meta Info - Reduced gap */}
        <div className="text-xs text-gray-500 mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5"> {/* Reduced gap/margin */}
           {/* Meta Spans (keep icons h-4 w-4, text size xs) */}
           <span className="inline-flex items-center gap-1">
               <TagIcon className="h-4 w-4 text-emerald-500"/>
               <span className="font-medium text-emerald-600 capitalize truncate max-w-[80px] sm:max-w-none">{donation.category || 'Lainnya'}</span> {/* Truncate on small screens */}
           </span>
           {donation.location && 
            <span className="inline-flex items-center gap-1 truncate max-w-[80px] sm:max-w-none">
                <MapPinIcon className="h-4 w-4"/> 
                {donation.location}
            </span>}
           {formattedDate && 
             <span className="inline-flex items-center gap-1">
                <CalendarDaysIcon className="h-4 w-4"/> 
                {formattedDate}
             </span>}
            {donation.condition && 
              <span className="inline-flex items-center gap-1 text-blue-600 font-medium truncate max-w-[80px] sm:max-w-none">
                  <CheckBadgeIcon className="h-4 w-4"/>
                  {donation.condition}
              </span>}
        </div>
        {/* Description - Reduced line clamp */}
        <p className="text-sm text-gray-600 line-clamp-2 flex-grow mb-2">{donation.description}</p> {/* Reduced line clamp and margin */}
        {/* Button */}
        <div className="mt-auto text-right">
             <Link to={`/donations/${donation.id}`} >
                 <Button variant="outline" size="sm" className="border-emerald-500 text-emerald-600 hover:bg-emerald-50">Lihat Detail</Button>
             </Link>
        </div>
      </div>
    </li>
  );
}

function BrowseDonationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || '');
  const [selectedLocation, setSelectedLocation] = useState(() => searchParams.get('location') || '');
  const [selectedCondition, setSelectedCondition] = useState(() => searchParams.get('condition') || '');
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'created_at,desc');
  const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get('page') || '1', 10));
  const [viewMode, setViewMode] = useState(() => searchParams.get('view') || 'grid');

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errorCategories, setErrorCategories] = useState(null);

  const [itemsPerPage] = useState(12);
  const [totalItems, setTotalItems] = useState(0);

  const conditions = ["Baru", "Layak Pakai", "Perlu Perbaikan Kecil", "Rusak (untuk suku cadang)"];

  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // --- NProgress Effect ---
  useEffect(() => {
    if (loading || loadingCategories) {
      NProgress.start();
    } else {
      NProgress.done();
    }
    // Cleanup function to ensure NProgress stops if the component unmounts while loading
    return () => {
      NProgress.done();
    };
  }, [loading, loadingCategories]);
  // --- End NProgress Effect ---

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      setErrorCategories(null);
      try {
        const { data, error } = await supabase
          .from('kategori')
          .select('id, nama')
          .order('nama', { ascending: true });
        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setErrorCategories("Gagal memuat kategori.");
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const buildQueryFilters = useCallback((queryBuilder) => {
    let query = queryBuilder;
    if (debouncedSearchQuery) {
      query = query.ilike('judul', `%${debouncedSearchQuery}%`);
    }
    if (selectedCategory) {
      query = query.eq('id_kategori', selectedCategory);
    }
    if (selectedLocation) {
      query = query.ilike('lokasi_kecamatan', `%${selectedLocation}%`);
    }
    if (selectedCondition) {
      query = query.eq('kondisi', selectedCondition);
    }
    return query;
  }, [debouncedSearchQuery, selectedCategory, selectedLocation, selectedCondition]);

  const fetchTotalCount = useCallback(async () => {
    try {
      let countQuery = supabase.from('donasi').select('* ', { count: 'exact', head: true }).eq('status', 'tersedia');
      countQuery = buildQueryFilters(countQuery);
      const { count, error: countError } = await countQuery;
      if (countError) throw countError;
      setTotalItems(count || 0);
    } catch (err) {
      console.error("Error fetching total count:", err);
      setTotalItems(0);
    }
  }, [buildQueryFilters]);

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('donasi')
        .select(`id, judul, deskripsi, kondisi, url_gambar, created_at, status, lokasi_kecamatan, kategori ( id, nama )`)
        .eq('status', 'tersedia');

      query = buildQueryFilters(query);

      const [sortColumn, sortDirection] = sortBy.split(',');
      if (sortColumn && sortDirection) {
        query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
      }

      query = query.range(from, to);

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setDonations(data || []);

    } catch (err) {
      console.error("Error fetching filtered/paginated donations:", err);
      setError("Gagal memuat data donasi. Silakan coba lagi nanti.");
      setDonations([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, sortBy, buildQueryFilters]);

  useEffect(() => {
    fetchTotalCount();
    fetchDonations();
  }, [fetchDonations, fetchTotalCount]);

  useEffect(() => {
    const params = {};
    if (searchQuery) params.q = searchQuery;
    if (selectedCategory) params.category = selectedCategory;
    if (selectedLocation) params.location = selectedLocation;
    if (selectedCondition) params.condition = selectedCondition;
    if (sortBy !== 'created_at,desc') params.sort = sortBy;
    if (currentPage > 1) params.page = currentPage;
    if (viewMode !== 'grid') params.view = viewMode;
    setSearchParams(params, { replace: true });
  }, [searchQuery, selectedCategory, selectedLocation, selectedCondition, sortBy, currentPage, viewMode, setSearchParams]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLocation('');
    setSelectedCondition('');
    setSortBy('created_at,desc');
    setCurrentPage(1);
    setViewMode('grid');
    setSearchParams({}, { replace: true });
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const isFilterActive = selectedCategory || selectedLocation || selectedCondition || searchQuery;

  // Refined motion variants
  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.4, 0.0, 0.2, 1] } // Example ease: easeOutQuint
    }
  };

  const containerVariants = {
    visible: { transition: { staggerChildren: 0.07 } } // Slightly adjusted stagger
  };

  const renderContent = () => {
    if (loading) {
      const placeholders = [...Array(itemsPerPage)].map((_, i) => 
        viewMode === 'grid' ? <PlaceholderDonationCard key={i} /> : <PlaceholderDonationListItem key={i} />
      );
      return (
        <div className="text-center py-10">
          <p className="text-lg text-gray-600 mb-6">Memuat donasi...</p>
          {viewMode === 'grid' ? 
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">{placeholders}</div> : 
            <ul className="space-y-4">{placeholders}</ul>
          }
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-600 py-16 col-span-full">
             <InboxIcon className="h-12 w-12 mx-auto mb-4 text-red-400" />
             <p className="text-lg font-medium">Oops! Terjadi Kesalahan</p>
             <p className="text-sm">{error}</p>
        </div>
      );
    }

    if (donations.length === 0) {
      const isAnyFilterActive = debouncedSearchQuery || selectedCategory || selectedLocation || selectedCondition;
      const message = isAnyFilterActive
        ? "Tidak ada donasi yang cocok dengan pencarian/filter Anda."
        : "Belum ada donasi yang tersedia saat ini.";
      return (
        <div className="text-center text-gray-500 py-16 col-span-full">
          <InboxIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>{message}</p>
          {isAnyFilterActive && (
            <Button variant="outline" onClick={handleResetFilters} className="mt-4">Reset Filter</Button>
          )}
        </div>
      );
    }

    if (viewMode === 'grid') {
      return (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {donations.map((donation) => (
            <motion.div
              key={donation.id}
              variants={itemVariants} 
              className="h-full group rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 transition-all duration-200"
            >
              <DonationCard
                className="h-full"
                id={donation.id}
                title={donation.judul}
                description={donation.deskripsi || ''}
                category={donation.kategori?.nama || 'Lainnya'}
                imageUrl={donation.url_gambar?.[0] || null}
                condition={donation.kondisi}
                postedAt={donation.created_at}
                location={donation.lokasi_kecamatan}
              />
            </motion.div>
          ))}
        </motion.div>
      );
    } else {
      return (
        <motion.ul 
          className="space-y-4"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {donations.map((donation) => (
            <motion.div 
              key={donation.id} 
              variants={itemVariants}
            >
              <DonationListItem donation={{ 
                id: donation.id, title: donation.judul, description: donation.deskripsi, 
                category: donation.kategori?.nama, imageUrl: donation.url_gambar?.[0], 
                condition: donation.kondisi, postedAt: donation.created_at, location: donation.lokasi_kecamatan 
              }} />
             </motion.div>
          ))}
        </motion.ul>
      );
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 bg-gradient-to-b from-emerald-50/50 via-white to-white min-h-screen">
      {/* Section Judul dengan Ikon Background */}
      <div className="relative text-center mb-10"> {/* Wrapper untuk positioning relatif */}
         <GiftIcon className="absolute inset-x-0 top-0 mx-auto -translate-y-1/4 h-64 w-64 text-emerald-100 opacity-30 -z-10" /> {/* Ikon Background */}
         <motion.h1 
            className="text-3xl md:text-4xl font-bold text-emerald-600 mb-4 relative z-10" // Pastikan z-index > ikon
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Temukan Barang Donasi
          </motion.h1>
          <motion.p 
            className="text-lg text-gray-600 max-w-2xl mx-auto relative z-10" // Pastikan z-index > ikon
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }} 
          >
            Jelajahi berbagai barang yang didonasikan oleh komunitas untuk membantu sesama.
          </motion.p>
      </div>
      
      <motion.div 
        className="mb-8 space-y-4" // Filter/Sort Section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="relative">
          <label htmlFor="search" className="sr-only">Cari Judul</label>
          <input
            type="text"
            id="search"
            placeholder="Cari berdasarkan judul donasi..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className={`w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${searchQuery ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'}`}
          />
          <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
        </div>

        <div>
          <div className="lg:hidden mb-4">
            <Button 
              variant={isFilterActive ? 'primary' : 'outline'}
              onClick={() => setIsFilterModalOpen(true)}
              className={`w-full flex items-center justify-center gap-2 py-2.5 ${isFilterActive ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5"/>
              Filter & Sortir {isFilterActive && <span className="h-2 w-2 bg-emerald-500 rounded-full"></span>}
            </Button>
          </div>

          <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="col-span-1">
              <label htmlFor="category-desktop" className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select 
                id="category-desktop"
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                disabled={loadingCategories}
                className={`w-full py-2 pl-3 pr-8 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white disabled:bg-gray-100 ${selectedCategory ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'}`}
              >
                <option value="" disabled={loadingCategories}>
                  {loadingCategories ? '(Memuat...)' : 'Semua Kategori'}
                </option>
                {!loadingCategories && categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nama}</option>
                ))}
              </select>
            </div>
            <div className="col-span-1">
              <label htmlFor="location-desktop" className="block text-sm font-medium text-gray-700 mb-1">Lokasi (Kecamatan)</label>
              <input
                type="text"
                id="location-desktop"
                placeholder="Contoh: Menteng"
                value={selectedLocation}
                onChange={(e) => { setSelectedLocation(e.target.value); setCurrentPage(1); }}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${selectedLocation ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'}`}
              />
            </div>
            <div className="col-span-1">
              <label htmlFor="condition-desktop" className="block text-sm font-medium text-gray-700 mb-1">Kondisi</label>
              <select
                id="condition-desktop"
                value={selectedCondition}
                onChange={(e) => { setSelectedCondition(e.target.value); setCurrentPage(1); }}
                className={`w-full py-2 pl-3 pr-8 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white ${selectedCondition ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'}`}
              >
                <option value="">Semua Kondisi</option>
                {conditions.map(cond => <option key={cond} value={cond}>{cond}</option>)}
              </select>
            </div>
            <div className="col-span-1">
              <label htmlFor="sort-desktop" className="block text-sm font-medium text-gray-700 mb-1">Urutkan</label>
              <select 
                id="sort-desktop"
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="w-full py-2 pl-3 pr-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                <option value="created_at,desc">Terbaru</option>
                <option value="created_at,asc">Terlama</option>
                <option value="judul,asc">Judul A-Z</option>
                <option value="judul,desc">Judul Z-A</option>
              </select>
            </div>
            <div className="col-span-1">
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="w-full py-2 border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={!searchQuery && !selectedCategory && !selectedLocation && !selectedCondition}
              >
                <XMarkIcon className="h-5 w-5 mr-1"/> Reset
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2">
          <div className="text-sm text-gray-700 font-medium bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200 order-last sm:order-first">
            {totalItems > 0 ? 
                `Menampilkan ${Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - ${Math.min(currentPage * itemsPerPage, totalItems)} dari ${totalItems} donasi ditemukan` : 
                !loading ? 'Tidak ada donasi ditemukan' : ''
            }
          </div>
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-md order-first sm:order-last">
            <button 
              onClick={() => setViewMode('grid')} 
              title="Tampilan Grid"
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'} transition-all`}
            >
              <ViewColumnsIcon className="h-5 w-5"/>
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              title="Tampilan List"
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'} transition-all`}
            >
              <Bars3Icon className="h-5 w-5"/>
            </button>
          </div>
        </div>
      </motion.div>

      <hr className="my-8 border-gray-100" /> {/* Garis lebih halus */}

      {renderContent()}

      <PaginationControls 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={(page) => setCurrentPage(page)} 
      />

      <Transition appear show={isFilterModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-30 lg:hidden" onClose={() => setIsFilterModalOpen(false)}>
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 mb-4 flex justify-between items-center"
                  >
                    Filter & Sortir
                    <button onClick={() => setIsFilterModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
                       <XMarkIcon className="h-5 w-5"/>
                    </button>
                  </Dialog.Title>
                  
                  <div className="space-y-4 mt-2">
                    <div>
                      <label htmlFor="category-mobile" className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                      <select 
                        id="category-mobile" 
                        value={selectedCategory} 
                        onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }} 
                        disabled={loadingCategories}
                        className={`w-full py-2 pl-3 pr-8 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed ${selectedCategory ? 'border-emerald-500' : 'border-gray-300'}`} 
                      >
                          <option value="" disabled={loadingCategories}>
                            {loadingCategories ? '(Memuat Kategori...)' : 'Semua Kategori'}
                          </option>
                          {!loadingCategories && categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.nama}</option>)} 
                      </select>
                      {errorCategories && <p className="text-xs text-red-500 mt-1">{errorCategories}</p>}
                    </div>
                    <div>
                      <label htmlFor="location-mobile" className="block text-sm font-medium text-gray-700 mb-1">Lokasi (Kecamatan)</label>
                      <input type="text" id="location-mobile" value={selectedLocation} onChange={(e) => { setSelectedLocation(e.target.value); setCurrentPage(1); }}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${selectedLocation ? 'border-emerald-500' : 'border-gray-300'}`}
                      />
                    </div>
                    <div>
                      <label htmlFor="condition-mobile" className="block text-sm font-medium text-gray-700 mb-1">Kondisi</label>
                      <select id="condition-mobile" value={selectedCondition} onChange={(e) => { setSelectedCondition(e.target.value); setCurrentPage(1); }}
                        className={`w-full py-2 pl-3 pr-8 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white ${selectedCondition ? 'border-emerald-500' : 'border-gray-300'}`}
                      >
                        <option value="">Semua Kondisi</option>
                        {conditions.map(cond => <option key={cond} value={cond}>{cond}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="sort-mobile" className="block text-sm font-medium text-gray-700 mb-1">Urutkan</label>
                      <select id="sort-mobile" value={sortBy} onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                        className={`w-full py-2 pl-3 pr-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white`}
                      >
                        <option value="created_at,desc">Terbaru</option>
                        <option value="created_at,asc">Terlama</option>
                        <option value="judul,asc">Judul A-Z</option>
                        <option value="judul,desc">Judul Z-A</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {handleResetFilters(); setIsFilterModalOpen(false);}}
                      className="flex flex-1 items-center justify-center border-gray-300 text-gray-600 hover:bg-gray-100 py-2.5"
                      disabled={!isFilterActive}
                    >
                      <XMarkIcon className="h-5 w-5 mr-1"/> Reset
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={() => setIsFilterModalOpen(false)} 
                      className="flex-1 bg-emerald-500 py-2.5"
                    >
                      Terapkan
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

    </div>
  );
}

export default BrowseDonationsPage; 