import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import Button from '../components/ui/Button';
import { toast } from 'react-hot-toast';
import {
    ArrowLeftIcon,
    ChatBubbleLeftEllipsisIcon,
    TagIcon,
    MapPinIcon,
    CalendarDaysIcon,
    UserCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Komponen untuk Loading State
function LoadingWishlistDetail() {
    return (
        <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-md border border-gray-100 animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-3/4 mb-6"></div> {/* Title Placeholder */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                {/* Left Column Placeholder */}
                <div className="md:w-2/3 space-y-4">
                    <div className="h-4 bg-gray-300 rounded w-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-300 rounded w-full"></div>
                     <div className="h-4 bg-gray-300 rounded w-1/2 mt-4"></div> {/* Description Lines */}
                </div>
                {/* Right Column Placeholder */}
                <div className="md:w-1/3 space-y-3 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                        <div className="flex-grow space-y-1.5">
                           <div className="h-3 bg-gray-300 rounded w-full"></div>
                           <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                        </div>
                    </div>
                    <div className="h-4 bg-gray-300 rounded w-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-full"></div>
                    <div className="h-10 bg-gray-300 rounded w-full mt-4"></div> {/* Button Placeholder */}
                </div>
            </div>
        </div>
    );
}

function WishlistDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { openChatWidget } = useChat();

    const [wishlistItem, setWishlistItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWishlistItem = async () => {
            if (!id) {
                setError("ID Permintaan tidak valid.");
                setLoading(false);
                return;
            }

            setLoading(true);
            NProgress.start();
            setError(null);
            setWishlistItem(null);

            try {
                const { data, error: fetchError } = await supabase
                    .from('permintaan_barang')
                    .select(`
                        id,
                        judul,
                        deskripsi,
                        lokasi_kecamatan,
                        created_at,
                        status,
                        id_peminta,
                        kategori ( id, nama ),
                        profil ( id, nama_pengguna, avatar_url )
                    `)
                    .eq('id', id)
                    .eq('status', 'aktif') // Hanya ambil yang masih aktif
                    .maybeSingle(); // Gunakan maybeSingle karena mungkin tidak ditemukan

                if (fetchError) throw fetchError;

                if (data) {
                    setWishlistItem(data);
                } else {
                    setError("Permintaan barang tidak ditemukan atau sudah tidak aktif.");
                }
            } catch (err) {
                console.error("Error fetching wishlist item:", err);
                setError("Gagal memuat detail permintaan barang.");
                toast.error("Gagal memuat detail.");
            } finally {
                setLoading(false);
                NProgress.done();
            }
        };

        fetchWishlistItem();
    }, [id]); // Re-fetch if ID changes

    const handleOfferHelp = () => {
        if (!user) {
            toast.error("Silakan login untuk menawarkan bantuan.");
            navigate('/login');
            return;
        }
        if (!wishlistItem || !wishlistItem.profil) {
            toast.error("Tidak dapat memulai chat, data peminta tidak lengkap.");
            return;
        }
        if (user.id === wishlistItem.id_peminta) {
            toast("Anda tidak bisa menawarkan bantuan untuk permintaan Anda sendiri.");
            return;
        }

        openChatWidget(wishlistItem.id_peminta);
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const names = name.split(' ');
        return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name[0]?.toUpperCase() || '?';
    };

    const timeAgo = wishlistItem?.created_at ? formatDistanceToNow(new Date(wishlistItem.created_at), { addSuffix: true, locale: localeID }) : '-';

    if (loading) {
        return <LoadingWishlistDetail />;
    }

    if (error) {
        return (
            <div className="text-center py-10 max-w-2xl mx-auto">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-red-700 mb-2">Terjadi Kesalahan</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <Button variant="outline" onClick={() => navigate('/wishlist/browse')} className="inline-flex items-center gap-2">
                     <ArrowLeftIcon className="h-4 w-4" /> Kembali ke Daftar
                 </Button>
            </div>
        );
    }

    if (!wishlistItem) {
         // Ini seharusnya sudah ditangani oleh state error di atas, tapi sebagai fallback
         return (
            <div className="text-center py-10 max-w-2xl mx-auto">
                <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Tidak Ditemukan</h2>
                <p className="text-gray-600 mb-6">Permintaan barang yang Anda cari tidak ditemukan.</p>
                <Button variant="outline" onClick={() => navigate('/wishlist/browse')} className="inline-flex items-center gap-2">
                     <ArrowLeftIcon className="h-4 w-4" /> Kembali ke Daftar
                 </Button>
            </div>
        );
    }

    const isOwnRequest = user && user.id === wishlistItem.id_peminta;

    return (
        <div>
             <div className="mb-6">
                 <Button variant="ghost" onClick={() => navigate(-1)} className="text-sm text-gray-600 hover:text-primary inline-flex items-center gap-1 pl-1">
                     <ArrowLeftIcon className="h-4 w-4" /> Kembali
                 </Button>
             </div>

            <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-lg border border-gray-100">
                {/* Header Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 break-words">
                    Permintaan: {wishlistItem.judul}
                </h1>

                <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                    {/* Main Content (Left) */}
                    <div className="md:w-2/3">
                         <h2 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">Detail Kebutuhan</h2>
                         <p className="text-gray-700 whitespace-pre-wrap leading-relaxed break-words">{wishlistItem.deskripsi || <span className="text-gray-500 italic">Tidak ada deskripsi tambahan yang diberikan.</span>}</p>
                    </div>

                    {/* Sidebar Info (Right) */}
                    <div className="md:w-1/3 space-y-4 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6">
                         <h3 className="text-md font-semibold text-gray-700 mb-3">Informasi Permintaan</h3>
                         {/* Requester Info */}
                         <div className="flex items-center gap-3">
                            <Link to={`/profile/${wishlistItem.profil.id}`} className="block h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center text-base font-semibold overflow-hidden flex-shrink-0 ring-1 ring-emerald-100 hover:ring-emerald-300 transition-all" title={wishlistItem.profil?.nama_pengguna || 'User'}>
                                {wishlistItem.profil?.avatar_url ? (
                                    <img src={wishlistItem.profil.avatar_url} alt="Avatar" className="rounded-full h-full w-full object-cover" />
                                ) : (
                                    <span>{getInitials(wishlistItem.profil?.nama_pengguna)}</span>
                                )}
                            </Link>
                            <div>
                                <p className="text-sm font-medium text-gray-800">Diminta oleh:</p>
                                <Link to={`/profile/${wishlistItem.profil.id}`} className="text-sm text-primary hover:underline font-medium truncate block" title={wishlistItem.profil?.nama_pengguna || 'Anonim'}>
                                    {wishlistItem.profil?.nama_pengguna || 'Anonim'}
                                </Link>
                            </div>
                        </div>
                        {/* Other Details */}
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                                <TagIcon className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                <span>Kategori: <span className="font-medium text-gray-800 capitalize">{wishlistItem.kategori?.nama || 'Lainnya'}</span></span>
                            </div>
                            {wishlistItem.lokasi_kecamatan && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <MapPinIcon className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                    <span>Lokasi: <span className="font-medium text-gray-800">{wishlistItem.lokasi_kecamatan}</span></span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-600">
                                <CalendarDaysIcon className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                <span>Dibuat: <span className="font-medium text-gray-800">{timeAgo}</span></span>
                            </div>
                        </div>

                        {/* Action Button */}
                         <div className="pt-4 mt-4 border-t border-gray-200">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleOfferHelp}
                                disabled={!user || isOwnRequest || loading}
                                className={`w-full inline-flex items-center justify-center gap-2 transition-opacity duration-200 ${isOwnRequest ? 'opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400' : ''}`}
                                title={isOwnRequest ? "Anda tidak bisa menawarkan bantuan pada permintaan sendiri" : (!user ? "Login untuk menawarkan bantuan" : "Hubungi peminta via chat")}
                             >
                                <ChatBubbleLeftEllipsisIcon className="h-5 w-5"/>
                                {isOwnRequest ? "Ini Permintaan Anda" : "Tawarkan Bantuan (Chat)"}
                            </Button>
                            {!user && <p className="text-xs text-center text-gray-500 mt-2">Silakan <Link to='/login' className='text-primary hover:underline'>login</Link> untuk bisa menawarkan bantuan.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WishlistDetailPage; 