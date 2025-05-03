import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import Button from './ui/Button';
import { toast } from 'react-hot-toast';
import {
  TrashIcon,
  PencilIcon, // Untuk Edit (opsional)
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  InboxIcon,
  ListBulletIcon,
  TagIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

// --- Wishlist Status Badge (Mirip StatusBadge di Dashboard) ---
function WishlistStatusBadge({ status }) {
  let bgColor, textColor, text, Icon;
  switch (status?.toLowerCase()) {
    case 'aktif':
      bgColor = 'bg-emerald-100'; textColor = 'text-emerald-800'; text = 'Aktif'; Icon = CheckCircleIcon; break;
    case 'dipenuhi':
      bgColor = 'bg-blue-100'; textColor = 'text-blue-800'; text = 'Dipenuhi'; Icon = CheckCircleIcon; break;
    case 'dihapus':
      bgColor = 'bg-gray-100'; textColor = 'text-gray-600'; text = 'Dihapus'; Icon = XCircleIcon; break;
    default:
      bgColor = 'bg-yellow-100'; textColor = 'text-yellow-800'; text = status || 'Unknown'; Icon = ClockIcon;
  }
  return (
    <span className={`inline-flex items-center gap-1.5 ${bgColor} ${textColor} px-1.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap`}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {text}
    </span>
  );
}

// --- Skeleton Loader ---
function WishlistItemSkeleton() {
    return (
        <div className="bg-surface p-4 rounded-lg shadow border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-pulse">
            <div className="flex-grow w-full space-y-3">
                <div className="flex justify-between items-start">
                    <div className="h-5 bg-gray-300 rounded w-3/5"></div> {/* Title placeholder */}
                    <div className="h-4 bg-gray-300 rounded-full w-16"></div> {/* Badge placeholder */}
                </div>
                <div className="h-3 bg-gray-300 rounded w-4/5"></div> {/* Meta placeholder */}
                <div className="h-3 bg-gray-300 rounded w-1/2"></div> {/* Meta placeholder shorter */}
            </div>
            <div className="flex flex-shrink-0 gap-2 mt-2 sm:mt-0 self-end sm:self-center">
                <div className="h-8 bg-gray-300 rounded w-20"></div> {/* Button placeholder */}
                <div className="h-8 bg-gray-300 rounded w-20"></div> {/* Button placeholder */}
            </div>
        </div>
    );
}

// --- Confirmation Modal for Delete Wishlist ---
function DeleteWishlistConfirmationModal({ isOpen, onClose, onConfirm, isLoading }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                           Hapus Permintaan Barang
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">
                                Apakah Anda yakin ingin menghapus permintaan ini? Permintaan ini tidak akan tampil lagi di halaman pencarian.
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
                        {isLoading ? 'Menghapus...' : 'Ya, Hapus'}
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

const ITEMS_PER_PAGE = 5;

function MyWishlistItems() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);

    const fetchWishlistItems = useCallback(async (loadMore = false) => {
        if (!user) return;

        const currentOffset = loadMore ? offset + ITEMS_PER_PAGE : 0;
        if (loadMore) {
            setLoadingMore(true);
        } else {
            setLoading(true);
            setError(null);
            setWishlistItems([]); // Reset list when not loading more
        }

        try {
            const { data, error: fetchError /*, count */ } = await supabase
                .from('permintaan_barang')
                .select(`
                    id,
                    judul,
                    deskripsi,
                    created_at,
                    status,
                    kategori ( id, nama )
                `)
                .eq('id_peminta', user.id)
                // Urutkan berdasarkan status (aktif dulu) lalu tanggal
                .order('status', { ascending: true }) 
                .order('created_at', { ascending: false })
                .range(currentOffset, currentOffset + ITEMS_PER_PAGE - 1);

            if (fetchError) throw fetchError;

            if (data) {
                setWishlistItems(prev => loadMore ? [...prev, ...data] : data);
                setOffset(currentOffset);
                // Check if there are more items than currently displayed
                // Approximation: if returned items < limit, assume no more
                setHasMore(data.length === ITEMS_PER_PAGE);
            }
        } catch (err) {
            console.error("Error fetching user wishlist items:", err);
            setError("Gagal memuat daftar permintaan Anda.");
            toast.error("Gagal memuat permintaan.");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [user, offset]);

    useEffect(() => {
        fetchWishlistItems(false); // Initial fetch
    }, [fetchWishlistItems]);

    const handleDeleteClick = (id) => {
        setDeletingId(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deletingId) return;
        setLoadingDelete(true);
        try {
            // Update status to 'dihapus' instead of actual deletion
            const { error: updateError } = await supabase
                .from('permintaan_barang')
                .update({ status: 'dihapus', updated_at: new Date().toISOString() })
                .eq('id', deletingId)
                .eq('id_peminta', user.id); // Ensure user owns the item

            if (updateError) throw updateError;

            toast.success("Permintaan berhasil dihapus.");
            // Remove the item from the local state or refetch
            setWishlistItems(prev => prev.filter(item => item.id !== deletingId));
            // Optionally adjust total count if needed, though not strictly necessary for status update
            setIsDeleteModalOpen(false);
            setDeletingId(null);
        } catch (err) {
            console.error("Error deleting wishlist item:", err);
            toast.error("Gagal menghapus permintaan.");
        } finally {
            setLoadingDelete(false);
        }
    };

    const handleEditClick = (id) => {
         navigate(`/wishlist/${id}/edit`);
    };

    // --- Render Functions ---
    const renderList = () => {
        if (loading && wishlistItems.length === 0) {
            return Array.from({ length: 3 }).map((_, i) => <WishlistItemSkeleton key={i} />);
        }
        if (error) {
            return <div className="text-center text-red-600 py-4 text-sm">Error: {error}</div>;
        }
        if (wishlistItems.length === 0) {
            return (
                <div className="text-center py-10 px-6 bg-gray-50/70 rounded-lg border border-dashed border-gray-300">
                    <InboxIcon className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                    <p className="text-text-secondary text-sm mb-4">Anda belum membuat permintaan barang.</p>
                    <Link to="/wishlist/create">
                        <Button variant="primary" size="sm" className="inline-flex items-center gap-1.5">
                           <ListBulletIcon className="h-4 w-4"/> Buat Permintaan Baru
                        </Button>
                    </Link>
                 </div>
            );
        }

        return wishlistItems.map((item) => (
            <div key={item.id} className="bg-surface p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start gap-4">
                <div className="flex-grow w-full">
                    <div className="flex justify-between items-start mb-2">
                        <Link to={`/wishlist/${item.id}`} className="text-base font-semibold text-gray-800 hover:text-primary line-clamp-2 mr-2 break-all">
                            {item.judul}
                        </Link>
                        <WishlistStatusBadge status={item.status} />
                    </div>
                    <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                         <span className="inline-flex items-center gap-1">
                            <TagIcon className="h-3.5 w-3.5 text-gray-400" />
                            {item.kategori?.nama || 'Lainnya'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                             <CalendarDaysIcon className="h-3.5 w-3.5 text-gray-400" />
                             Dibuat: {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: localeID })}
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {item.deskripsi || <span className="italic">Tidak ada deskripsi.</span>}
                    </p>
                </div>
                {/* Actions */} 
                <div className="flex flex-shrink-0 gap-2 mt-2 sm:mt-0 self-end sm:self-start">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(item.id)}
                        title="Edit Permintaan"
                        className="border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                        disabled={item.status !== 'aktif'}
                    >
                        <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(item.id)}
                        title="Hapus Permintaan"
                        className="border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                        disabled={item.status === 'dihapus'}
                    >
                        <TrashIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        ));
    };

    return (
        <div className="space-y-4">
            {renderList()}
            {hasMore && (
                <div className="text-center mt-6">
                    <Button
                        variant="secondary"
                        onClick={() => fetchWishlistItems(true)}
                        disabled={loadingMore}
                        className="inline-flex items-center gap-1.5"
                    >
                        {loadingMore ? <ArrowPathIcon className="animate-spin h-4 w-4" /> : <InboxIcon className="h-4 w-4" />}
                        {loadingMore ? 'Memuat Lebih Banyak...' : 'Muat Lebih Banyak'}
                    </Button>
                </div>
            )}
             <DeleteWishlistConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                isLoading={loadingDelete}
            />
        </div>
    );
}

export default MyWishlistItems; 