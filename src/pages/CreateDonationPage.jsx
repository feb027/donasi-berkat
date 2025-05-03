import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { toast } from 'react-hot-toast';
import {
    ArrowUpTrayIcon,
    PhotoIcon,
    XCircleIcon,
    ArrowPathIcon,
    ClipboardDocumentListIcon,
    TagIcon,
    MapPinIcon,
    CameraIcon,
    GiftIcon,
    LightBulbIcon,
    CheckBadgeIcon
} from '@heroicons/react/24/outline';

// Helper function untuk upload gambar (bisa dipindah ke utils jika perlu)
async function uploadDonationImages(files, userId) {
    if (!files || files.length === 0) {
        return { uploadedImageUrls: [], error: null };
    }
    if (!userId) {
        return { uploadedImageUrls: [], error: new Error("User ID diperlukan untuk upload gambar.") };
    }

    const uploadedImageUrls = [];
    const bucketName = 'donation-images'; // Pastikan bucket ini ada di Supabase!

    for (const file of files) {
        // Make sure 'file' is actually a File object
        if (!(file instanceof File)) {
            console.warn("Item skipped, not a file:", file);
            continue; // Skip if it's not a file (e.g., placeholder object)
        }
        const fileExt = file.name.split('.').pop();
        const uniqueFileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `public/${userId}/${uniqueFileName}`; // Path di dalam bucket

        try {
            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false, // Do not overwrite existing files (safety measure)
                });

            if (uploadError) {
                console.error(`Error uploading ${file.name}:`, uploadError);
                throw uploadError; // Re-throw the error to be caught by the caller
            }

            // Get public URL
            const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
            if (data.publicUrl) {
                uploadedImageUrls.push(data.publicUrl);
            } else {
                console.warn(`Could not get public URL for ${filePath}`);
                // Optionally throw an error if URL is mandatory
                // throw new Error(`Failed to get public URL for uploaded image ${filePath}`);
            }
        } catch (error) {
            // Stop the process on the first upload error
            return { uploadedImageUrls: [], error: new Error(`Gagal mengupload ${file.name}: ${error.message}`) };
        }
    }

    return { uploadedImageUrls, error: null };
}

const MAX_IMAGES = 5;
const MAX_TITLE_LENGTH = 100;
const MAX_DESC_LENGTH = 500;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // 5MB

function CreateDonationPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // --- Form State ---
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [condition, setCondition] = useState('');
    const [location, setLocation] = useState('');
    const [images, setImages] = useState([]);

    // --- UI State ---
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [errorCategories, setErrorCategories] = useState(null);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false); // For dropzone highlight
    const [validationErrors, setValidationErrors] = useState({
        title: false, category: false, condition: false, images: false,
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

    // --- Image Handling ---
    const handleImageChange = (e) => {
        handleFiles(e.target.files);
        e.target.value = null;
    };

    const handleFiles = (files) => {
        const fileList = Array.from(files);
        const addedImages = [];
        let validationError = false;

        fileList.forEach(file => {
            if (images.length + addedImages.length >= MAX_IMAGES) {
                if (!validationError) { toast.error(`Maksimal ${MAX_IMAGES} gambar.`); validationError = true; } return;
            }
            if (file.size > MAX_FILE_SIZE_BYTES) {
                toast.error(`"${file.name}" (${(file.size / 1024 / 1024).toFixed(1)}MB) > ${MAX_FILE_SIZE_MB}MB.`); validationError = true; return;
            }
            if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
                toast.error(`Tipe file "${file.name}" tidak didukung.`); validationError = true; return;
            }
            addedImages.push({ file, previewUrl: URL.createObjectURL(file), id: `${file.name}-${file.lastModified}-${Math.random()}` });
        });

        if (addedImages.length > 0) {
             setImages(prevImages => [...prevImages, ...addedImages]);
             setValidationErrors(prev => ({ ...prev, images: false }));
        }
    };

    const removeImage = (idToRemove) => {
        setImages(prevImages => {
            const imageToRemove = prevImages.find(img => img.id === idToRemove);
            if (imageToRemove) {
                URL.revokeObjectURL(imageToRemove.previewUrl);
            }
            return prevImages.filter(img => img.id !== idToRemove);
        });
    };

    // Drag and Drop Handlers
    const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); };
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); };
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    // Cleanup preview URLs on unmount
    useEffect(() => {
        return () => { images.forEach(image => URL.revokeObjectURL(image.previewUrl)); };
    }, [images]);

    // Reset validation error on input change
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
            title: !title.trim(), category: !categoryId,
            condition: !condition, images: images.length === 0,
        };
        setValidationErrors(errors);
        const hasError = Object.values(errors).some(Boolean);
        if (!user) { toast.error("Anda harus login."); return; }
        if (hasError) { toast.error("Harap periksa isian form Anda."); return; }
        // --- End Validation ---

        setLoadingSubmit(true);
        let loadingToastId = null;

        try {
            // 1. Upload Images
            const filesToUpload = images.map(img => img.file);
            if (filesToUpload.length > 0) {
                 loadingToastId = toast.loading(`Mengunggah ${filesToUpload.length} gambar...`, { duration: Infinity });
                 const { uploadedImageUrls, error: uploadError } = await uploadDonationImages(filesToUpload, user.id);
                 if (uploadError) throw uploadError;

                 toast.loading("Menyimpan data donasi...", { id: loadingToastId });

                 const donationData = {
                     id_donatur: user.id, judul: title.trim(), deskripsi: description.trim(),
                     id_kategori: parseInt(categoryId, 10), kondisi: condition,
                     lokasi_kecamatan: location.trim(), url_gambar: uploadedImageUrls, status: 'tersedia',
                 };

                 const { error: insertError } = await supabase.from('donasi').insert([donationData]);
                 if (insertError) throw new Error(`Gagal menyimpan data donasi: ${insertError.message}`);

            } else {
                 throw new Error("Tidak ada gambar yang valid untuk diunggah.");
            }

            toast.success("Donasi berhasil dibuat!", { id: loadingToastId, duration: 3000 });

            // Reset form
            setTitle(''); setDescription(''); setCategoryId(''); setCondition('');
            setLocation(''); setImages([]); setValidationErrors({ title: false, category: false, condition: false, images: false });

            setTimeout(() => { navigate('/dashboard'); }, 1500);

        } catch (error) {
             console.error("Error submitting donation:", error);
             toast.error(error.message || "Terjadi kesalahan.", { id: loadingToastId || undefined, duration: 4000 });
        } finally {
             setLoadingSubmit(false);
             if (loadingToastId && toast.loading) {
                 toast.dismiss(loadingToastId);
             }
        }
    };

    // --- Render ---
    return (
        <div className="container mx-auto py-10 md:py-14 px-4">
            <div className="flex flex-col lg:flex-row lg:gap-10 xl:gap-16">

                <div className="lg:w-2/3 xl:w-3/5 flex-shrink-0">
                    <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
                        <GiftIcon className="h-8 w-8 text-primary" />
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Formulir Donasi Barang</h1>
                    </div>

                    <form onSubmit={handleSubmit} className={`space-y-8 bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-100 transition-opacity duration-300 ease-in-out ${loadingSubmit ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>

                        {/* --- Section: Info Dasar --- */}
                        <fieldset className="space-y-5">
                             <legend className="flex items-center gap-2 text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4">
                                 <ClipboardDocumentListIcon className="h-5 w-5 text-gray-500" />
                                 Informasi Dasar
                             </legend>
                            {/* Judul */}
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">Judul Donasi <span className="text-red-500">*</span></label>
                                <input
                                    type="text" id="title" value={title}
                                    onChange={handleInputChange(setTitle, 'title')}
                                    required maxLength={MAX_TITLE_LENGTH} disabled={loadingSubmit}
                                    className={`w-full px-3.5 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out disabled:bg-gray-100 disabled:opacity-70 ${validationErrors.title ? 'border-red-500 ring-red-500/30' : 'border-gray-300'}`}
                                    placeholder="Contoh: Kemeja Lengan Panjang Pria Biru Tua"
                                    aria-invalid={validationErrors.title}
                                    aria-describedby={validationErrors.title ? "title-error" : "title-help"}
                                />
                                <div className="flex justify-between items-center mt-1.5">
                                    <p id="title-help" className="text-xs text-gray-500">Judul yang jelas membantu orang lain.</p>
                                    <p className="text-xs text-gray-400">{title.length}/{MAX_TITLE_LENGTH}</p>
                                </div>
                                {validationErrors.title && <p id="title-error" className="text-xs text-red-600 mt-1">Judul wajib diisi.</p>}
                            </div>

                            {/* Deskripsi */}
                            <div>
                                 <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi <span className="text-gray-400 text-xs">(Opsional)</span></label>
                                <textarea
                                    id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={MAX_DESC_LENGTH} disabled={loadingSubmit}
                                    className="w-full px-3.5 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out disabled:bg-gray-100 disabled:opacity-70"
                                    placeholder="Jelaskan detail barang, merek, ukuran, kondisi spesifik, alasan donasi, dll."
                                />
                                <p className="text-right text-xs text-gray-400 mt-1.5">{description.length}/{MAX_DESC_LENGTH}</p>
                            </div>
                        </fieldset>

                        {/* --- Section: Detail Barang --- */}
                         <fieldset className="space-y-5">
                             <legend className="flex items-center gap-2 text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4">
                                 <TagIcon className="h-5 w-5 text-gray-500" />
                                 Detail Barang
                             </legend>
                            {/* Kategori */}
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">Kategori <span className="text-red-500">*</span></label>
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
                                {errorCategories && <p className="text-xs text-red-600 mt-1">{errorCategories}</p>}
                                 {validationErrors.category && <p id="category-error" className="text-xs text-red-600 mt-1.5">Kategori wajib dipilih.</p>}
                            </div>

                            {/* Kondisi */}
                            <div>
                                <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1.5">Kondisi Barang <span className="text-red-500">*</span></label>
                                <select
                                    id="condition" value={condition}
                                    onChange={handleInputChange(setCondition, 'condition')}
                                     required disabled={loadingSubmit}
                                     className={`w-full px-3.5 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out bg-white disabled:bg-gray-100 disabled:opacity-70 ${validationErrors.condition ? 'border-red-500 ring-red-500/30' : 'border-gray-300'}`}
                                     aria-invalid={validationErrors.condition}
                                     aria-describedby={validationErrors.condition ? "condition-error" : ""}
                                 >
                                    <option value="" disabled>-- Pilih Kondisi --</option>
                                    <option value="Baru">Baru (Belum Pernah Dipakai)</option>
                                    <option value="Layak Pakai">Layak Pakai (Bekas, kondisi baik)</option>
                                    <option value="Perlu Perbaikan Kecil">Perlu Perbaikan Kecil</option>
                                </select>
                                 {validationErrors.condition && <p id="condition-error" className="text-xs text-red-600 mt-1.5">Kondisi wajib dipilih.</p>}
                            </div>
                        </fieldset>

                        {/* --- Section: Lokasi --- */}
                        <fieldset>
                            <legend className="flex items-center gap-2 text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4">
                                 <MapPinIcon className="h-5 w-5 text-gray-500" />
                                 Lokasi
                             </legend>
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1.5">Lokasi Pengambilan (Kecamatan)</label>
                                <input
                                    type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={100} disabled={loadingSubmit}
                                    className="w-full px-3.5 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out disabled:bg-gray-100 disabled:opacity-70"
                                    placeholder="Contoh: Tawang"
                                />
                                <p className="mt-1.5 text-xs text-gray-500">Masukkan kecamatan lokasi barang.</p>
                            </div>
                        </fieldset>

                        {/* --- Section: Upload Gambar --- */}
                         <fieldset className="space-y-4">
                             <legend className="flex items-center gap-2 text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4">
                                 <CameraIcon className="h-5 w-5 text-gray-500" />
                                 Gambar Barang <span className="text-red-500">*</span>
                             </legend>
                            <div>
                                <label htmlFor="images-input" className="block text-sm font-medium text-gray-700 mb-2">Unggah Gambar (Maks. {MAX_IMAGES}, Maks. {MAX_FILE_SIZE_MB}MB/file)</label>
                                {/* Custom Dropzone Area with Drag Feedback */}
                                 <div
                                    onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
                                    onDragOver={handleDragOver} onDrop={handleDrop}
                                    className={`relative mt-1 flex flex-col items-center justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-all duration-200 ease-in-out ${
                                        isDraggingOver ? 'border-primary bg-emerald-50/60' :
                                        validationErrors.images ? 'border-red-400' : 'border-gray-300'
                                    } ${ images.length >= MAX_IMAGES ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:border-primary/80' }`}
                                    aria-invalid={validationErrors.images}
                                    aria-describedby={validationErrors.images ? "images-error" : ""}
                                >
                                    <PhotoIcon className={`mx-auto h-10 w-10 mb-2 transition-colors ${isDraggingOver ? 'text-primary' : 'text-gray-400'}`} />
                                    <div className="flex text-sm text-gray-600">
                                        <label htmlFor="images-input" className={`relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-emerald-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary ${images.length >= MAX_IMAGES || loadingSubmit ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}>
                                            <span>{images.length === 0 ? 'Pilih file' : 'Tambah lagi'}</span>
                                            <input id="images-input" name="images" type="file" className="sr-only" multiple accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} disabled={loadingSubmit || images.length >= MAX_IMAGES} />
                                        </label>
                                        {images.length === 0 && <p className="pl-1">atau seret & lepas</p>}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP. Maks {MAX_FILE_SIZE_MB}MB per file.</p>
                                </div>
                                {validationErrors.images && <p id="images-error" className="text-xs text-red-600 mt-1.5">Minimal unggah satu gambar.</p>}
                            </div>

                            {/* Image Previews */}
                            {images.length > 0 && (
                                <div className="mt-5">
                                    <p className="text-sm font-medium text-gray-700 mb-2.5">Preview ({images.length}/{MAX_IMAGES}):</p>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                        {images.map((image) => (
                                            <div key={image.id} className="relative group aspect-square transition-shadow duration-150 hover:shadow-md">
                                                <img src={image.previewUrl} alt={image.file.name} className="h-full w-full object-cover rounded-lg border border-gray-200 shadow-sm" />
                                                <button
                                                    type="button" onClick={() => removeImage(image.id)} disabled={loadingSubmit}
                                                    className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-80 group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-600 transition-all duration-150 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed scale-90 group-hover:scale-100"
                                                    aria-label="Hapus gambar"
                                                >
                                                    <XCircleIcon className="h-5 w-5" />
                                                </button>
                                                {/* File name tooltip/truncated */}
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent text-white text-[10px] px-1.5 py-1 rounded-b-lg truncate transition-opacity duration-150 opacity-80 group-hover:opacity-100" title={image.file.name}>
                                                    {image.file.name}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                         </fieldset>

                        {/* Tombol Submit */}
                         <div className="pt-6 border-t border-gray-200 mt-6">
                            <Button type="submit" variant="primary" size="lg" className="w-full inline-flex items-center justify-center gap-2 transition-all duration-150 ease-in-out disabled:opacity-60" disabled={loadingSubmit}>
                                {loadingSubmit && <ArrowPathIcon className="animate-spin h-5 w-5 mr-1" />}
                                {loadingSubmit ? 'Memproses...' : <> <ArrowUpTrayIcon className="h-5 w-5"/> Donasikan Barang </>}
                            </Button>
                        </div>
                    </form>
                </div>

                <aside className="hidden lg:block lg:w-1/3 xl:w-2/5 mt-8 lg:mt-20">
                     <div className="sticky top-24 space-y-6 bg-emerald-50/50 p-6 rounded-lg border border-emerald-100 shadow-sm">
                        <h3 className="flex items-center gap-2 font-semibold text-lg text-emerald-800">
                           <LightBulbIcon className="h-6 w-6 text-emerald-600" />
                            Tips Membuat Donasi
                        </h3>
                        <ul className="space-y-3 text-sm text-emerald-700 list-disc list-outside pl-5 marker:text-emerald-400">
                            <li>
                                <span className="font-medium">Judul Jelas:</span> Gunakan nama barang yang spesifik (misal: "Blender Miyako Bekas").
                           </li>
                            <li>
                               <span className="font-medium">Foto Berkualitas:</span> Ambil foto dari berbagai sudut dengan pencahayaan baik. Tunjukkan kondisi asli barang.
                           </li>
                            <li>
                                <span className="font-medium">Deskripsi Jujur:</span> Jelaskan kondisi barang apa adanya, termasuk jika ada kekurangan/kerusakan kecil.
                            </li>
                            <li>
                                <span className="font-medium">Lokasi Tepat:</span> Pastikan kecamatan yang dimasukkan sudah benar untuk memudahkan calon penerima.
                           </li>
                        </ul>
                         <div className="mt-5 pt-4 border-t border-emerald-200/60">
                             <h4 className="flex items-center gap-2 font-semibold text-md text-emerald-800 mb-2">
                                <CheckBadgeIcon className="h-5 w-5 text-emerald-600"/>
                                Setelah Donasi Dibuat
                             </h4>
                             <p className="text-sm text-emerald-700">
                                 Donasi Anda akan tampil di halaman pencarian. Anda akan menerima notifikasi jika ada yang tertarik dan mengajukan permintaan.
                             </p>
                         </div>
                    </div>
                </aside>

            </div>
        </div>
    );
}

export default CreateDonationPage; 