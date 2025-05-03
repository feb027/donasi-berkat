import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import {
    ArrowPathIcon, CurrencyDollarIcon, MagnifyingGlassIcon,
    UserCircleIcon, ChatBubbleLeftEllipsisIcon, ClockIcon, CheckCircleIcon, XCircleIcon, QuestionMarkCircleIcon,
    FunnelIcon, ChevronUpDownIcon, XMarkIcon as ClearSearchIcon, XMarkIcon,
    EyeIcon, 
    CheckIcon,
    UsersIcon,
    LinkIcon,
    CheckBadgeIcon,
    TrashIcon,
    TagIcon,
    ChevronUpIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import { Listbox, Transition, Dialog } from '@headlessui/react'; // Import Dialog
import { Link } from 'react-router-dom'; // Import Link for navigation

// Constants
const DONATIONS_PER_PAGE = 15;

// Define getInitials locally
const getInitials = (name) => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

// Available status filters based on schema
const donationStatuses = [
    { id: 'all', name: 'Semua Status' },
    { id: 'tersedia', name: 'Tersedia' },
    { id: 'dipesan', name: 'Dipesan' },
    { id: 'didonasikan', name: 'Didonasikan' },
];

// --- NEW: Placeholder for Category Filter --- 
const allCategoriesOption = { id: 'all', name: 'Semua Kategori' };

// Helper function to format date (currency not needed now)
function formatDate(dateString) {
    if (!dateString) return '-';
    try { return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return 'Invalid Date'; }
}

// Updated StatusBadge for item donation statuses
function StatusBadge({ status }) {
    let bgColor, textColor, Icon, displayText;
    switch (status?.toLowerCase()) {
        case 'tersedia': bgColor = 'bg-blue-100'; textColor = 'text-blue-800'; Icon = CheckCircleIcon; displayText = 'Tersedia'; break;
        case 'dipesan': bgColor = 'bg-yellow-100'; textColor = 'text-yellow-800'; Icon = ClockIcon; displayText = 'Dipesan'; break;
        case 'didonasikan': bgColor = 'bg-green-100'; textColor = 'text-green-800'; Icon = CheckCircleIcon; displayText = 'Didonasikan'; break;
        default: bgColor = 'bg-gray-100'; textColor = 'text-gray-800'; Icon = QuestionMarkCircleIcon; displayText = status || 'Unknown';
    }
    return (
        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor} items-center gap-1`}>
            <Icon className="h-4 w-4" /> {displayText}
        </span>
    );
}

// --- NEW: Donation Requests Modal Component ---
function DonationRequestsModal({ isOpen, onClose, donationId, donationTitle }) {
    const [requests, setRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [errorRequests, setErrorRequests] = useState(null);

    const fetchDonationRequests = useCallback(async (id) => {
        if (!id) return;
        setLoadingRequests(true);
        setErrorRequests(null);
        setRequests([]); // Clear previous requests
        try {
            const { data, error } = await supabase
                .from('permintaan_donasi')
                .select(`
                    *, 
                    profil:id_peminta ( nama_pengguna, avatar_url )
                `)
                .eq('id_donasi', id)
                .order('created_at', { ascending: true });

            if (error) {
                if (error.code === '42501') throw new Error('Akses ditolak ke tabel permintaan.');
                throw error;
            }
            setRequests(data || []);
        } catch (err) {
            console.error("Error fetching donation requests:", err);
            setErrorRequests(err.message || "Gagal memuat data permintaan.");
            toast.error(err.message || "Gagal memuat data permintaan.");
        } finally {
            setLoadingRequests(false);
        }
    }, []);

    // Fetch requests when the modal opens or donationId changes
    useEffect(() => {
        if (isOpen && donationId) {
            fetchDonationRequests(donationId);
        }
    }, [isOpen, donationId, fetchDonationRequests]);

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[70]" onClose={onClose}> {/* Even higher z-index */}
                {/* Backdrop */}
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>

                {/* Modal Content */}
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 flex items-center gap-2 mb-1">
                                     <UsersIcon className="h-6 w-6 text-indigo-600"/> Permintaan untuk: <span className="font-bold">{donationTitle}</span>
                                </Dialog.Title>
                                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><XMarkIcon className="h-5 w-5" /></button>

                                <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 space-y-3">
                                    {loadingRequests && (
                                        <div className="text-center py-6"><ArrowPathIcon className="animate-spin h-6 w-6 text-indigo-500 inline"/> Memuat permintaan...</div>
                                    )}
                                    {!loadingRequests && errorRequests && (
                                        <div className="text-center py-6 text-red-600 bg-red-50 p-4 rounded">Error: {errorRequests}</div>
                                    )}
                                    {!loadingRequests && !errorRequests && requests.length === 0 && (
                                         <div className="text-center py-6 text-gray-500">Belum ada permintaan untuk donasi ini.</div>
                                    )}
                                    {!loadingRequests && !errorRequests && requests.length > 0 && (
                                        <ul className="divide-y divide-gray-200">
                                            {requests.map((req) => (
                                                <li key={req.id} className="py-4 flex items-start space-x-4">
                                                    <div className="flex-shrink-0">
                                                        {req.profil?.avatar_url ? (
                                                            <img className="h-10 w-10 rounded-full object-cover" src={req.profil.avatar_url} alt="" />
                                                        ) : (
                                                            <span className="h-10 w-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-semibold">
                                                                {req.profil?.nama_pengguna ? getInitials(req.profil.nama_pengguna) : '?'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate" title={req.profil?.nama_pengguna}>
                                                            {req.profil?.nama_pengguna || 'N/A'}
                                                        </p>
                                                        <p className="text-sm text-gray-500 mt-0.5">
                                                            Status: <span className={`font-medium ${req.status === 'diterima' ? 'text-green-600' : req.status === 'ditolak' ? 'text-red-600' : 'text-gray-600'}`}>{req.status}</span> - {formatDate(req.created_at)}
                                                        </p>
                                                        {req.pesan && (
                                                             <p className="mt-1 text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-100">"{req.pesan}"</p>
                                                        )}
                                                    </div>
                                                     {/* Placeholder for Accept/Reject buttons for admin later? */}
                                                     {/* <div> <Button size="xs">Aksi</Button> </div> */}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-end border-t pt-4">
                                    <Button variant="secondary" onClick={onClose}>Tutup</Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

// --- NEW: Donation Details Modal Component ---
function DonationDetailsModal({ isOpen, onClose, donation }) {
    if (!donation) return null;

    // Helper to render image or placeholder
    const renderImage = (url, index) => (
        <div key={index} className="aspect-square bg-gray-100 rounded overflow-hidden">
            {url ? (
                <img 
                    src={url} 
                    alt={`Donation ${index + 1}`} 
                    className="w-full h-full object-cover" 
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/150/f0fdf4/cccccc?text=Gagal' }}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                     <EyeIcon className="h-10 w-10" /> {/* Placeholder Icon */}
                </div>
            )}
        </div>
    );

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[80]" onClose={onClose}> {/* Higher z-index */}
                 {/* Backdrop */}
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>

                {/* Modal Content */} 
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 mb-4 flex justify-between items-start">
                                     <span>Detail Donasi: {donation.judul}</span>
                                     <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
                                </Dialog.Title>

                                <div className="mt-2 max-h-[70vh] overflow-y-auto pr-3 space-y-5">
                                    {/* Images Section */} 
                                    {donation.url_gambar && donation.url_gambar.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">Gambar</h4>
                                             <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                                 {donation.url_gambar.map(renderImage)}
                                             </div>
                                        </div>
                                    )}

                                    {/* Details Grid */} 
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 border-t pt-5">
                                         <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Judul</dt><dd className="mt-1 text-base text-gray-900 font-semibold">{donation.judul}</dd></div>
                                        <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Status</dt><dd className="mt-1"><StatusBadge status={donation.status} /></dd></div>
                                        <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Donatur</dt><dd className="mt-1 text-sm text-gray-900">{donation.profil?.nama_pengguna || 'N/A'}</dd></div>
                                        <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Kategori</dt><dd className="mt-1 text-sm text-gray-900">{donation.kategori?.nama || 'N/A'}</dd></div>
                                        <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Kondisi</dt><dd className="mt-1 text-sm text-gray-900">{donation.kondisi || <span className="italic text-gray-400">Tidak disebutkan</span>}</dd></div>
                                        <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Tanggal Dibuat</dt><dd className="mt-1 text-sm text-gray-900">{formatDate(donation.created_at)}</dd></div>
                                        <div className="sm:col-span-2"><dt className="text-sm font-medium text-gray-500">Deskripsi</dt><dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap break-words">{donation.deskripsi || <span className="italic text-gray-400">Tidak ada deskripsi</span>}</dd></div>
                                     </dl>
                                </div>

                                <div className="mt-6 flex justify-end border-t pt-4">
                                    <Button variant="secondary" onClick={onClose}>Tutup</Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

// --- NEW: Admin Mark as Donated Confirmation Modal ---
function MarkAsDonatedAdminModal({ isOpen, onClose, onConfirm, donationTitle, isLoading }) {
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
                                <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 flex items-center gap-2">
                                    <CheckBadgeIcon className="h-6 w-6 text-emerald-600"/> Tandai Sudah Didonasikan
                                </Dialog.Title>
                                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" disabled={isLoading}><XMarkIcon className="h-5 w-5" /></button>

                                <div className="mt-4 space-y-3">
                                    <p className="text-sm text-gray-600">
                                        Anda akan menandai donasi "<strong className="font-medium">{donationTitle}</strong>" sebagai sudah selesai didonasikan.
                                    </p>
                                    <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-100">
                                        Aksi ini akan mengubah status secara permanen.
                                    </p>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Batal</Button>
                                    <Button type="button" variant="success" onClick={onConfirm} disabled={isLoading} className="inline-flex items-center justify-center min-w-[100px]">
                                        {isLoading ? <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" /> : <CheckIcon className="h-5 w-5 mr-1.5" />}
                                        {isLoading ? 'Memproses...' : 'Konfirmasi'}
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

// --- NEW: Admin Delete Donation Confirmation Modal ---
function DeleteDonationAdminModal({ isOpen, onClose, onConfirm, donationTitle, isLoading }) {
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
                                    <TrashIcon className="h-6 w-6 text-red-600"/> Hapus Donasi
                                </Dialog.Title>
                                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" disabled={isLoading}><XMarkIcon className="h-5 w-5" /></button>

                                <div className="mt-4 space-y-3">
                                    <p className="text-sm text-gray-600">
                                        Apakah Anda yakin ingin menghapus donasi "<strong className="font-medium">{donationTitle}</strong>"?
                                    </p>
                                    <p className="text-sm text-red-700 bg-red-50 p-3 rounded-md border border-red-100">
                                         <strong className="font-semibold">Peringatan:</strong> Tindakan ini akan menghapus data donasi dan semua permintaan terkait secara permanen. Ini tidak dapat dibatalkan.
                                    </p>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Batal</Button>
                                    <Button type="button" variant="danger" onClick={onConfirm} disabled={isLoading} className="inline-flex items-center justify-center min-w-[140px]">
                                        {isLoading ? <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" /> : <TrashIcon className="h-5 w-5 mr-1.5" />}
                                        {isLoading ? 'Menghapus...' : 'Ya, Hapus'}
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

function ManageDonationsPage() {
    // State
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalDonations, setTotalDonations] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
    const [statusFilter, setStatusFilter] = useState(donationStatuses[0]);
    const [categories, setCategories] = useState([allCategoriesOption]);
    const [categoryFilter, setCategoryFilter] = useState(allCategoriesOption);
    const [loadingCategories, setLoadingCategories] = useState(true);
    // --- NEW State for Sorting ---
    const [sortKey, setSortKey] = useState('created_at'); // Default sort column
    const [sortDirection, setSortDirection] = useState('desc'); // Default sort direction

    // State for Modals
    const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
    const [viewingDonationId, setViewingDonationId] = useState(null);
    const [viewingDonationTitle, setViewingDonationTitle] = useState('');
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [viewingDonationDetails, setViewingDonationDetails] = useState(null);
    // --- NEW State for Admin Action Modals ---
    const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [processingDonation, setProcessingDonation] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Debounce Search Term
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedSearchTerm(searchTerm); }, 500);
        return () => { clearTimeout(handler); };
    }, [searchTerm]);

    // --- NEW: Fetch Categories --- 
    useEffect(() => {
        const fetchCategories = async () => {
            setLoadingCategories(true);
            try {
                const { data, error: catError } = await supabase
                    .from('kategori')
                    .select('id, nama')
                    .order('nama', { ascending: true });
                if (catError) throw catError;
                // Format for Listbox and add 'All' option
                const formattedCategories = data.map(cat => ({ id: cat.id, name: cat.nama }));
                setCategories([allCategoriesOption, ...formattedCategories]);
            } catch (err) {
                console.error("Error fetching categories:", err);
                toast.error("Gagal memuat daftar kategori.");
                setCategories([allCategoriesOption]); // Fallback to default
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []);

    // Fetch Donations (Modify to include sorting)
    const fetchDonations = useCallback(async (currentPage, search, statusF, categoryF, sortK, sortDir) => { // Added sort params
        setLoading(true);
        setError(null);
        const offset = (currentPage - 1) * DONATIONS_PER_PAGE;
        try {
            let query = supabase
                .from('donasi')
                .select(`
                    id, created_at, id_donatur, judul, kondisi, deskripsi, status, url_gambar,
                    profil:id_donatur ( id, nama_pengguna, avatar_url ),
                    kategori:id_kategori ( id, nama )
                `, { count: 'exact' });
            
            // Apply Filters
            if (search) { query = query.or(`judul.ilike.%${search}%,profil(nama_pengguna).ilike.%${search}%`); } // Search username too
            if (statusF && statusF.id !== 'all') { query = query.eq('status', statusF.id); }
            if (categoryF && categoryF.id !== 'all') { query = query.eq('id_kategori', categoryF.id); }
            
            // --- NEW: Apply Sorting ---
            // Need to handle sorting for joined tables carefully
            if (sortK === 'nama_pengguna') {
                // Sorting by related table requires a different approach (or disabling for now)
                // For simplicity, let's default to created_at if sorting by donor name is requested
                 query = query.order('created_at', { ascending: sortDir === 'asc' }); 
                 console.warn("Sorting by donator name is not directly supported via basic query. Defaulting to sort by date.");
            } else if (sortK === 'kategori'){
                 query = query.order('kategori(nama)', { ascending: sortDir === 'asc' });
            } else if (sortK) {
                 query = query.order(sortK, { ascending: sortDir === 'asc' });
            }
            // -----------------------
            
            query = query.range(offset, offset + DONATIONS_PER_PAGE - 1);
            
            const { data, error: fetchError, count } = await query;
            if (fetchError) { throw fetchError; }
            setDonations(data || []);
            setTotalDonations(count || 0);
        } catch (err) {
            console.error("Error fetching donations:", err);
            const errorMsg = err.code === '42501' ? 'Akses ditolak.' : err.message || "Gagal memuat data.";
            setError(errorMsg); setDonations([]); setTotalDonations(0); toast.error(errorMsg);
        } finally { setLoading(false); }
    }, []);

    // useEffect to Fetch Data (Update dependencies for sorting)
    useEffect(() => {
        setPage(1); // Reset page when filters/sort change
        fetchDonations(1, debouncedSearchTerm, statusFilter, categoryFilter, sortKey, sortDirection); // Pass sort params
    }, [debouncedSearchTerm, statusFilter, categoryFilter, sortKey, sortDirection, fetchDonations]); // Add sort dependencies

    // Effect for page changes (doesn't need to reset sort)
    useEffect(() => {
        fetchDonations(page, debouncedSearchTerm, statusFilter, categoryFilter, sortKey, sortDirection);
    }, [page]); 

    const totalPages = Math.ceil(totalDonations / DONATIONS_PER_PAGE);

    // Handlers
    const handleSearchChange = (event) => { setSearchTerm(event.target.value); };
    const clearSearch = () => { setSearchTerm(''); };
    const handleStatusFilterChange = (selectedStatusOption) => { setStatusFilter(selectedStatusOption); };
    const handleCategoryFilterChange = (selectedCategoryOption) => { setCategoryFilter(selectedCategoryOption); };
    const handleViewRequestsClick = (donation) => {
        setViewingDonationId(donation.id);
        setViewingDonationTitle(donation.judul);
        setIsRequestsModalOpen(true);
    };
    const handleViewDetailsClick = (donation) => {
        setViewingDonationDetails(donation);
        setIsDetailsModalOpen(true);
    };
    
    // --- NEW Admin Action Handlers ---
    const handleOpenMarkModal = (donation) => {
        setProcessingDonation(donation);
        setIsMarkModalOpen(true);
    };

    const handleConfirmMarkDonated = async () => {
        if (!processingDonation) return;
        setActionLoading(true);
        const donationId = processingDonation.id;
        const loadingToastId = toast.loading(`Menandai donasi ${processingDonation.judul} sebagai selesai...`);

        try {
            const { error: functionError } = await supabase.functions.invoke(
                'admin-mark-donated',
                { body: { donationId } }
            );
            if (functionError) throw functionError;

            // Update local state optimistically
            setDonations(prev => prev.map(d => d.id === donationId ? { ...d, status: 'didonasikan' } : d));
            toast.success(`Donasi ${processingDonation.judul} ditandai selesai.`, { id: loadingToastId });
            setIsMarkModalOpen(false);
            setProcessingDonation(null);
        } catch (err) {
            console.error("Error marking donation as donated (admin):", err);
            toast.error(`Gagal menandai selesai: ${err.message}`, { id: loadingToastId });
        } finally {
            setActionLoading(false);
        }
    };

    const handleOpenDeleteModal = (donation) => {
        setProcessingDonation(donation);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDeleteDonation = async () => {
        if (!processingDonation) return;
        setActionLoading(true);
        const donationId = processingDonation.id;
        const donationTitle = processingDonation.judul;
        const loadingToastId = toast.loading(`Menghapus donasi ${donationTitle}...`);

        try {
            const { error: functionError } = await supabase.functions.invoke(
                'admin-delete-donation',
                { body: { donationId } }
            );
            if (functionError) throw functionError;

            // Remove from local state
            setDonations(prev => prev.filter(d => d.id !== donationId));
            setTotalDonations(prev => Math.max(0, prev - 1)); // Decrement count
            toast.success(`Donasi ${donationTitle} berhasil dihapus.`, { id: loadingToastId });
            setIsDeleteModalOpen(false);
            setProcessingDonation(null);
        } catch (err) {
            console.error("Error deleting donation (admin):", err);
            toast.error(`Gagal menghapus: ${err.message}`, { id: loadingToastId });
        } finally {
            setActionLoading(false);
        }
    };

    // --- NEW: Sorting Handler ---
    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc'); // Default to ascending when changing column
        }
        // Fetching is triggered by the useEffect dependency change
    };

    // Render
    return (
        <div className="space-y-6">
            {/* Header */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <CurrencyDollarIcon className="h-8 w-8 text-emerald-600"/>
                Manajemen Donasi Barang
            </h1>

            {/* Filters & Search Bar Row (Add Category Filter Listbox) */}
             <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Status Filter */}
                <div className="w-full md:w-auto z-10">
                    <Listbox value={statusFilter} onChange={handleStatusFilterChange}>
                         <div className="relative">
                            <Listbox.Button className="relative w-full md:min-w-[180px] cursor-default rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"><span className="truncate flex items-center"><FunnelIcon className="h-4 w-4 mr-2 text-gray-400"/>{statusFilter.name}</span><span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"><ChevronUpDownIcon className="h-5 w-5 text-gray-400"/></span></Listbox.Button>
                            <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-20"> {/* Increased z-index */}
                                    {donationStatuses.map((statusOpt) => (
                                        <Listbox.Option key={statusOpt.id} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-emerald-100 text-emerald-900' : 'text-gray-900'}`} value={statusOpt}>{({ selected }) => (<><span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{statusOpt.name}</span>{selected ? (<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-600"><CheckIcon className="h-5 w-5"/></span>) : null}</>)}</Listbox.Option>
                                    ))}
                                </Listbox.Options>
                            </Transition>
                        </div>
                    </Listbox>
                </div>

                {/* --- NEW: Category Filter Listbox --- */}
                <div className="w-full md:w-auto z-[9]"> {/* Adjust z-index if needed */}
                    <Listbox value={categoryFilter} onChange={handleCategoryFilterChange} disabled={loadingCategories}> 
                         <div className="relative">
                            <Listbox.Button className="relative w-full md:min-w-[180px] cursor-default rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-wait">
                                <span className="truncate flex items-center">
                                    <TagIcon className="h-4 w-4 mr-2 text-gray-400"/>
                                     {loadingCategories ? 'Memuat Kategori...' : categoryFilter.name}
                                </span>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                    {loadingCategories ? <ArrowPathIcon className="animate-spin h-5 w-5 text-gray-400"/> : <ChevronUpDownIcon className="h-5 w-5 text-gray-400"/>}
                                </span>
                             </Listbox.Button>
                             <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                 <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-20">
                                     {categories.map((cat) => (
                                         <Listbox.Option key={cat.id} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-emerald-100 text-emerald-900' : 'text-gray-900'}`} value={cat}>
                                             {({ selected }) => (
                                                 <>
                                                     <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{cat.name}</span>
                                                     {selected ? (<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-600"><CheckIcon className="h-5 w-5"/></span>) : null}
                                                 </>
                                             )}
                                         </Listbox.Option>
                                     ))}
                                 </Listbox.Options>
                             </Transition>
                        </div>
                    </Listbox>
                </div>

                 {/* Search Bar */}
                <div className="relative flex-grow w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MagnifyingGlassIcon className="h-5 w-5 text-gray-400"/></div>
                    <input type="search" placeholder="Cari judul atau deskripsi..." value={searchTerm} onChange={handleSearchChange} className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" />
                    {searchTerm && (<button onClick={clearSearch} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600" title="Hapus pencarian"><ClearSearchIcon className="h-5 w-5"/></button>)}
                    {loading && debouncedSearchTerm && <ArrowPathIcon className="animate-spin h-5 w-5 text-gray-400 absolute right-10 top-1/2 -translate-y-1/2" />}
                </div>
            </div>

            {/* Donations Table Container */}
            <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden">
                {/* Loading/Error/Empty States */}
                 {loading && donations.length === 0 && ( <div className="p-10 text-center"><ArrowPathIcon className="animate-spin h-7 w-7 text-emerald-500 inline mr-2" /> Memuat...</div> )}
                 {!loading && error && ( <div className="p-10 text-center text-red-600 bg-red-50">Error: {error}</div> )}
                 {!loading && !error && donations.length === 0 && (
                     <div className="p-10 text-center text-gray-500">
                        <CurrencyDollarIcon className="h-10 w-10 text-gray-400 inline-block mb-2"/>
                        <p className="font-medium">Tidak Ada Donasi Ditemukan</p>
                        {debouncedSearchTerm || statusFilter.id !== 'all' ? <p className="text-sm mt-1">Coba ubah filter/pencarian.</p> : <p className="text-sm mt-1">Belum ada donasi barang.</p>}
                    </div>
                 )}

                {/* Table Data (Add Sorting to Headers) */}
                 {!loading && !error && donations.length > 0 && (
                     <div className="overflow-x-auto">
                         <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50">
                                 <tr>
                                     {/* --- Make Headers Sortable --- */}
                                     {/* Donatur Header (Note: Sorting by relation might be tricky) */} 
                                     <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('nama_pengguna')}>
                                         <div className="flex items-center">
                                             Donatur
                                              {/* Sorting indicator (Show warning if trying to sort by name) */} 
                                             {sortKey === 'nama_pengguna' && <span className="ml-1 text-red-500" title="Sorting by name not fully supported">!</span>}
                                         </div>
                                     </th>
                                     {/* Judul Barang Header */} 
                                     <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('judul')}>
                                         <div className="flex items-center">
                                             Judul Barang
                                             {sortKey === 'judul' && (
                                                sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4 ml-1"/> : <ChevronDownIcon className="h-4 w-4 ml-1"/>
                                             )}
                                         </div>
                                     </th>
                                     {/* Kategori Header */} 
                                     <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('kategori')}>
                                         <div className="flex items-center">
                                             Kategori
                                             {sortKey === 'kategori' && (
                                                sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4 ml-1"/> : <ChevronDownIcon className="h-4 w-4 ml-1"/>
                                             )}
                                         </div>
                                     </th>
                                     {/* Status Header */} 
                                     <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('status')}>
                                         <div className="flex items-center">
                                             Status
                                             {sortKey === 'status' && (
                                                sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4 ml-1"/> : <ChevronDownIcon className="h-4 w-4 ml-1"/>
                                             )}
                                         </div>
                                     </th>
                                     {/* Tanggal Header */} 
                                     <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('created_at')}>
                                         <div className="flex items-center">
                                             Tanggal
                                             {sortKey === 'created_at' && (
                                                sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4 ml-1"/> : <ChevronDownIcon className="h-4 w-4 ml-1"/>
                                             )}
                                         </div>
                                     </th>
                                     {/* Aksi Header (Not Sortable) */} 
                                     <th scope="col" className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                                 </tr>
                             </thead>
                             <tbody className="bg-white divide-y divide-gray-200">
                                 {donations.map((donation, index) => (
                                     <tr
                                        key={donation.id}
                                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'} hover:bg-emerald-50/40 transition-colors duration-150 align-middle`}
                                    >
                                         {/* Donator Cell - Add Link */}
                                         <td className="px-5 py-4 whitespace-nowrap">
                                              <div className="flex items-center">
                                                <div className="flex-shrink-0 h-9 w-9">
                                                     {donation.profil?.avatar_url ? (
                                                         <img className="h-9 w-9 rounded-full object-cover ring-1 ring-gray-200" src={donation.profil.avatar_url} alt="" />
                                                     ) : (
                                                         <span className="h-9 w-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-semibold ring-1 ring-gray-200">
                                                             {donation.profil?.nama_pengguna ? getInitials(donation.profil.nama_pengguna) : '?'}
                                                         </span>
                                                     )}
                                                </div>
                                                <div className="ml-3">
                                                     {/* --- FIX: Remove redundant span/link --- */}
                                                     {/* The logic below correctly renders either a Link or a span */}
                                                     {donation.profil?.id ? (
                                                         <Link 
                                                             to={`/admin/users/${donation.profil.id}`} 
                                                             className="text-sm font-medium text-gray-900 hover:text-indigo-700 hover:underline"
                                                             title={`Lihat detail admin untuk ${donation.profil.nama_pengguna}`}
                                                         >
                                                             {donation.profil.nama_pengguna || 'N/A'}
                                                         </Link>
                                                     ) : (
                                                         <span className="text-sm font-medium text-gray-700" title="Donatur tidak terdaftar atau anonim">
                                                             {donation.profil?.nama_pengguna || 'N/A'}
                                                         </span>
                                                     )}
                                                 </div>
                                            </div>
                                         </td>
                                         {/* Judul Barang Cell - Add Link */}
                                         <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900 max-w-xs truncate">
                                             <Link
                                                 to={`/donations/${donation.id}`}
                                                 target="_blank" // Open in new tab
                                                 rel="noopener noreferrer" // Security best practice
                                                 className="hover:text-emerald-700 transition-colors duration-150 group" /* Added group */
                                                 title={`Lihat detail: ${donation.judul}`}
                                             >
                                                 {donation.judul}
                                                 <LinkIcon className="h-3.5 w-3.5 inline-block ml-1 text-gray-400 group-hover:text-emerald-600"/>
                                             </Link>
                                         </td>
                                         {/* Kategori Cell */}
                                         <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">{donation.kategori?.nama || <span className="italic text-gray-400">N/A</span>}</td>
                                         {/* Status Cell */}
                                         <td className="px-5 py-4 whitespace-nowrap"><StatusBadge status={donation.status} /></td>
                                         {/* Date Cell */}
                                         <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(donation.created_at)}</td>
                                         {/* Updated Actions Cell - Use Buttons */}
                                         <td className="px-5 py-4 whitespace-nowrap text-center text-sm font-medium">
                                             <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
                                                 {/* View Requests Button */}
                                                 <Button
                                                     size="xs"
                                                     variant="ghost"
                                                     onClick={() => handleViewRequestsClick(donation)}
                                                     className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                                                     title="Lihat Permintaan"
                                                 >
                                                     <span className="flex items-center">
                                                         <UsersIcon className="h-4 w-4" />
                                                         <span className="hidden sm:inline ml-1">Requests</span>
                                                     </span>
                                                 </Button>
                                                 {/* --- View Details Button (Now Functional) --- */}
                                                 <Button
                                                     size="xs"
                                                     variant="ghost"
                                                     onClick={() => handleViewDetailsClick(donation)} // <-- Use new handler
                                                     className="text-sky-600 hover:text-sky-900 hover:bg-sky-50"
                                                     title="Lihat Detail Donasi"
                                                  >
                                                      <span className="flex items-center">
                                                         <EyeIcon className="h-4 w-4" />
                                                         <span className="hidden sm:inline ml-1">Details</span>
                                                      </span>
                                                 </Button>
                                                 
                                                 {/* --- NEW: Mark Donated Button --- */}
                                                 {donation.status !== 'didonasikan' && (
                                                     <Button
                                                         size="xs"
                                                         variant="ghost"
                                                         onClick={() => handleOpenMarkModal(donation)}
                                                         className="text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50"
                                                         title="Tandai Sudah Didonasikan"
                                                         disabled={actionLoading}
                                                     >
                                                         <span className="flex items-center">
                                                            <CheckBadgeIcon className="h-4 w-4" />
                                                            <span className="hidden sm:inline ml-1">Done</span>
                                                         </span>
                                                     </Button>
                                                 )}
                                                 
                                                 {/* --- NEW: Delete Button --- */}
                                                 <Button
                                                     size="xs"
                                                     variant="ghost"
                                                     onClick={() => handleOpenDeleteModal(donation)}
                                                     className="text-red-600 hover:text-red-900 hover:bg-red-50"
                                                     title="Hapus Donasi"
                                                     disabled={actionLoading}
                                                 >
                                                     <span className="flex items-center">
                                                        <TrashIcon className="h-4 w-4" />
                                                        <span className="hidden sm:inline ml-1">Delete</span>
                                                     </span>
                                                 </Button>
                                             </div>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                 )}

                {/* Pagination */}
                 {!loading && !error && totalDonations > DONATIONS_PER_PAGE && (
                     <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                          {/* --- Show total count clearly --- */}
                          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-start">
                              <p className="text-sm text-gray-700">Menampilkan <span className="font-medium">{(page - 1) * DONATIONS_PER_PAGE + 1}</span> - <span className="font-medium">{Math.min(page * DONATIONS_PER_PAGE, totalDonations)}</span> dari <span className="font-medium">{totalDonations}</span> donasi</p>
                          </div>
                          {/* --- Pagination Controls --- */}
                          <div className="flex items-center justify-end gap-2 sm:flex-1">
                              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Sebelumnya</Button>
                              <span className="text-sm px-2 py-1">Hal {page} / {totalPages}</span>
                              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Berikutnya</Button>
                          </div>
                     </div>
                 )}
            </div>
            {/* Render the modals */}
            <DonationRequestsModal
                isOpen={isRequestsModalOpen}
                onClose={() => setIsRequestsModalOpen(false)}
                donationId={viewingDonationId}
                donationTitle={viewingDonationTitle}
            />
            {/* --- NEW: Render Details Modal --- */}
            <DonationDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                donation={viewingDonationDetails} // Pass the full donation object
            />
            {/* --- NEW: Render Admin Modals --- */}
            <MarkAsDonatedAdminModal 
                isOpen={isMarkModalOpen}
                onClose={() => !actionLoading && setIsMarkModalOpen(false)}
                onConfirm={handleConfirmMarkDonated}
                donationTitle={processingDonation?.judul || ''}
                isLoading={actionLoading}
            />
            <DeleteDonationAdminModal 
                isOpen={isDeleteModalOpen}
                onClose={() => !actionLoading && setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDeleteDonation}
                donationTitle={processingDonation?.judul || ''}
                isLoading={actionLoading}
            />
        </div>
    );
}

export default ManageDonationsPage; 