import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { toast } from 'react-hot-toast';
import {
    ClipboardDocumentListIcon,
    TagIcon,
    MapPinIcon,
    ArrowPathIcon,
    PencilSquareIcon, // Ganti ikon judul
    LightBulbIcon,
    ArrowLeftIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

const MAX_TITLE_LENGTH = 100;
const MAX_DESC_LENGTH = 500;

// Loading Skeleton
function LoadingEditWishlistForm() {
    return (
        <div className="space-y-8 bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-100 animate-pulse">
            {/* Section 1 */}
            <fieldset className="space-y-5">
                <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div> {/* Legend Placeholder */}
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-1.5"></div> {/* Label Placeholder */}
                <div className="h-10 bg-gray-300 rounded w-full"></div> {/* Input Placeholder */}
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-1.5"></div> {/* Label Placeholder */}
                <div className="h-10 bg-gray-300 rounded w-full"></div> {/* Input Placeholder */}
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-1.5"></div> {/* Label Placeholder */}
                <div className="h-20 bg-gray-300 rounded w-full"></div> {/* Textarea Placeholder */}
            </fieldset>
            {/* Section 2 */}
            <fieldset className="space-y-5">
                <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div> {/* Legend Placeholder */}
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-1.5"></div> {/* Label Placeholder */}
                <div className="h-10 bg-gray-300 rounded w-full"></div> {/* Input Placeholder */}
            </fieldset>
            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200 mt-6">
                <div className="h-12 bg-gray-300 rounded w-full"></div> {/* Button Placeholder */}
            </div>
        </div>
    );
}

function EditWishlistPage() {
    const { id } = useParams(); // ID dari wishlist item
    const { user } = useAuth();
    const navigate = useNavigate();

    // --- Form State ---
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [location, setLocation] = useState('');
    const [originalData, setOriginalData] = useState(null); // Untuk cek kepemilikan & data awal

    // --- UI State ---
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [errorCategories, setErrorCategories] = useState(null);
    const [loadingData, setLoadingData] = useState(true); // Loading data wishlist awal
    const [errorData, setErrorData] = useState(null); // Error saat fetch data awal
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [validationErrors, setValidationErrors] = useState({ title: false, category: false });

    // --- Fetch Categories --- (Sama seperti Create)
    useEffect(() => {
        const fetchCategories = async () => {
            // ... (logika fetch kategori sama seperti di CreateWishlistPage) ...
            setLoadingCategories(true);
            setErrorCategories(null);
            try {
                const { data, error } = await supabase
                    .from('kategori')
                    .select('id, nama')
                    .order('nama', { ascending: true });
                if (error) throw error;
                setCategories(data || []);
            } catch (error) {
                console.error("Error fetching categories:", error);
                setErrorCategories("Gagal memuat kategori.");
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []);

    // --- Fetch Wishlist Item Data --- 
    useEffect(() => {
        const fetchWishlistItem = async () => {
            if (!id || !user) return;
            setLoadingData(true);
            setErrorData(null);
            NProgress.start();

            try {
                const { data, error: fetchError } = await supabase
                    .from('permintaan_barang')
                    .select('id, judul, deskripsi, id_kategori, lokasi_kecamatan, id_peminta, status')
                    .eq('id', id)
                    .single(); // Ambil satu data

                if (fetchError) throw fetchError;

                if (!data) {
                    throw new Error("Permintaan tidak ditemukan.");
                }
                if (data.id_peminta !== user.id) {
                    throw new Error("Anda tidak berhak mengedit permintaan ini.");
                }
                 if (data.status === 'dihapus') {
                     throw new Error("Permintaan yang sudah dihapus tidak bisa diedit.");
                 }

                // Set form state with fetched data
                setTitle(data.judul || '');
                setDescription(data.deskripsi || '');
                setCategoryId(data.id_kategori?.toString() || '');
                setLocation(data.lokasi_kecamatan || '');
                setOriginalData(data); // Simpan data asli

            } catch (err) {
                console.error("Error fetching wishlist item for edit:", err);
                setErrorData(err.message || "Gagal memuat data permintaan.");
                toast.error(err.message || "Gagal memuat data.");
                // navigate('/dashboard'); // Redirect jika error?
            } finally {
                setLoadingData(false);
                NProgress.done();
            }
        };

        fetchWishlistItem();
    }, [id, user, navigate]);

    // --- Reset validation error on input change ---
     const handleInputChange = (setter, fieldName) => (e) => {
         setter(e.target.value);
         if (validationErrors[fieldName]) {
             setValidationErrors(prev => ({ ...prev, [fieldName]: false }));
         }
     };

    // --- Form Submission (UPDATE) ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        // --- Client-side validation ---
        const errors = {
            title: !title.trim() || title.trim().length <= 5,
            category: !categoryId,
        };
        setValidationErrors(errors);
        const hasError = Object.values(errors).some(Boolean);

        if (!user || !originalData || user.id !== originalData.id_peminta) {
            toast.error("Aksi tidak diizinkan.");
            return;
        }
         if (originalData.status === 'dihapus') {
            toast.error("Tidak bisa mengedit permintaan yang sudah dihapus.");
            return;
         }
        if (hasError) {
            toast.error("Harap periksa isian form Anda.");
            return;
        }
        // --- End Validation ---

        setLoadingSubmit(true);
        let loadingToastId = toast.loading("Memperbarui permintaan...", { duration: Infinity });

        try {
            const updatedData = {
                judul: title.trim(),
                deskripsi: description.trim() || null,
                id_kategori: parseInt(categoryId, 10),
                lokasi_kecamatan: location.trim() || null,
                updated_at: new Date().toISOString(), // Update timestamp
            };

            const { error: updateError } = await supabase
                .from('permintaan_barang')
                .update(updatedData)
                .eq('id', id)
                .eq('id_peminta', user.id); // Double check ownership

            if (updateError) {
                throw new Error(`Gagal memperbarui permintaan: ${updateError.message}`);
            }

            toast.success("Permintaan berhasil diperbarui!", { id: loadingToastId, duration: 3000 });

            // Navigate back to dashboard or detail page after success
            setTimeout(() => { navigate('/dashboard'); }, 1500); // Kembali ke dashboard

        } catch (error) {
            console.error("Error updating wishlist request:", error);
            toast.error(error.message || "Terjadi kesalahan saat memperbarui.", { id: loadingToastId || undefined, duration: 4000 });
        } finally {
            setLoadingSubmit(false);
        }
    };

    // --- Render ---
    if (loadingData) {
        return (
            <div className="container mx-auto py-10 md:py-14 px-4">
                <div className="lg:w-2/3 xl:w-3/5 flex-shrink-0">
                    <div className="flex items-center gap-3 mb-8">
                         <div className="h-8 w-8 bg-gray-300 rounded animate-pulse"></div>
                         <div className="h-8 bg-gray-300 rounded w-1/2 animate-pulse"></div>
                    </div>
                    <LoadingEditWishlistForm />
                </div>
             </div>
        );
    }

    if (errorData) {
        return (
            <div className="text-center py-10 max-w-2xl mx-auto">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-red-700 mb-2">Terjadi Kesalahan</h2>
                <p className="text-gray-600 mb-6">{errorData}</p>
                <Button variant="outline" onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-2">
                     <ArrowLeftIcon className="h-4 w-4" /> Kembali ke Dashboard
                 </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 md:py-14 px-4">
             {/* Tombol Kembali */}
             <div className="mb-6">
                 <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-sm text-gray-600 hover:text-primary inline-flex items-center gap-1 pl-1">
                     <ArrowLeftIcon className="h-4 w-4" /> Kembali ke Dashboard
                 </Button>
             </div>

            <div className="flex flex-col lg:flex-row lg:gap-10 xl:gap-16">
                <div className="lg:w-2/3 xl:w-3/5 flex-shrink-0">
                    <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
                        <PencilSquareIcon className="h-8 w-8 text-primary" />
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Edit Permintaan Barang</h1>
                    </div>

                    <form onSubmit={handleSubmit} className={`space-y-8 bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-100 transition-opacity duration-300 ease-in-out ${loadingSubmit ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
                        {/* Form Fields (Sama seperti Create, tapi value dari state) */}
                        {/* Section: Info Dasar Permintaan */}
                        <fieldset className="space-y-5">
                             <legend className="flex items-center gap-2 text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4">
                                 <ClipboardDocumentListIcon className="h-5 w-5 text-gray-500" />
                                 Informasi Kebutuhan
                             </legend>
                            {/* Judul Permintaan */} 
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">Barang yang Dibutuhkan <span className="text-red-500">*</span></label>
                                <input
                                    type="text" id="title" value={title}
                                    onChange={handleInputChange(setTitle, 'title')}
                                    required minLength={6} maxLength={MAX_TITLE_LENGTH} disabled={loadingSubmit}
                                    className={`w-full px-3.5 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out disabled:bg-gray-100 disabled:opacity-70 ${validationErrors.title ? 'border-red-500 ring-red-500/30' : 'border-gray-300'}`}
                                    placeholder="Contoh: Meja Belajar Anak, Sepeda Ukuran 16 inch"
                                    aria-invalid={validationErrors.title}
                                    aria-describedby={validationErrors.title ? "title-error" : "title-help"}
                                />
                                <div className="flex justify-between items-center mt-1.5">
                                     <p id="title-help" className="text-xs text-gray-500">Jelaskan barang yang Anda cari (min. 6 karakter).</p>
                                     <p className="text-xs text-gray-400">{title.length}/{MAX_TITLE_LENGTH}</p>
                                 </div>
                                {validationErrors.title && <p id="title-error" className="text-xs text-red-600 mt-1">Judul wajib diisi (minimal 6 karakter).</p>}
                            </div>
                             {/* Kategori (Wajib) */} 
                             <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">Kategori Barang <span className="text-red-500">*</span></label>
                                <select
                                    id="category" value={categoryId} // value dari state
                                    onChange={handleInputChange(setCategoryId, 'category')}
                                    required disabled={loadingCategories || loadingSubmit}
                                    className={`w-full px-3.5 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out bg-white disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70 ${validationErrors.category ? 'border-red-500 ring-red-500/30' : 'border-gray-300'}`}
                                    aria-invalid={validationErrors.category}
                                    aria-describedby={validationErrors.category ? "category-error" : ""}
                                >
                                    <option value="" disabled>-- {loadingCategories ? 'Memuat...' : 'Pilih Kategori'} --</option>
                                    {!loadingCategories && categories.map((cat) => (<option key={cat.id} value={cat.id.toString()}>{cat.nama}</option>))} 
                                </select>
                                {errorCategories && <p className="text-xs text-red-500 mt-1">{errorCategories}</p>}
                                 {validationErrors.category && <p id="category-error" className="text-xs text-red-600 mt-1.5">Kategori wajib dipilih.</p>}
                             </div>
                            {/* Deskripsi Permintaan */} 
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi Detail <span className="text-gray-400 text-xs">(Opsional)</span></label>
                                <textarea
                                    id="description" value={description} // value dari state
                                    onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={MAX_DESC_LENGTH} disabled={loadingSubmit}
                                    className="w-full px-3.5 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out disabled:bg-gray-100 disabled:opacity-70"
                                    placeholder="Jelaskan lebih rinci kebutuhan Anda..."
                                />
                                <p className="text-right text-xs text-gray-400 mt-1.5">{description.length}/{MAX_DESC_LENGTH}</p>
                            </div>
                        </fieldset>

                        {/* Section: Lokasi Peminta */}
                         <fieldset>
                             <legend className="flex items-center gap-2 text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4">
                                 <MapPinIcon className="h-5 w-5 text-gray-500" />
                                 Lokasi Anda
                             </legend>
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1.5">Lokasi (Kecamatan) <span className="text-gray-400 text-xs">(Opsional)</span></label>
                                <input
                                    type="text" id="location" value={location} // value dari state
                                    onChange={(e) => setLocation(e.target.value)} maxLength={100} disabled={loadingSubmit}
                                    className="w-full px-3.5 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out disabled:bg-gray-100 disabled:opacity-70"
                                    placeholder="Contoh: Laweyan, Solo"
                                />
                                <p className="mt-1.5 text-xs text-gray-500">Masukkan kecamatan Anda.</p>
                            </div>
                        </fieldset>

                        {/* Tombol Submit */}
                        <div className="pt-6 border-t border-gray-200 mt-6">
                            <Button type="submit" variant="primary" size="lg" className="w-full inline-flex items-center justify-center gap-2 transition-all duration-150 ease-in-out disabled:opacity-60" disabled={loadingSubmit || loadingData}>
                                {loadingSubmit ? <ArrowPathIcon className="animate-spin h-5 w-5 mr-1" /> : <PencilSquareIcon className="h-5 w-5" />}
                                {loadingSubmit ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Aside Tips Section (optional, bisa dihapus jika tidak relevan) */}
                <aside className="hidden lg:block lg:w-1/3 xl:w-2/5 mt-8 lg:mt-20">
                     <div className="sticky top-24 space-y-6 bg-emerald-50/50 p-6 rounded-lg border border-emerald-100 shadow-sm">
                        <h3 className="flex items-center gap-2 font-semibold text-lg text-emerald-800">
                           <LightBulbIcon className="h-6 w-6 text-emerald-600" />
                            Tips Mengedit Permintaan
                        </h3>
                        <ul className="space-y-3 text-sm text-emerald-700 list-disc list-outside pl-5 marker:text-emerald-400">
                            <li>Pastikan judul tetap jelas dan spesifik.</li>
                            <li>Perbarui deskripsi jika ada perubahan detail kebutuhan.</li>
                            <li>Cek kembali kategori dan lokasi jika diperlukan.</li>
                        </ul>
                    </div>
                </aside>
            </div>
        </div>
    );
}

export default EditWishlistPage; 