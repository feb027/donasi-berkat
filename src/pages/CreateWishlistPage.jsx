import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { toast } from 'react-hot-toast';
import {
    ClipboardDocumentListIcon,
    TagIcon,
    MapPinIcon,
    ArrowPathIcon,
    QuestionMarkCircleIcon, // Diganti dari GiftIcon
    LightBulbIcon,
    ListBulletIcon // Ganti ikon tips jika perlu
} from '@heroicons/react/24/outline';

const MAX_TITLE_LENGTH = 100;
const MAX_DESC_LENGTH = 500;

function CreateWishlistPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // --- Form State ---
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [location, setLocation] = useState('');

    // --- UI State ---
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [errorCategories, setErrorCategories] = useState(null);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [validationErrors, setValidationErrors] = useState({
        title: false, category: false
    });

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
            } catch (error) {
                console.error("Error fetching categories:", error);
                setErrorCategories("Gagal memuat kategori.");
                toast.error("Gagal memuat kategori.");
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []);

    // --- Reset validation error on input change ---
     const handleInputChange = (setter, fieldName) => (e) => {
         setter(e.target.value);
         if (validationErrors[fieldName]) {
             setValidationErrors(prev => ({ ...prev, [fieldName]: false }));
         }
     };

    // --- Form Submission ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        // --- Client-side validation ---
        const errors = {
            title: !title.trim() || title.trim().length <= 5, // Minimal 6 karakter
            category: !categoryId, // Kategori wajib dipilih
        };
        setValidationErrors(errors);
        const hasError = Object.values(errors).some(Boolean);

        if (!user) {
            toast.error("Anda harus login untuk membuat permintaan.");
            return;
        }
        if (hasError) {
            toast.error("Harap periksa isian form Anda.");
            return;
        }
        // --- End Validation ---

        setLoadingSubmit(true);
        let loadingToastId = toast.loading("Menyimpan permintaan Anda...", { duration: Infinity });

        try {
            const wishlistData = {
                id_peminta: user.id,
                judul: title.trim(),
                deskripsi: description.trim() || null,
                id_kategori: parseInt(categoryId, 10),
                lokasi_kecamatan: location.trim() || null,
                status: 'aktif',
            };

            const { data: insertedData, error: insertError } = await supabase
                .from('permintaan_barang')
                .insert([wishlistData])
                .select('id') // Ambil ID dari data yang baru dimasukkan
                .single(); // Karena kita insert satu baris

            if (insertError) {
                throw new Error(`Gagal menyimpan permintaan: ${insertError.message}`);
            }

            toast.success("Permintaan berhasil dibuat!", { id: loadingToastId, duration: 3000 });

            // Reset form
            setTitle('');
            setDescription('');
            setCategoryId('');
            setLocation('');
            setValidationErrors({ title: false, category: false });

            // Navigate to the detail page of the newly created wishlist item
            if (insertedData?.id) {
                 setTimeout(() => { navigate(`/wishlist/${insertedData.id}`); }, 1500);
            } else {
                 setTimeout(() => { navigate('/wishlist/browse'); }, 1500); // Fallback ke browse
            }

        } catch (error) {
            console.error("Error submitting wishlist request:", error);
            toast.error(error.message || "Terjadi kesalahan.", { id: loadingToastId || undefined, duration: 4000 });
        } finally {
            setLoadingSubmit(false);
        }
    };

    // --- Render ---
    return (
        <div className="container mx-auto py-10 md:py-14 px-4">
            <div className="flex flex-col lg:flex-row lg:gap-10 xl:gap-16">

                <div className="lg:w-2/3 xl:w-3/5 flex-shrink-0">
                    <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
                        <QuestionMarkCircleIcon className="h-8 w-8 text-primary" />
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Formulir Permintaan Barang</h1>
                    </div>

                    <form onSubmit={handleSubmit} className={`space-y-8 bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-100 transition-opacity duration-300 ease-in-out ${loadingSubmit ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>

                        {/* --- Section: Info Dasar Permintaan --- */}
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
                                    id="category" value={categoryId}
                                    onChange={handleInputChange(setCategoryId, 'category')}
                                    required disabled={loadingCategories || loadingSubmit}
                                    className={`w-full px-3.5 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out bg-white disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70 ${validationErrors.category ? 'border-red-500 ring-red-500/30' : 'border-gray-300'}`}
                                    aria-invalid={validationErrors.category}
                                    aria-describedby={validationErrors.category ? "category-error" : ""}
                                >
                                    <option value="" disabled>-- {loadingCategories ? 'Memuat...' : 'Pilih Kategori'} --</option>
                                    {!loadingCategories && categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.nama}</option>))} 
                                </select>
                                {errorCategories && <p className="text-xs text-red-500 mt-1">{errorCategories}</p>}
                                 {validationErrors.category && <p id="category-error" className="text-xs text-red-600 mt-1.5">Kategori wajib dipilih.</p>}
                             </div>

                            {/* Deskripsi Permintaan */} 
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi Detail <span className="text-gray-400 text-xs">(Opsional)</span></label>
                                <textarea
                                    id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={MAX_DESC_LENGTH} disabled={loadingSubmit}
                                    className="w-full px-3.5 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out disabled:bg-gray-100 disabled:opacity-70"
                                    placeholder="Jelaskan lebih rinci kebutuhan Anda. Contoh: Warna preferensi, kondisi minimal yang diterima, urgensi, dll."
                                />
                                <p className="text-right text-xs text-gray-400 mt-1.5">{description.length}/{MAX_DESC_LENGTH}</p>
                            </div>
                        </fieldset>

                        {/* --- Section: Lokasi Peminta --- */}
                        <fieldset>
                             <legend className="flex items-center gap-2 text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4">
                                 <MapPinIcon className="h-5 w-5 text-gray-500" />
                                 Lokasi Anda
                             </legend>
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1.5">Lokasi (Kecamatan) <span className="text-gray-400 text-xs">(Opsional)</span></label>
                                <input
                                    type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={100} disabled={loadingSubmit}
                                    className="w-full px-3.5 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out disabled:bg-gray-100 disabled:opacity-70"
                                    placeholder="Contoh: Laweyan, Solo"
                                />
                                <p className="mt-1.5 text-xs text-gray-500">Masukkan kecamatan Anda. Ini membantu donatur terdekat menemukan permintaan Anda.</p>
                            </div>
                        </fieldset>

                        {/* Tombol Submit */} 
                        <div className="pt-6 border-t border-gray-200 mt-6">
                            <Button type="submit" variant="primary" size="lg" className="w-full inline-flex items-center justify-center gap-2 transition-all duration-150 ease-in-out disabled:opacity-60" disabled={loadingSubmit}>
                                {loadingSubmit && <ArrowPathIcon className="animate-spin h-5 w-5 mr-1" />} 
                                {loadingSubmit ? 'Memproses...' : 'Buat Permintaan Barang'} 
                            </Button>
                        </div>
                    </form>
                </div>

                {/* --- Aside Tips Section --- */} 
                <aside className="hidden lg:block lg:w-1/3 xl:w-2/5 mt-8 lg:mt-20">
                     <div className="sticky top-24 space-y-6 bg-emerald-50/50 p-6 rounded-lg border border-emerald-100 shadow-sm">
                        <h3 className="flex items-center gap-2 font-semibold text-lg text-emerald-800">
                           <LightBulbIcon className="h-6 w-6 text-emerald-600" /> 
                            Tips Membuat Permintaan
                        </h3>
                        <ul className="space-y-3 text-sm text-emerald-700 list-disc list-outside pl-5 marker:text-emerald-400">
                            <li>
                               <span className="font-medium">Judul Spesifik:</span> Sebutkan jenis barang secara jelas (misal: "Kursi Roda Dewasa Lipat", "Panci Kukus Ukuran Sedang").
                           </li>
                           <li>
                               <span className="font-medium">Kategori Tepat:</span> Pilih kategori yang paling sesuai agar mudah ditemukan.
                           </li>
                           <li>
                               <span className="font-medium">Deskripsi Membantu:</span> Berikan info tambahan seperti ukuran, warna preferensi (jika ada), atau alasan kebutuhan.
                           </li>
                            <li>
                               <span className="font-medium">Lokasi (Jika Perlu):</span> Jika Anda hanya bisa menerima dari area tertentu, cantumkan kecamatan Anda.
                           </li>
                        </ul>
                         <div className="mt-5 pt-4 border-t border-emerald-200/60">
                             <h4 className="flex items-center gap-2 font-semibold text-md text-emerald-800 mb-2">
                                <ListBulletIcon className="h-5 w-5 text-emerald-600"/> 
                                Setelah Permintaan Dibuat
                             </h4>
                             <p className="text-sm text-emerald-700">
                                 Permintaan Anda akan tampil di halaman "Lihat Permintaan". Donatur yang memiliki barang cocok mungkin akan menghubungi Anda melalui fitur chat.
                             </p>
                         </div>
                    </div>
                </aside>

            </div>
        </div>
    );
}

export default CreateWishlistPage; 