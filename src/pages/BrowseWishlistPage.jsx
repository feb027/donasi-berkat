import { useState, useEffect, useCallback, Fragment } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, FunnelIcon, ArrowsUpDownIcon, InboxIcon, XMarkIcon, AdjustmentsHorizontalIcon, TagIcon, MapPinIcon, CalendarDaysIcon, ListBulletIcon, UserCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import Button from '../components/ui/Button';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { formatDistanceToNow } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

// --- useDebounce Hook (reuse if not globally available) ---
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

// --- Pagination Controls Component (reuse if not globally available) ---
function PaginationControls({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const pageNumbers = [];
  const maxPagesToShow = 3;
  const ellipsis = '...';

  if (totalPages <= maxPagesToShow + 2) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    pageNumbers.push(1);
    let start = Math.max(2, currentPage - Math.floor((maxPagesToShow - 1) / 2));
    let end = Math.min(totalPages - 1, currentPage + Math.floor(maxPagesToShow / 2));

    if (currentPage <= maxPagesToShow - 1) {
      end = maxPagesToShow;
    }
    if (currentPage >= totalPages - (maxPagesToShow - 2)) {
      start = totalPages - maxPagesToShow + 1;
    }

    if (start > 2) pageNumbers.push(ellipsis);

    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }

    if (end < totalPages - 1) pageNumbers.push(ellipsis);

    pageNumbers.push(totalPages);
  }

  return (
    <div className="mt-8 flex justify-center items-center gap-1 sm:gap-2 flex-wrap">
      <Button size="sm" variant="outline" onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="border-gray-300 text-gray-600 px-2">&laquo;&laquo;</Button>
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

      <Button size="sm" variant="outline" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="border-gray-300 text-gray-600 px-2">&raquo;</Button>
      <Button size="sm" variant="outline" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className="border-gray-300 text-gray-600 px-2">&raquo;&raquo;</Button>
    </div>
  );
}
// --- End Pagination Controls ---

// --- Wishlist Item Components ---
function PlaceholderWishlistItem() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-100 rounded-lg bg-white animate-pulse w-full">
      {/* Avatar Placeholder */}
      <div className="w-12 h-12 bg-gray-300 rounded-full flex-shrink-0 mx-auto sm:mx-0"></div>
      {/* Content Placeholder */}
      <div className="flex-grow flex flex-col space-y-2">
        {/* Title Placeholder */}
        <div className="h-5 bg-gray-300 rounded w-3/4"></div>
        {/* Meta Info Placeholder */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 bg-gray-300 rounded-sm"></div> {/* Icon */}
            <div className="h-3 bg-gray-300 rounded w-20"></div> {/* Text */}
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 bg-gray-300 rounded-sm"></div> {/* Icon */}
            <div className="h-3 bg-gray-300 rounded w-16"></div> {/* Text */}
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 bg-gray-300 rounded-sm"></div> {/* Icon */}
            <div className="h-3 bg-gray-300 rounded w-12"></div> {/* Text */}
          </div>
        </div>
        {/* Description Placeholder */}
        <div className="space-y-1.5 pt-1">
          <div className="h-3 bg-gray-300 rounded w-full"></div>
          <div className="h-3 bg-gray-300 rounded w-11/12"></div>
        </div>
        {/* Button Placeholder */}
        <div className="h-8 bg-gray-300 rounded w-24 ml-auto mt-2 self-end"></div>
      </div>
    </div>
  );
}

function WishlistItem({ item }) {
  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name[0]?.toUpperCase() || '?';
  };

  const timeAgo = item.created_at ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: localeID }) : '-';

  return (
    <li className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md hover:border-emerald-200 hover:bg-emerald-50/30 transition-all duration-200 w-full">
      {/* Avatar */}
      <div className="flex-shrink-0 mx-auto sm:mx-0">
        <Link to={`/profile/${item.profil.id}`} className="block h-12 w-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-lg font-semibold overflow-hidden ring-2 ring-white hover:ring-emerald-200 transition-all" title={item.profil?.nama_pengguna || 'User'}>
          {item.profil?.avatar_url ? (
            <img src={item.profil.avatar_url} alt="Avatar" className="rounded-full h-full w-full object-cover" />
          ) : (
            <span>{getInitials(item.profil?.nama_pengguna)}</span>
          )}
        </Link>
      </div>
      {/* Content */}
      <div className="flex-grow flex flex-col text-center sm:text-left">
        {/* Title */}
        <Link to={`/wishlist/${item.id}`} className="hover:text-emerald-600 mb-1 group">
          <h3 className="text-lg font-semibold text-gray-800 line-clamp-2 group-hover:text-emerald-700">{item.judul}</h3>
        </Link>
        {/* Meta Info */}
        <div className="text-xs text-gray-500 mb-2 flex flex-wrap justify-center sm:justify-start items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1 font-medium text-gray-600">
            <UserCircleIcon className="h-4 w-4 text-gray-400"/>
            Diminta oleh: <Link to={`/profile/${item.profil.id}`} className="text-emerald-600 hover:underline">{item.profil?.nama_pengguna || 'Anonim'}</Link>
          </span>
          <span className="hidden sm:inline text-gray-300">|</span>
          <span className="inline-flex items-center gap-1">
            <TagIcon className="h-4 w-4 text-emerald-500"/>
            <span className="font-medium text-emerald-600 capitalize">{item.kategori?.nama || 'Lainnya'}</span>
          </span>
          {item.lokasi_kecamatan && (
            <span className="inline-flex items-center gap-1">
              <MapPinIcon className="h-4 w-4"/>
              {item.lokasi_kecamatan}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <CalendarDaysIcon className="h-4 w-4"/>
            {timeAgo}
          </span>
        </div>
        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-3 flex-grow mb-3">{item.deskripsi || 'Tidak ada deskripsi tambahan.'}</p>
        {/* Button */}
        <div className="mt-auto text-center sm:text-right">
          <Link to={`/wishlist/${item.id}`}>
            <Button variant="outline" size="sm" className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 inline-flex items-center gap-1.5">
              Lihat Detail <ArrowRightIcon className="h-4 w-4"/>
            </Button>
          </Link>
        </div>
      </div>
    </li>
  );
}
// --- End Wishlist Item Components ---

function BrowseWishlistPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || '');
  const [selectedLocation, setSelectedLocation] = useState(() => searchParams.get('location') || '');
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'created_at,desc');
  const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get('page') || '1', 10));
  // Default ke list view untuk wishlist
  // const [viewMode, setViewMode] = useState(() => searchParams.get('view') || 'list');

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errorCategories, setErrorCategories] = useState(null);

  const [itemsPerPage] = useState(10); // Maybe fewer items per page for list view
  const [totalItems, setTotalItems] = useState(0);

  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // --- NProgress Effect ---
  useEffect(() => {
    if (loading || loadingCategories) {
      NProgress.start();
    } else {
      NProgress.done();
    }
    return () => { NProgress.done(); };
  }, [loading, loadingCategories]);
  // --- End NProgress Effect ---

  // --- Fetch Categories ---
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

  // --- Build Query Filters ---
  const buildQueryFilters = useCallback((queryBuilder) => {
    let query = queryBuilder;
    if (debouncedSearchQuery) {
      // Search title and description
      query = query.or(`judul.ilike.%${debouncedSearchQuery}%,deskripsi.ilike.%${debouncedSearchQuery}%`);
    }
    if (selectedCategory) {
      query = query.eq('id_kategori', selectedCategory);
    }
    if (selectedLocation) {
      query = query.ilike('lokasi_kecamatan', `%${selectedLocation}%`);
    }
    return query;
  }, [debouncedSearchQuery, selectedCategory, selectedLocation]);

  // --- Fetch Total Count ---
  const fetchTotalCount = useCallback(async () => {
    try {
      let countQuery = supabase
        .from('permintaan_barang')
        .select('* ', { count: 'exact', head: true })
        .eq('status', 'aktif'); // Only active requests
      countQuery = buildQueryFilters(countQuery);
      const { count, error: countError } = await countQuery;
      if (countError) throw countError;
      setTotalItems(count || 0);
    } catch (err) {
      console.error("Error fetching total wishlist count:", err);
      setTotalItems(0); // Reset on error
    }
  }, [buildQueryFilters]);

  // --- Fetch Wishlist Items ---
  const fetchWishlistItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('permintaan_barang')
        .select(`
          id, 
          judul, 
          deskripsi, 
          lokasi_kecamatan, 
          created_at, 
          status,
          kategori ( id, nama ),
          profil ( id, nama_pengguna, avatar_url )
        `)
        .eq('status', 'aktif'); // Only active requests

      query = buildQueryFilters(query);

      const [sortColumn, sortDirection] = sortBy.split(',');
      if (sortColumn && sortDirection) {
        // Handle potential join column sort (e.g., category name)? For now, stick to base table columns.
        if (['created_at', 'judul'].includes(sortColumn)) { 
          query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
        } else {
          // Default sort if column invalid for this table
          query = query.order('created_at', { ascending: false }); 
        }
      } else {
        query = query.order('created_at', { ascending: false }); // Default sort
      }

      query = query.range(from, to);

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      
      setWishlistItems(data || []);

    } catch (err) {
      console.error("Error fetching wishlist items:", err);
      setError("Gagal memuat data permintaan barang. Silakan coba lagi nanti.");
      setWishlistItems([]); // Clear data on error
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, sortBy, buildQueryFilters]);

  // --- Effects for fetching data and updating URL ---
  useEffect(() => {
    fetchTotalCount(); // Fetch count first (or parallel)
    fetchWishlistItems();
  }, [fetchWishlistItems, fetchTotalCount]); // Depend on the memoized fetch functions

  useEffect(() => {
    const params = {};
    if (searchQuery) params.q = searchQuery;
    if (selectedCategory) params.category = selectedCategory;
    if (selectedLocation) params.location = selectedLocation;
    if (sortBy !== 'created_at,desc') params.sort = sortBy;
    if (currentPage > 1) params.page = currentPage;
    // if (viewMode !== 'list') params.view = viewMode; // Remove view mode for now
    setSearchParams(params, { replace: true });
  }, [searchQuery, selectedCategory, selectedLocation, sortBy, currentPage, /*viewMode,*/ setSearchParams]);

  // --- Handlers ---
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLocation('');
    setSortBy('created_at,desc');
    setCurrentPage(1);
    // setViewMode('list'); // Reset view mode if re-enabled
    setSearchParams({}, { replace: true });
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const isFilterActive = selectedCategory || selectedLocation || searchQuery;

  // --- Motion Variants ---
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };
  const containerVariants = {
    visible: { transition: { staggerChildren: 0.1 } }
  };

  // --- Render Logic ---
  const renderContent = () => {
    if (loading) {
      const placeholders = [...Array(itemsPerPage)].map((_, i) => <PlaceholderWishlistItem key={i} />);
      return (
        <div className="text-center py-10">
          <p className="text-lg text-gray-600 mb-6">Memuat permintaan barang...</p>
          <ul className="space-y-4">{placeholders}</ul>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-600 py-16 col-span-full bg-red-50 p-6 rounded-lg border border-red-200">
          <InboxIcon className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <p className="text-lg font-medium">Oops! Terjadi Kesalahan</p>
          <p className="text-sm">{error}</p>
        </div>
      );
    }

    if (wishlistItems.length === 0) {
      const message = isFilterActive
        ? "Tidak ada permintaan barang yang cocok dengan pencarian/filter Anda."
        : "Belum ada permintaan barang yang dibuat saat ini.";
      return (
        <div className="text-center text-gray-500 py-16 col-span-full bg-gray-50 p-6 rounded-lg border border-gray-200">
          <InboxIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>{message}</p>
          {isFilterActive && (
            <Button variant="outline" onClick={handleResetFilters} className="mt-4 border-primary text-primary hover:bg-emerald-50">Reset Filter</Button>
          )}
          <p className="mt-4 text-sm">
            Anda butuh sesuatu? {' '}
            <Link to="/wishlist/create" className="text-emerald-600 font-medium hover:underline">
              Buat Permintaan Baru
            </Link>
          </p>
        </div>
      );
    }

    // Always use list view for wishlist
    return (
      <motion.ul
        className="space-y-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {wishlistItems.map((item) => (
          <motion.div key={item.id} variants={itemVariants}>
            <WishlistItem item={item} />
          </motion.div>
        ))}
      </motion.ul>
    );
  };

  // --- Main Render ---
  return (
    <div className="container mx-auto py-8 px-4 bg-gradient-to-b from-emerald-50/30 via-white to-white min-h-screen">
      {/* Section Judul */} 
      <div className="relative text-center mb-10">
        <ListBulletIcon className="absolute inset-x-0 top-0 mx-auto -translate-y-1/4 h-64 w-64 text-emerald-100 opacity-30 -z-10" />
        <motion.h1
          className="text-3xl md:text-4xl font-bold text-emerald-600 mb-4 relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Telusuri Permintaan Barang
        </motion.h1>
        <motion.p
          className="text-lg text-gray-600 max-w-2xl mx-auto relative z-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          Lihat barang apa saja yang sedang dibutuhkan oleh komunitas. Mungkin Anda bisa membantu?
        </motion.p>
      </div>
      
      {/* Filter/Sort Section */} 
      <motion.div
        className="mb-8 space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {/* Search Input */}
        <div className="relative">
          <label htmlFor="search" className="sr-only">Cari Judul/Deskripsi</label>
          <input
            type="text"
            id="search"
            placeholder="Cari berdasarkan judul atau deskripsi permintaan..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className={`w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${searchQuery ? 'border-emerald-500 bg-emerald-50/60' : 'border-gray-300'}`}
          />
          <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Filter Trigger (Mobile) */}
        <div>
          <div className="lg:hidden mb-4">
            <Button
              variant={isFilterActive ? 'primary' : 'outline'}
              onClick={() => setIsFilterModalOpen(true)}
              className={`w-full flex items-center justify-center gap-2 py-2.5 ${isFilterActive ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
              Filter & Sortir {isFilterActive && <span className="h-2 w-2 bg-emerald-500 rounded-full"></span>}
            </Button>
          </div>

          {/* Filter Inputs (Desktop) */}
          <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* Kategori */}
            <div className="col-span-1">
              <label htmlFor="category-desktop" className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select
                id="category-desktop"
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                disabled={loadingCategories}
                className={`w-full py-2 pl-3 pr-8 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white disabled:bg-gray-100 ${selectedCategory ? 'border-emerald-500 bg-emerald-50/60' : 'border-gray-300'}`}
              >
                <option value="" disabled={loadingCategories}>
                  {loadingCategories ? '(Memuat...)' : 'Semua Kategori'}
                </option>
                {!loadingCategories && categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nama}</option>
                ))}
              </select>
            </div>
            {/* Lokasi */}
            <div className="col-span-1">
              <label htmlFor="location-desktop" className="block text-sm font-medium text-gray-700 mb-1">Lokasi (Kecamatan)</label>
              <input
                type="text"
                id="location-desktop"
                placeholder="Contoh: Menteng"
                value={selectedLocation}
                onChange={(e) => { setSelectedLocation(e.target.value); setCurrentPage(1); }}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${selectedLocation ? 'border-emerald-500 bg-emerald-50/60' : 'border-gray-300'}`}
              />
            </div>
            {/* Urutkan */}
            <div className="col-span-1">
              <label htmlFor="sort-desktop" className="block text-sm font-medium text-gray-700 mb-1">Urutkan</label>
              <select
                id="sort-desktop"
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="w-full py-2 pl-3 pr-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                <option value="created_at,desc">Permintaan Terbaru</option>
                <option value="created_at,asc">Permintaan Terlama</option>
                <option value="judul,asc">Judul A-Z</option>
                <option value="judul,desc">Judul Z-A</option>
              </select>
            </div>
            {/* Reset Button */}
            <div className="col-span-1">
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="w-full py-2 border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={!isFilterActive}
              >
                <XMarkIcon className="h-5 w-5 mr-1" /> Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Total Items Info */} 
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2">
          <div className="text-sm text-gray-700 font-medium bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200 order-last sm:order-first">
            {totalItems > 0 ?
              `Menampilkan ${Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - ${Math.min(currentPage * itemsPerPage, totalItems)} dari ${totalItems} permintaan ditemukan` :
              !loading ? 'Tidak ada permintaan ditemukan' : ''
            }
          </div>
          {/* View Mode Buttons - Removed for wishlist for now */}
        </div>
      </motion.div>

      <hr className="my-8 border-gray-100" />

      {/* Main Content Area */} 
      {renderContent()}

      {/* Pagination */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Filter Modal (Mobile) */} 
      <Transition appear show={isFilterModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-30 lg:hidden" onClose={() => setIsFilterModalOpen(false)}>
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" /> 
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4 flex justify-between items-center">
                    Filter & Sortir
                    <button onClick={() => setIsFilterModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </Dialog.Title>
                  
                  <div className="space-y-4 mt-2">
                    {/* Kategori (Mobile) */} 
                    <div>
                      <label htmlFor="category-mobile" className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                      <select
                        id="category-mobile" value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                        disabled={loadingCategories}
                        className={`w-full py-2 pl-3 pr-8 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white disabled:bg-gray-100 ${selectedCategory ? 'border-emerald-500' : 'border-gray-300'}`}
                      >
                        <option value="" disabled={loadingCategories}>
                          {loadingCategories ? '(Memuat Kategori...)' : 'Semua Kategori'}
                        </option>
                        {!loadingCategories && categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.nama}</option>)}
                      </select>
                      {errorCategories && <p className="text-xs text-red-500 mt-1">{errorCategories}</p>}
                    </div>
                    {/* Lokasi (Mobile) */} 
                    <div>
                      <label htmlFor="location-mobile" className="block text-sm font-medium text-gray-700 mb-1">Lokasi (Kecamatan)</label>
                      <input type="text" id="location-mobile" value={selectedLocation} onChange={(e) => { setSelectedLocation(e.target.value); setCurrentPage(1); }}
                        placeholder="Contoh: Menteng"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${selectedLocation ? 'border-emerald-500' : 'border-gray-300'}`}
                      />
                    </div>
                    {/* Urutkan (Mobile) */} 
                    <div>
                      <label htmlFor="sort-mobile" className="block text-sm font-medium text-gray-700 mb-1">Urutkan</label>
                      <select id="sort-mobile" value={sortBy} onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                        className={`w-full py-2 pl-3 pr-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white`}
                      >
                        <option value="created_at,desc">Permintaan Terbaru</option>
                        <option value="created_at,asc">Permintaan Terlama</option>
                        <option value="judul,asc">Judul A-Z</option>
                        <option value="judul,desc">Judul Z-A</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between gap-4">
                    <Button
                      variant="outline"
                      onClick={() => { handleResetFilters(); setIsFilterModalOpen(false); }}
                      className="flex flex-1 items-center justify-center border-gray-300 text-gray-600 hover:bg-gray-100 py-2.5"
                      disabled={!isFilterActive}
                    >
                      <XMarkIcon className="h-5 w-5 mr-1" /> Reset
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

export default BrowseWishlistPage; 