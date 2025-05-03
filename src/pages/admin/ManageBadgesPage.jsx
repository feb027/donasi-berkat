import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { supabase } from '../../lib/supabaseClient'; // Adjust if needed
import { toast } from 'react-hot-toast';
import {
    SparklesIcon, // Main icon for the page
    PlusIcon, // Add button
    PencilIcon, // Edit button
    TrashIcon, // Delete button
    TagIcon, // Placeholder icon for badge preview
    ArrowPathIcon,
    XMarkIcon,
    CheckIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import * as HeroIconsOutline from '@heroicons/react/24/outline'; // Import all outline icons
import Button from '../../components/ui/Button';
import { Dialog, Transition } from '@headlessui/react';

// Helper function to get HeroIcon component by name
const getIconComponent = (iconName) => {
    const IconComponent = HeroIconsOutline[iconName];
    return IconComponent || TagIcon; // Return TagIcon as fallback
};

// --- Define a list of common Tailwind text color classes for the palette ---
const badgeColorClasses = [
    'text-gray-500', 'text-slate-500', 
    'text-red-500', 'text-orange-500', 'text-amber-500', 'text-yellow-500',
    'text-lime-500', 'text-green-500', 'text-emerald-500', 'text-teal-500',
    'text-cyan-500', 'text-sky-500', 'text-blue-500', 'text-indigo-500',
    'text-violet-500', 'text-purple-500', 'text-fuchsia-500', 'text-pink-500', 'text-rose-500'
];

// --- Get list of Outline HeroIcon names (excluding internal/utility exports if any) ---
const availableIconNames = Object.keys(HeroIconsOutline).filter(
    name => name.endsWith('Icon') && /^[A-Z]/.test(name) 
);

// --- Skeleton Loader --- 
function BadgesSkeleton() {
    return (
        <div className="animate-pulse space-y-4">
             <div className="flex justify-between items-center">
                <div className="h-8 bg-gray-300 rounded w-1/3"></div>
                <div className="h-10 bg-gray-300 rounded w-32"></div>
             </div>
             <div className="bg-white shadow-xl rounded-xl border border-gray-100 p-4">
                 {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between border-b py-3 last:border-b-0">
                        <div className="flex items-center gap-4">
                             <div className="h-8 w-8 bg-gray-300 rounded"></div> {/* Icon */}
                             <div className="space-y-1">
                                 <div className="h-5 bg-gray-300 rounded w-32"></div> {/* Name */}
                                 <div className="h-3 bg-gray-300 rounded w-48"></div> {/* Desc */}
                             </div>
                        </div>
                         <div className="flex items-center gap-3">
                             <div className="h-6 w-6 bg-gray-300 rounded"></div> {/* Edit */}
                             <div className="h-6 w-6 bg-gray-300 rounded"></div> {/* Delete */}
                         </div>
                    </div>
                 ))}
             </div>
        </div>
    );
}

// --- Add Badge Modal (Improved UX) ---
function AddBadgeModal({ isOpen, onClose, onAdded, isLoading }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedIconName, setSelectedIconName] = useState(availableIconNames[0] || ''); // Default to first icon
    const [selectedColorClass, setSelectedColorClass] = useState(badgeColorClasses[0]); // Default color
    const [error, setError] = useState(null);
    const [iconSearchTerm, setIconSearchTerm] = useState(''); // State for icon search

    // Filter icons based on search term
    const filteredIcons = availableIconNames.filter(iconName =>
        iconName.toLowerCase().includes(iconSearchTerm.toLowerCase())
    );

    // Get the component for the selected icon
    const SelectedIconComponent = getIconComponent(selectedIconName);

    const resetForm = () => {
        setName(''); 
        setDescription(''); 
        setSelectedIconName(availableIconNames[0] || ''); 
        setSelectedColorClass(badgeColorClasses[0]); 
        setError(null);
        setIconSearchTerm('');
    };

    const handleClose = () => {
        if (isLoading) return;
        resetForm();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!name || !description || !selectedIconName || !selectedColorClass) {
            setError('Nama, Deskripsi, Ikon, dan Warna wajib dipilih.');
            return;
        }
        
        const newBadge = { 
            name, 
            description, 
            icon_name: selectedIconName, 
            color_class: selectedColorClass 
        };

        try {
            // Set loading state (might need to be passed from parent or handled locally)
            // Assuming isLoading prop controls the button state
            const { error: insertError } = await supabase
                .from('badges')
                .insert(newBadge);

            if (insertError) throw insertError;

            toast.success(`Badge "${name}" berhasil ditambahkan!`);
            onAdded(); // Callback to refresh list
            handleClose(); // Close and reset form

        } catch (err) {
            console.error("Error adding badge:", err);
            setError(err.message || 'Gagal menambahkan badge.');
            toast.error(`Gagal: ${err.message}`);
        } 
        // Ensure loading state is reset if handled locally
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[80]" onClose={handleClose}>
                {/* Backdrop */}
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/40 backdrop-blur-sm" /></Transition.Child>

                {/* Modal Content */}
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            {/* --- Increased max-w for more space --- */}
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 flex items-center gap-2">
                                     <PlusIcon className="h-6 w-6 text-emerald-600"/> Tambah Badge Baru
                                </Dialog.Title>
                                <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" disabled={isLoading}><XMarkIcon className="h-5 w-5" /></button>

                                <form onSubmit={handleSubmit} className="mt-6 space-y-5"> {/* Increased spacing */}
                                    {error && <div className="rounded-md bg-red-50 p-3 border border-red-200 text-sm text-red-700">Error: {error}</div>}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5"> {/* Grid layout */}
                                        {/* Name */}
                                        <div>
                                            <label htmlFor="badge-name" className="block text-sm font-medium text-gray-700 mb-1">Nama Badge</label>
                                            <input type="text" id="badge-name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"/>
                                        </div>
                                        {/* Color Palette */}
                                         <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-1">Warna Ikon</label>
                                             <div className="flex flex-wrap gap-2 items-center rounded-md border border-gray-300 p-2 bg-gray-50/50">
                                                 {badgeColorClasses.map(color => {
                                                      const IconComp = SelectedIconComponent || TagIcon; // Use selected or fallback
                                                     return (
                                                        <button
                                                            key={color}
                                                            type="button"
                                                            onClick={() => setSelectedColorClass(color)}
                                                            className={`h-7 w-7 rounded-full flex items-center justify-center ring-2 ring-offset-1 transition ${selectedColorClass === color ? 'ring-emerald-500' : 'ring-transparent hover:ring-gray-300'}`}
                                                            title={color}
                                                            disabled={isLoading}
                                                        >
                                                             <IconComp className={`h-4 w-4 ${color}`} />
                                                        </button>
                                                    );
                                                 })}
                                             </div>
                                         </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label htmlFor="badge-desc" className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                                        <textarea id="badge-desc" value={description} onChange={(e) => setDescription(e.target.value)} required disabled={isLoading} rows={3} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"></textarea>
                                    </div>

                                     {/* Icon Selector */} 
                                     <div>
                                         <label htmlFor="icon-search" className="block text-sm font-medium text-gray-700 mb-1">Pilih Ikon</label>
                                         <div className="flex gap-3 items-center mb-2">
                                             {/* Search Input */}
                                             <input 
                                                 type="text" 
                                                 id="icon-search" 
                                                 placeholder="Cari ikon..." 
                                                 value={iconSearchTerm}
                                                 onChange={(e) => setIconSearchTerm(e.target.value)}
                                                 className="flex-grow rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                                                 disabled={isLoading}
                                            />
                                             {/* Live Preview */}
                                             <div className="flex-shrink-0 text-center">
                                                 <span className="inline-block p-2 border rounded-md bg-gray-50" title={`Preview: ${selectedIconName}`}>
                                                     {SelectedIconComponent ? <SelectedIconComponent className={`h-6 w-6 ${selectedColorClass || 'text-gray-500'}`}/> : <TagIcon className="h-6 w-6 text-gray-400"/>}
                                                 </span>
                                             </div>
                                         </div>
                                         {/* Icon Grid */} 
                                         <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 bg-gray-50/30">
                                             {filteredIcons.map(iconName => {
                                                 const IconComponent = getIconComponent(iconName);
                                                 const isSelected = selectedIconName === iconName;
                                                 return (
                                                     <button
                                                         key={iconName}
                                                         type="button"
                                                         onClick={() => setSelectedIconName(iconName)}
                                                         className={`p-2 rounded-md flex items-center justify-center transition ${isSelected ? 'bg-emerald-100 ring-2 ring-emerald-300' : 'bg-white hover:bg-gray-100'}`}
                                                         title={iconName}
                                                         disabled={isLoading}
                                                     >
                                                         <IconComponent className={`h-5 w-5 ${selectedColorClass || 'text-gray-500'}`} />
                                                     </button>
                                                 );
                                             })}
                                             {filteredIcons.length === 0 && <p className="col-span-full text-center text-sm text-gray-500 py-4">Ikon tidak ditemukan.</p>}
                                         </div>
                                     </div>

                                    {/* Submit Button */}
                                    <div className="mt-6 flex justify-end gap-3 border-t pt-5">
                                        <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>Batal</Button>
                                        <Button type="submit" variant="primary" disabled={isLoading} className="inline-flex items-center justify-center min-w-[120px]">
                                             {isLoading ? <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" /> : <PlusIcon className="h-5 w-5 mr-1.5" />}
                                            {isLoading ? 'Menyimpan...' : 'Tambah Badge'}
                                        </Button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

// --- Edit Badge Modal (Improved UX) ---
function EditBadgeModal({ isOpen, onClose, onEdited, badge, isLoading }) {
    // State for form fields, initialized with badge data
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedIconName, setSelectedIconName] = useState('');
    const [selectedColorClass, setSelectedColorClass] = useState('text-gray-500');
    const [error, setError] = useState(null);
    const [iconSearchTerm, setIconSearchTerm] = useState('');

    // Filter icons based on search term
    const filteredIcons = availableIconNames.filter(iconName =>
        iconName.toLowerCase().includes(iconSearchTerm.toLowerCase())
    );

    // Get the component for the selected icon
    const SelectedIconComponent = getIconComponent(selectedIconName);

    // Effect to populate form when badge data changes
    useEffect(() => {
        if (badge) {
            setName(badge.name || '');
            setDescription(badge.description || '');
            setSelectedIconName(badge.icon_name || (availableIconNames[0] || ''));
            setSelectedColorClass(badge.color_class || badgeColorClasses[0]);
            setError(null);
            setIconSearchTerm('');
        } else {
             setName(''); setDescription(''); setSelectedIconName(availableIconNames[0] || ''); 
             setSelectedColorClass(badgeColorClasses[0]); setError(null); setIconSearchTerm('');
        }
    }, [badge, isOpen]);

    const handleClose = () => {
        if (isLoading) return;
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!badge?.id) { /* ... error handling ... */ return; }
        if (!name || !description || !selectedIconName || !selectedColorClass) { /* ... error handling ... */ return; }

        const updatedBadgeData = { name, description, icon_name: selectedIconName, color_class: selectedColorClass };

        try {
            // Assuming isLoading prop controls the button state
            const { error: updateError } = await supabase
                .from('badges')
                .update(updatedBadgeData)
                .eq('id', badge.id);

            if (updateError) throw updateError;

            toast.success(`Badge "${name}" berhasil diperbarui!`);
            onEdited(); // Callback to refresh list
            handleClose(); // Close modal

        } catch (err) {
            console.error("Error updating badge:", err);
            setError(err.message || 'Gagal memperbarui badge.');
            toast.error(`Gagal: ${err.message}`);
        }
         // Ensure loading state is reset if handled locally
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[80]" onClose={handleClose}>
                {/* Backdrop */}
                <Transition.Child as={Fragment} /* ... */><div className="fixed inset-0 bg-black/40 backdrop-blur-sm" /></Transition.Child>

                {/* Modal Content */}
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} /* ... */>
                             {/* --- Increased max-w --- */}
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 flex items-center gap-2">
                                     <PencilIcon className="h-5 w-5 text-blue-600"/> Edit Badge: <span className="font-bold">{badge?.name}</span>
                                </Dialog.Title>
                                <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" disabled={isLoading}><XMarkIcon className="h-5 w-5" /></button>

                                <form onSubmit={handleSubmit} className="mt-6 space-y-5"> {/* Increased spacing */}
                                     {error && <div className="rounded-md bg-red-50 p-3 border border-red-200 text-sm text-red-700">Error: {error}</div>}
                                     
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5"> {/* Grid layout */}
                                        {/* Name */}
                                        <div>
                                            <label htmlFor="edit-badge-name" className="block text-sm font-medium text-gray-700 mb-1">Nama Badge</label>
                                            <input type="text" id="edit-badge-name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
                                        </div>
                                        {/* Color Palette */}
                                         <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-1">Warna Ikon</label>
                                             <div className="flex flex-wrap gap-2 items-center rounded-md border border-gray-300 p-2 bg-gray-50/50">
                                                 {badgeColorClasses.map(color => {
                                                      const IconComp = SelectedIconComponent || TagIcon;
                                                     return (
                                                        <button
                                                            key={color}
                                                            type="button"
                                                            onClick={() => setSelectedColorClass(color)}
                                                            className={`h-7 w-7 rounded-full flex items-center justify-center ring-2 ring-offset-1 transition ${selectedColorClass === color ? 'ring-blue-500' : 'ring-transparent hover:ring-gray-300'}`}
                                                            title={color}
                                                            disabled={isLoading}
                                                        >
                                                             <IconComp className={`h-4 w-4 ${color}`} />
                                                        </button>
                                                    );
                                                 })}
                                             </div>
                                         </div>
                                    </div>

                                     {/* Description */}
                                     <div>
                                         <label htmlFor="edit-badge-desc" className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                                         <textarea id="edit-badge-desc" value={description} onChange={(e) => setDescription(e.target.value)} required disabled={isLoading} rows={3} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"></textarea>
                                     </div>
                                     
                                     {/* Icon Selector */} 
                                      <div>
                                         <label htmlFor="edit-icon-search" className="block text-sm font-medium text-gray-700 mb-1">Pilih Ikon</label>
                                         <div className="flex gap-3 items-center mb-2">
                                             {/* Search Input */}
                                             <input 
                                                 type="text" 
                                                 id="edit-icon-search" 
                                                 placeholder="Cari ikon..." 
                                                 value={iconSearchTerm}
                                                 onChange={(e) => setIconSearchTerm(e.target.value)}
                                                 className="flex-grow rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                 disabled={isLoading}
                                            />
                                             {/* Live Preview */}
                                             <div className="flex-shrink-0 text-center">
                                                 <span className="inline-block p-2 border rounded-md bg-gray-50" title={`Preview: ${selectedIconName}`}>
                                                     {SelectedIconComponent ? <SelectedIconComponent className={`h-6 w-6 ${selectedColorClass || 'text-gray-500'}`}/> : <TagIcon className="h-6 w-6 text-gray-400"/>}
                                                 </span>
                                             </div>
                                         </div>
                                         {/* Icon Grid */} 
                                         <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 bg-gray-50/30">
                                             {filteredIcons.map(iconName => {
                                                 const IconComponent = getIconComponent(iconName);
                                                 const isSelected = selectedIconName === iconName;
                                                 return (
                                                     <button
                                                         key={iconName}
                                                         type="button"
                                                         onClick={() => setSelectedIconName(iconName)}
                                                         className={`p-2 rounded-md flex items-center justify-center transition ${isSelected ? 'bg-blue-100 ring-2 ring-blue-300' : 'bg-white hover:bg-gray-100'}`}
                                                         title={iconName}
                                                         disabled={isLoading}
                                                     >
                                                         <IconComponent className={`h-5 w-5 ${selectedColorClass || 'text-gray-500'}`} />
                                                     </button>
                                                 );
                                             })}
                                             {filteredIcons.length === 0 && <p className="col-span-full text-center text-sm text-gray-500 py-4">Ikon tidak ditemukan.</p>}
                                         </div>
                                     </div>

                                    {/* Submit Button */}
                                    <div className="mt-6 flex justify-end gap-3 border-t pt-5">
                                        <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>Batal</Button>
                                        <Button type="submit" variant="primary" disabled={isLoading} className="inline-flex items-center justify-center min-w-[120px] bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500">
                                             {isLoading ? <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" /> : <CheckIcon className="h-5 w-5 mr-1.5" />}
                                            {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                                        </Button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

// --- Delete Badge Modal ---
function DeleteBadgeModal({ isOpen, onClose, onDeleted, badge, isLoading }) {
    const handleSubmit = async () => {
        if (!badge?.id) {
            toast.error("ID Badge tidak valid untuk dihapus.");
            return;
        }
        try {
            const { error: deleteError } = await supabase
                .from('badges')
                .delete()
                .eq('id', badge.id);

            if (deleteError) throw deleteError;

            toast.success(`Badge "${badge.name}" berhasil dihapus!`);
            onDeleted(); // Callback to refresh list
            onClose(); // Close modal

        } catch (err) {
            console.error("Error deleting badge:", err);
            toast.error(`Gagal hapus: ${err.message}`);
            // Optionally keep the modal open on error?
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[90]" onClose={onClose}> {/* Highest z-index */}
                {/* Backdrop */}
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                {/* Modal Content */}
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-red-800 flex items-center gap-2">
                                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600"/> Konfirmasi Hapus Badge
                                </Dialog.Title>
                                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" disabled={isLoading}><XMarkIcon className="h-5 w-5" /></button>

                                <div className="mt-4 space-y-3">
                                    <p className="text-sm text-gray-600">
                                        Apakah Anda yakin ingin menghapus badge "<strong className="font-medium">{badge?.name}</strong>"?
                                    </p>
                                    <p className="text-sm text-red-700 bg-red-50 p-3 rounded-md border border-red-100">
                                         <strong className="font-semibold">Peringatan:</strong> Menghapus definisi badge ini juga akan menghapus data badge ini dari semua pengguna yang telah mendapatkannya (<code className='text-xs bg-red-100 px-1 py-0.5 rounded'>user_badges</code>). Aksi ini tidak dapat dibatalkan.
                                    </p>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Batal</Button>
                                    <Button type="button" variant="danger" onClick={handleSubmit} disabled={isLoading} className="inline-flex items-center justify-center min-w-[140px]">
                                        {isLoading ? <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" /> : <TrashIcon className="h-5 w-5 mr-1.5" />}
                                        {isLoading ? 'Menghapus...' : 'Ya, Hapus Badge'}
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

function ManageBadgesPage() {
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [processingBadge, setProcessingBadge] = useState(null); // For Edit/Delete
    const [actionLoading, setActionLoading] = useState(false); // Shared loading state for modal actions

    // Fetch Badges
    const fetchBadges = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from('badges')
                .select('*')
                .order('name', { ascending: true }); // Order by name

            if (fetchError) throw fetchError;
            setBadges(data || []);
        } catch (err) {
            console.error("Error fetching badges:", err);
            setError(err.message || "Gagal memuat data badge.");
            toast.error(err.message || "Gagal memuat data badge.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBadges();
    }, [fetchBadges]);

    // Handlers for Modals
    const handleOpenAddModal = () => { setIsAddModalOpen(true); };
    const handleOpenEditModal = (badge) => { setProcessingBadge(badge); setIsEditModalOpen(true); };
    const handleOpenDeleteModal = (badge) => { setProcessingBadge(badge); setIsDeleteModalOpen(true); };

    // --- Update Callback Handlers to use setActionLoading --- 
    const handleBadgeAdded = () => {
        setActionLoading(false); // Stop loading on success/close
        fetchBadges(); // Refetch after add
    };
    const handleBadgeEdited = () => {
        setActionLoading(false);
        fetchBadges(); // Refetch after edit
    };
    const handleBadgeDeleted = () => {
        setActionLoading(false);
        fetchBadges(); // Refetch after delete
    };

    // Render
    if (loading && badges.length === 0) {
        return <div className="p-4 md:p-6"><BadgesSkeleton /></div>;
    }

    if (error) {
        return <div className="p-4 md:p-6 bg-red-50 text-red-700 rounded border border-red-200">Error: {error}</div>;
    }

    return (
        <div className="space-y-6">
             {/* Header */} 
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <SparklesIcon className="h-8 w-8 text-yellow-500"/>
                    Manajemen Badge
                </h1>
                 <Button 
                    variant="primary"
                    onClick={handleOpenAddModal} 
                    title="Tambah Badge Baru"
                    className="flex items-center"
                >
                    <PlusIcon className="h-5 w-5 mr-1.5" />
                    Tambah Badge
                </Button>
            </div>

             {/* Badges Table/List */} 
            <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden">
                 {badges.length === 0 && !loading ? (
                     <div className="p-10 text-center text-gray-500">
                         <TagIcon className="h-10 w-10 text-gray-400 inline-block mb-2"/>
                         <p className="font-medium">Belum Ada Badge</p>
                         <p className="text-sm mt-1">Tambahkan badge pertama Anda.</p>
                     </div>
                 ) : (
                    <div className="overflow-x-auto">
                         <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Ikon</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Badge</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deskripsi</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kelas Warna</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                 {badges.map((badge, index) => {
                                     const IconComponent = getIconComponent(badge.icon_name);
                                     return (
                                        <tr key={badge.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'} hover:bg-yellow-50/40 transition-colors duration-150 align-middle`}>
                                             {/* Icon Preview */} 
                                             <td className="px-4 py-3 whitespace-nowrap text-center">
                                                 <IconComponent className={`h-6 w-6 inline-block ${badge.color_class || 'text-gray-500'}`} title={badge.icon_name}/>
                                             </td>
                                             {/* Name */} 
                                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{badge.name}</td>
                                             {/* Description */} 
                                             <td className="px-6 py-4 text-sm text-gray-600 max-w-md"><p className="line-clamp-2" title={badge.description}>{badge.description}</p></td>
                                             {/* Color Class - IMPROVED */}
                                             <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                                                <span className={`${badge.color_class || 'text-gray-500'}`}>{badge.color_class}</span>
                                             </td>
                                             {/* Actions */} 
                                             <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                  <div className="flex items-center justify-center gap-3">
                                                     <button onClick={() => handleOpenEditModal(badge)} className="text-blue-600 hover:text-blue-900" title="Edit Badge"><PencilIcon className="h-5 w-5"/></button>
                                                     <button onClick={() => handleOpenDeleteModal(badge)} className="text-red-600 hover:text-red-900" title="Hapus Badge"><TrashIcon className="h-5 w-5"/></button>
                                                 </div>
                                             </td>
                                         </tr>
                                     );
                                 })}
                             </tbody>
                         </table>
                     </div>
                 )}
             </div>

            {/* Render Modals */}
            <AddBadgeModal 
                isOpen={isAddModalOpen} 
                onClose={() => {if (!actionLoading) setIsAddModalOpen(false);}} 
                onAdded={handleBadgeAdded} 
                isLoading={actionLoading} // Pass loading state
            />
            <EditBadgeModal 
                isOpen={isEditModalOpen} 
                onClose={() => {if (!actionLoading) setIsEditModalOpen(false);}} 
                onEdited={handleBadgeEdited} 
                badge={processingBadge} // Pass the badge data to edit
                isLoading={actionLoading} 
            />
            <DeleteBadgeModal 
                isOpen={isDeleteModalOpen} 
                onClose={() => {if (!actionLoading) setIsDeleteModalOpen(false);}} 
                onDeleted={handleBadgeDeleted} 
                badge={processingBadge} 
                isLoading={actionLoading} 
            />
        </div>
    );
}

export default ManageBadgesPage; 