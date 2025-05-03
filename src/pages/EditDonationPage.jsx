import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { toast } from 'react-hot-toast';
import {
    ArrowPathIcon, PhotoIcon, XMarkIcon, ArrowUpTrayIcon, XCircleIcon,
    ClipboardDocumentListIcon, TagIcon, MapPinIcon, CameraIcon,
    GiftIcon, PencilIcon, LightBulbIcon, CheckBadgeIcon, ArrowSmallLeftIcon
} from '@heroicons/react/24/outline';

// Constants from CreateDonationPage (adapt if needed)
const MAX_IMAGES = 5;
const MAX_TITLE_LENGTH = 100;
const MAX_DESC_LENGTH = 500;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // 5MB

// Helper function to fetch categories (can be reused or moved to utils)
async function fetchCategories() {
    const { data, error } = await supabase.from('kategori').select('id, nama').order('nama', { ascending: true });
    if (error) {
        console.error("Error fetching categories:", error);
        toast.error("Gagal memuat kategori.");
        return [];
    }
    return data || [];
}

// Helper function to upload images (similar to CreateDonationPage)
async function uploadNewImages(files, userId) {
    if (!files || files.length === 0) {
        return { uploadedImageUrls: [], error: null };
    }
    if (!userId) {
        return { uploadedImageUrls: [], error: new Error("User ID diperlukan untuk upload gambar.") };
    }

    const uploadedImageUrls = [];
    const bucketName = 'donasi-images'; // Make sure this matches your bucket name

    for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const uniqueFileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `public/${userId}/${uniqueFileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
            if (data.publicUrl) {
                uploadedImageUrls.push(data.publicUrl);
            } else {
                console.warn(`Could not get public URL for ${filePath}`);
                // Potentially throw error if public URL is critical
            }
        } catch (error) {
            return { uploadedImageUrls: [], error: new Error(`Gagal mengupload ${file.name}: ${error.message}`) };
        }
    }
    return { uploadedImageUrls, error: null };
}

// Helper function to delete images from storage
async function deleteStoredImages(urlsToDelete, userId) {
    if (!urlsToDelete || urlsToDelete.length === 0 || !userId) {
        return { error: null };
    }
    const bucketName = 'donasi-images';
    // Extract file paths from URLs - assumes URLs are consistent
    const filePathsToDelete = urlsToDelete.map(url => {
        try {
            const urlParts = new URL(url);
            // Path usually starts after /public/user_id/filename.ext
            const pathSegments = urlParts.pathname.split('/');
            // Find 'public' index and take segments after it
            const publicIndex = pathSegments.findIndex(segment => segment === 'public');
            if (publicIndex !== -1 && pathSegments.length > publicIndex + 1) {
                // Join the rest of the path segments, including the user ID folder
                return pathSegments.slice(publicIndex + 1).join('/');
            }
            console.warn("Could not extract path correctly from URL:", url);
            return null; // Return null for invalid URLs
        } catch (e) {
            console.error("Error parsing URL for deletion:", url, e);
            return null; // Return null if URL parsing fails
        }
    }).filter(path => path !== null); // Filter out any nulls from failed extractions

    if (filePathsToDelete.length === 0) {
        console.log("No valid paths found to delete.");
        return { error: null }; // Nothing to delete
    }

    console.log("Attempting to delete paths:", filePathsToDelete);

    try {
        const { data, error } = await supabase.storage
            .from(bucketName)
            .remove(filePathsToDelete);

        if (error) {
            console.error("Supabase storage deletion error:", error);
            // Decide how critical this is. Maybe return error but don't block update?
            return { error: new Error(`Gagal menghapus beberapa gambar: ${error.message}`) };
        }
        console.log("Supabase storage deletion success:", data);
        return { error: null };
    } catch (error) {
         console.error("Unexpected error during image deletion:", error);
         return { error: new Error(`Kesalahan tak terduga saat menghapus gambar: ${error.message}`) };
    }
}


function EditDonationPage() {
    const { donationId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // --- State ---
    const [donation, setDonation] = useState(null); // Original donation data
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true); // For category dropdown
    const [errorCategories, setErrorCategories] = useState(null);

    // Form fields state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [condition, setCondition] = useState(''); // Added condition state
    const [location, setLocation] = useState(''); // Using Kecamatan only for simplicity, like Create page

    // Image Handling State
    const [initialImages, setInitialImages] = useState([]); // URLs from DB
    const [newImages, setNewImages] = useState([]); // Files staged for upload { file, previewUrl, id }
    const [imagesToDelete, setImagesToDelete] = useState([]); // URLs marked for deletion

    // UI State
    const [loading, setLoading] = useState(true); // Overall page load
    const [saving, setSaving] = useState(false); // Form submission state
    const [error, setError] = useState(null); // General page error
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [validationErrors, setValidationErrors] = useState({
        title: false, category: false, condition: false, images: false, // Added condition validation
    });

    // --- Fetch Data ---
    useEffect(() => {
        const loadData = async () => {
            if (!donationId || !user) {
                setError("Donasi tidak ditemukan atau Anda tidak terautentikasi.");
                setLoading(false); return;
            }
            setLoading(true); setError(null); setLoadingCategories(true); setErrorCategories(null);

            try {
                // Fetch categories first
                const fetchedCategories = await fetchCategories();
                setCategories(fetchedCategories);
                setLoadingCategories(false);

                // Fetch donation details
                const { data: donationData, error: donationError } = await supabase
                    .from('donasi')
                    .select('*, kategori(id, nama)') // Select related category info if needed
                    .eq('id', donationId)
                    .eq('id_donatur', user.id) // Ensure ownership
                    .single();

                if (donationError) {
                    if (donationError.code === 'PGRST116') {
                        throw new Error("Donasi tidak ditemukan atau Anda tidak memiliki izin.");
                    }
                    throw donationError;
                }
                if (!donationData) throw new Error("Donasi tidak ditemukan.");
                if (donationData.status === 'didonasikan') {
                    toast.error("Donasi yang sudah selesai tidak dapat diedit.");
                    navigate('/dashboard'); return;
                }

                setDonation(donationData);
                // Populate form states
                setTitle(donationData.judul || '');
                setDescription(donationData.deskripsi || '');
                setCategoryId(donationData.id_kategori || '');
                setCondition(donationData.kondisi || ''); // Populate condition
                setLocation(donationData.lokasi_kecamatan || ''); // Use kecamatan field
                setInitialImages(donationData.url_gambar || []);

            } catch (err) {
                console.error("Error loading donation data:", err);
                setError(err.message || "Gagal memuat data donasi.");
                setDonation(null);
            } finally {
                setLoading(false);
                // Ensure category loading is also false if error happened before categories fetched
                if (loadingCategories) setLoadingCategories(false);
            }
        };
        loadData();
    }, [donationId, user, navigate]); // Removed loadingCategories dependency

    // --- Image Handling Logic (adapted from CreateDonationPage) ---
    const handleFiles = useCallback((files) => {
        const fileList = Array.from(files);
        const addedImages = [];
        let validationError = false;
        const currentTotalImages = initialImages.length - imagesToDelete.length + newImages.length;

        fileList.forEach(file => {
            if (currentTotalImages + addedImages.length >= MAX_IMAGES) {
                if (!validationError) { toast.error(`Maksimal ${MAX_IMAGES} gambar.`); validationError = true; } return;
            }
            if (file.size > MAX_FILE_SIZE_BYTES) {
                toast.error(`"${file.name}" (${(file.size / 1024 / 1024).toFixed(1)}MB) > ${MAX_FILE_SIZE_MB}MB.`); validationError = true; return;
            }
            if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
                toast.error(`Tipe file "${file.name}" tidak didukung.`); validationError = true; return;
            }
            // Use a more robust unique ID for previews
            addedImages.push({ file, previewUrl: URL.createObjectURL(file), id: `${file.name}-${file.lastModified}-${Math.random()}` });
        });

        if (addedImages.length > 0) {
             setNewImages(prev => [...prev, ...addedImages]);
             setValidationErrors(prev => ({ ...prev, images: false })); // Clear image validation error if new ones added
        }
    }, [initialImages.length, imagesToDelete.length, newImages.length]); // Dependencies for calculating currentTotalImages

    const handleImageInputChange = (e) => {
        handleFiles(e.target.files);
        e.target.value = null; // Reset input to allow selecting same file again
    };

    // Remove a newly staged image (from preview)
    const removeNewImage = (idToRemove) => {
        setNewImages(prev => {
            const imageToRemove = prev.find(img => img.id === idToRemove);
            if (imageToRemove) {
                URL.revokeObjectURL(imageToRemove.previewUrl); // Clean up blob URL
            }
            return prev.filter(img => img.id !== idToRemove);
        });
         // Re-check image validation after removing
         const remainingTotal = initialImages.length - imagesToDelete.length + (newImages.length - 1);
         if (remainingTotal === 0) {
             setValidationErrors(prev => ({ ...prev, images: true }));
         }
    };

    // Mark an existing image (URL from DB) for deletion
    const markImageForDeletion = (imageUrl) => {
        if (!imagesToDelete.includes(imageUrl)) {
            setImagesToDelete(prev => [...prev, imageUrl]);
            // Re-check image validation
             const remainingTotal = initialImages.length - (imagesToDelete.length + 1) + newImages.length;
             if (remainingTotal === 0) {
                 setValidationErrors(prev => ({ ...prev, images: true }));
             } else {
                 setValidationErrors(prev => ({ ...prev, images: false })); // Ensure error is cleared if still > 0
             }
        }
    };

    // Unmark an existing image for deletion
    const unmarkImageForDeletion = (imageUrl) => {
        setImagesToDelete(prev => prev.filter(url => url !== imageUrl));
         // Always clear validation error when un-marking, as count increases or stays >= 1
         setValidationErrors(prev => ({ ...prev, images: false }));
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

    // Cleanup preview URLs on unmount or when newImages change
    useEffect(() => {
        return () => { newImages.forEach(image => URL.revokeObjectURL(image.previewUrl)); };
    }, [newImages]);

    // Generic input change handler for simple fields + validation reset
    const handleInputChange = (setter, fieldName) => (e) => {
         setter(e.target.value);
         if (validationErrors[fieldName]) {
             setValidationErrors(prev => ({ ...prev, [fieldName]: false }));
         }
     };

    // --- Form Submission ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user || !donation) return;

        // --- Client-side Validation ---
        const currentTotalImages = initialImages.length - imagesToDelete.length + newImages.length;
        const errors = {
            title: !title.trim(),
            category: !categoryId,
            condition: !condition, // Added condition validation
            images: currentTotalImages === 0,
        };
        setValidationErrors(errors);
        const hasError = Object.values(errors).some(Boolean);
        if (hasError) { toast.error("Harap periksa isian form Anda."); return; }
        // --- End Validation ---

        setSaving(true);
        let loadingToastId = toast.loading('Memproses perubahan...');

        let finalImageUrls = [...initialImages.filter(url => !imagesToDelete.includes(url))];
        let uploadErrorOccurred = false;
        let deleteErrorOccurred = false;

        try {
            // 1. Delete marked images from storage
            if (imagesToDelete.length > 0) {
                toast.loading('Menghapus gambar lama...', { id: loadingToastId });
                const { error: deleteError } = await deleteStoredImages(imagesToDelete, user.id);
                if (deleteError) {
                    console.warn("Error during image deletion, continuing update:", deleteError);
                    toast.error('Sebagian gambar lama gagal dihapus, data tetap diperbarui.', { id: loadingToastId });
                    // We'll proceed but maybe log this or notify admin
                    deleteErrorOccurred = true; // Mark that an error happened
                }
                // No need to update finalImageUrls here, already filtered
            }

            // 2. Upload new images
            if (newImages.length > 0) {
                toast.loading(`Mengupload ${newImages.length} gambar baru...`, { id: loadingToastId });
                const filesToUpload = newImages.map(img => img.file);
                const { uploadedImageUrls: newlyUploadedUrls, error: uploadError } = await uploadNewImages(filesToUpload, user.id);

                if (uploadError) {
                    // If upload fails, stop the whole process? Or proceed with old images?
                    // Let's stop and report error for now.
                    uploadErrorOccurred = true;
                    throw uploadError; // Throw to be caught in the catch block
                }
                finalImageUrls = [...finalImageUrls, ...newlyUploadedUrls];
            }

            // 3. Update donation data in the database
            toast.loading('Menyimpan data donasi...', { id: loadingToastId });
            const dataToUpdate = {
                judul: title.trim(),
                deskripsi: description.trim(),
                id_kategori: parseInt(categoryId, 10),
                kondisi: condition, // Include condition
                lokasi_kecamatan: location.trim(), // Use kecamatan field
                url_gambar: finalImageUrls,
                updated_at: new Date().toISOString(),
            };

            const { error: updateError } = await supabase
                .from('donasi')
                .update(dataToUpdate)
                .eq('id', donationId)
                .eq('id_donatur', user.id); // Re-check ownership

            if (updateError) {
                throw new Error(`Gagal menyimpan pembaruan: ${updateError.message}`);
            }

            // Success message
            const successMessage = deleteErrorOccurred
                ? 'Donasi diperbarui (beberapa gambar lama gagal dihapus).'
                : 'Donasi berhasil diperbarui!';
            toast.success(successMessage, { id: loadingToastId, duration: 4000 });

            // Reset temporary states
            setNewImages([]);
            setImagesToDelete([]);
            setValidationErrors({ title: false, category: false, condition: false, images: false });

            // Navigate back to donation detail page after a short delay
            setTimeout(() => { navigate(`/donations/${donationId}`); }, 1500);

        } catch (err) {
            console.error("Error updating donation:", err);
            const errorMessage = uploadErrorOccurred
                ? `Gagal mengupload gambar: ${err.message}`
                : err.message || "Gagal menyimpan perubahan.";
             toast.error(errorMessage, { id: loadingToastId || undefined, duration: 5000 });
             // If upload failed, maybe keep newImages staged? For now, we clear them.
        } finally {
            setSaving(false);
            // Dismiss loading toast only if it wasn't replaced by success/error with the same ID
             if (loadingToastId && toast.loading) {
                 // Check if a toast with this ID still exists and is loading
                 // This is tricky, react-hot-toast might have already replaced it.
                 // A safer approach might be not to dismiss here if success/error uses the ID.
                 // toast.dismiss(loadingToastId); // Potentially removes success/error toast too soon
             }
        }
    };

    // --- Render Logic ---
    if (loading) {
        return <div className="container mx-auto py-10 px-4 text-center"><ArrowPathIcon className="h-6 w-6 inline animate-spin mr-2" /> Memuat data donasi...</div>;
    }
    if (error) {
        return <div className="container mx-auto py-10 px-4 text-center text-red-600 bg-red-50 p-4 rounded border border-red-200">{error}</div>;
    }
    if (!donation) {
        return <div className="container mx-auto py-10 px-4 text-center text-gray-500">Donasi tidak ditemukan atau Anda tidak punya akses.</div>;
    }

    const currentTotalImages = initialImages.length - imagesToDelete.length + newImages.length;

    return (
        <div className="container mx-auto py-10 md:py-14 px-4">
             <div className="flex flex-col lg:flex-row lg:gap-10 xl:gap-16">

                 {/* --- Form Section --- */}
                <div className="lg:w-2/3 xl:w-3/5 flex-shrink-0">
                     <div className="flex items-center justify-start gap-3 mb-8">
                        <PencilIcon className="h-8 w-8 text-primary" />
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Edit Donasi</h1>
                    </div>

                    <form onSubmit={handleSubmit} className={`space-y-8 bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-100 transition-opacity duration-300 ease-in-out ${saving ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>

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
                                     required maxLength={MAX_TITLE_LENGTH} disabled={saving}
                                     className={`w-full px-3.5 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out disabled:bg-gray-100 disabled:opacity-70 ${validationErrors.title ? 'border-red-500 ring-red-500/30' : 'border-gray-300'}`}
                                     placeholder="Contoh: Kemeja Lengan Panjang Pria Biru Tua"
                                     aria-invalid={validationErrors.title}
                                     aria-describedby={validationErrors.title ? "title-error" : "title-help"}
                                 />
                                 <div className="flex justify-between items-center mt-1.5">
                                     <p id="title-help" className="text-xs text-gray-500">Gunakan judul yang jelas.</p>
                                     <p className="text-xs text-gray-400">{title.length}/{MAX_TITLE_LENGTH}</p>
                                 </div>
                                 {validationErrors.title && <p id="title-error" className="text-xs text-red-600 mt-1">Judul wajib diisi.</p>}
                             </div>

                             {/* Deskripsi */}
                             <div>
                                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi <span className="text-gray-400 text-xs">(Opsional)</span></label>
                                 <textarea
                                     id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={MAX_DESC_LENGTH} disabled={saving}
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
                                     required disabled={loadingCategories || saving}
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

                            {/* Kondisi - Added */}
                            <div>
                                <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1.5">Kondisi Barang <span className="text-red-500">*</span></label>
                                <select
                                    id="condition" value={condition}
                                    onChange={handleInputChange(setCondition, 'condition')}
                                     required disabled={saving}
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
                                     type="text" id="location" value={location} onChange={handleInputChange(setLocation, 'location')} // No specific validation needed here now
                                     maxLength={100} disabled={saving}
                                     className="w-full px-3.5 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out disabled:bg-gray-100 disabled:opacity-70"
                                     placeholder="Contoh: Lowokwaru"
                                 />
                                 <p className="mt-1.5 text-xs text-gray-500">Masukkan kecamatan lokasi barang.</p>
                             </div>
                         </fieldset>

                         {/* --- Section: Upload Gambar (Revamped) --- */}
                         <fieldset className="space-y-4">
                              <legend className="flex items-center gap-2 text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4">
                                  <CameraIcon className="h-5 w-5 text-gray-500" />
                                  Gambar Barang <span className="text-red-500">*</span>
                              </legend>
                             <div>
                                 <label htmlFor="images-input" className="block text-sm font-medium text-gray-700 mb-2">Kelola Gambar (Maks. {MAX_IMAGES} total, Maks. {MAX_FILE_SIZE_MB}MB/file baru)</label>

                                  {/* Existing Images Preview & Delete Option */}
                                  {initialImages.length > 0 && (
                                      <div className="mb-4">
                                           <p className="text-xs text-gray-600 mb-2">Gambar saat ini:</p>
                                           <div className="flex flex-wrap gap-3">
                                              {initialImages.map((imageUrl, index) => {
                                                   const isMarkedForDeletion = imagesToDelete.includes(imageUrl);
                                                   return (
                                                      <div key={`initial-${index}`} className="relative group w-20 h-20 rounded-md border border-gray-200 overflow-hidden transition-shadow duration-150 hover:shadow-md">
                                                          <img
                                                              src={imageUrl} alt={`Gambar ${index + 1}`}
                                                              className={`w-full h-full object-cover transition-opacity duration-200 ${isMarkedForDeletion ? 'opacity-30' : ''}`}
                                                              loading="lazy"
                                                          />
                                                          {isMarkedForDeletion && (
                                                              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                                                   <span className="text-white text-[10px] font-semibold px-1 py-0.5 rounded bg-red-600/80">Dihapus</span>
                                                              </div>
                                                          )}
                                                          <div className={`absolute top-1 right-1 transition-opacity duration-150 ${isMarkedForDeletion ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                              {!isMarkedForDeletion ? (
                                                                  <button
                                                                      type="button" onClick={() => markImageForDeletion(imageUrl)} disabled={saving}
                                                                      className="p-0.5 bg-red-600 text-white rounded-full shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-50"
                                                                      title="Hapus gambar ini"
                                                                  > <XMarkIcon className="h-4 w-4" /> </button>
                                                              ) : (
                                                                   <button
                                                                      type="button" onClick={() => unmarkImageForDeletion(imageUrl)} disabled={saving}
                                                                      className="p-0.5 bg-yellow-500 text-white rounded-full shadow hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-yellow-500 disabled:opacity-50"
                                                                      title="Batal hapus"
                                                                   > <ArrowPathIcon className="h-4 w-4" /> </button>
                                                              )}
                                                           </div>
                                                           {!isMarkedForDeletion && (
                                                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent text-white text-[9px] px-1 py-0.5 rounded-b-md truncate transition-opacity duration-150 opacity-0 group-hover:opacity-100" title={imageUrl.substring(imageUrl.lastIndexOf('/') + 1)}>
                                                                   {imageUrl.substring(imageUrl.lastIndexOf('/') + 1)}
                                                              </div>
                                                           )}
                                                      </div>
                                                  );
                                               })}
                                           </div>
                                      </div>
                                  )}

                                 {/* Dropzone Area */}
                                  <div
                                     onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
                                     onDragOver={handleDragOver} onDrop={handleDrop}
                                     className={`relative mt-3 flex flex-col items-center justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-all duration-200 ease-in-out ${
                                         isDraggingOver ? 'border-primary bg-emerald-50/60' :
                                         validationErrors.images ? 'border-red-400' : 'border-gray-300'
                                     } ${ currentTotalImages >= MAX_IMAGES ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:border-primary/80' }`}
                                     aria-invalid={validationErrors.images}
                                     aria-describedby={validationErrors.images ? "images-error" : ""}
                                 >
                                     <PhotoIcon className={`mx-auto h-10 w-10 mb-2 transition-colors ${isDraggingOver ? 'text-primary' : 'text-gray-400'}`} />
                                     <div className="flex text-sm text-gray-600">
                                         <label htmlFor="images-input" className={`relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-emerald-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary ${currentTotalImages >= MAX_IMAGES || saving ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}>
                                             <span>{currentTotalImages === 0 ? 'Pilih file baru' : 'Tambah gambar baru'}</span>
                                             <input id="images-input" name="images" type="file" className="sr-only" multiple accept="image/png, image/jpeg, image/webp" onChange={handleImageInputChange} disabled={saving || currentTotalImages >= MAX_IMAGES} />
                                         </label>
                                         {currentTotalImages === 0 && <p className="pl-1">atau seret & lepas</p>}
                                     </div>
                                     <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP. Maks {MAX_FILE_SIZE_MB}MB per file.</p>
                                     <p className="text-xs font-medium text-gray-600 mt-1">Slot gambar tersisa: {Math.max(0, MAX_IMAGES - currentTotalImages)}</p>
                                 </div>
                                 {validationErrors.images && <p id="images-error" className="text-xs text-red-600 mt-1.5">Minimal harus ada satu gambar.</p>}

                                 {/* New Images Preview */}
                                 {newImages.length > 0 && (
                                     <div className="mt-5">
                                         <p className="text-sm font-medium text-gray-700 mb-2.5">Gambar baru (akan diupload):</p>
                                         <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                             {newImages.map((image) => (
                                                 <div key={image.id} className="relative group aspect-square transition-shadow duration-150 hover:shadow-md">
                                                     <img src={image.previewUrl} alt={image.file.name} className="h-full w-full object-cover rounded-lg border-2 border-blue-300 shadow-sm" />
                                                     <button
                                                         type="button" onClick={() => removeNewImage(image.id)} disabled={saving}
                                                         className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-80 group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-600 transition-all duration-150 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed scale-90 group-hover:scale-100"
                                                         aria-label="Hapus gambar baru"
                                                     >
                                                         <XCircleIcon className="h-5 w-5" />
                                                     </button>
                                                     <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent text-white text-[10px] px-1.5 py-1 rounded-b-lg truncate transition-opacity duration-150 opacity-80 group-hover:opacity-100" title={image.file.name}>
                                                         {image.file.name}
                                                     </div>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 )}
                             </div>
                         </fieldset>

                         {/* --- Submit Button --- */}
                         <div className="pt-6 border-t border-gray-200 mt-6 flex justify-end gap-3">
                             <Button
                                 type="button" variant="secondary" size="lg"
                                 onClick={() => navigate(-1)} // Updated to go back
                                 disabled={saving}
                                 className="inline-flex items-center gap-1.5"
                             >
                                 <ArrowSmallLeftIcon className="h-5 w-5"/> Batal
                             </Button>
                             <Button
                                 type="submit" variant="primary" size="lg"
                                 className="inline-flex items-center justify-center gap-2 transition-all duration-150 ease-in-out disabled:opacity-60"
                                 disabled={saving}
                             >
                                 {saving && <ArrowPathIcon className="animate-spin h-5 w-5 mr-1" />}
                                 {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                             </Button>
                         </div>
                     </form>
                 </div>

                 {/* --- Aside/Tips Section (Adapted for Editing) --- */}
                 <aside className="hidden lg:block lg:w-1/3 xl:w-2/5 mt-8 lg:mt-20">
                      <div className="sticky top-24 space-y-6 bg-emerald-50/50 p-6 rounded-lg border border-emerald-100 shadow-sm">
                         <h3 className="flex items-center gap-2 font-semibold text-lg text-emerald-800">
                            <LightBulbIcon className="h-6 w-6 text-emerald-600" />
                             Tips Mengedit Donasi
                         </h3>
                         <ul className="space-y-3 text-sm text-emerald-700 list-disc list-outside pl-5 marker:text-emerald-400">
                             <li>
                                <span className="font-medium">Perbarui Info:</span> Pastikan semua informasi (judul, deskripsi, kondisi) masih akurat.
                            </li>
                             <li>
                                <span className="font-medium">Ganti Gambar:</span> Jika perlu, ganti gambar lama dengan yang lebih baru atau jelas. Hapus gambar yang tidak relevan.
                            </li>
                             <li>
                                 <span className="font-medium">Detail Kondisi:</span> Jika kondisi barang berubah, perbarui pilihan kondisi agar sesuai.
                             </li>
                             <li>
                                 <span className="font-medium">Lokasi:</span> Pastikan lokasi pengambilan masih sama.
                            </li>
                         </ul>
                          <div className="mt-5 pt-4 border-t border-emerald-200/60">
                              <h4 className="flex items-center gap-2 font-semibold text-md text-emerald-800 mb-2">
                                 <CheckBadgeIcon className="h-5 w-5 text-emerald-600"/>
                                 Setelah Disimpan
                              </h4>
                              <p className="text-sm text-emerald-700">
                                  Perubahan pada donasi Anda akan langsung terlihat oleh pengguna lain. Permintaan yang sedang berjalan tidak akan terpengaruh.
                              </p>
                          </div>
                     </div>
                 </aside>
             </div>
        </div>
    );
}

export default EditDonationPage; 