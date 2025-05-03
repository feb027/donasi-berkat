import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient'; // Adjust path if needed
import { toast } from 'react-hot-toast';
import {
    UserGroupIcon, ArrowPathIcon, UserCircleIcon, ShieldCheckIcon, ShieldExclamationIcon,
    TrashIcon, // Import TrashIcon
    XMarkIcon, // Import XMarkIcon for modal close
    CheckIcon,
    ExclamationTriangleIcon,
    ChevronUpDownIcon,
    MagnifyingGlassIcon, // Import search icon
    ChevronUpIcon, // Icon for sort asc
    ChevronDownIcon, // Icon for sort desc
    FunnelIcon, // Icon for filter
    PlusIcon, // Icon for add user button
    EyeIcon, // Icon for view details
    EyeSlashIcon, // Import EyeSlashIcon for password visibility
    AcademicCapIcon, // Icon for assigning badges
    TagIcon // Fallback icon for badges
} from '@heroicons/react/24/outline';
import { Dialog, Transition, Listbox } from '@headlessui/react'; // Import Dialog, Transition, Listbox
import Button from '../../components/ui/Button'; // Import Button
import { Fragment } from 'react'; // Import Fragment
import { Link } from 'react-router-dom'; // <-- Import Link
import * as HeroIconsOutline from '@heroicons/react/24/outline'; // Import all outline icons for dynamic rendering

// Constants for pagination
const USERS_PER_PAGE = 10;

// Available roles for filtering (including 'all')
const filterRoles = [
    { id: 'all', name: 'Semua Role' },
    { id: 'user', name: 'User' },
    { id: 'admin', name: 'Admin' },
];

// Available roles for editing
const availableRoles = [
    { id: 'user', name: 'User' },
    { id: 'admin', name: 'Admin' },
];

// Helper to format date
function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    } catch {
        return 'Invalid Date';
    }
}

// Helper to get initials
const getInitials = (name) => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

// --- Edit Role Modal Component ---
function EditRoleModal({ isOpen, onClose, user, onSave, isLoading }) {
    const [selectedRole, setSelectedRole] = useState(availableRoles.find(r => r.id === user?.role) || availableRoles[0]);

    useEffect(() => {
        // Reset selected role when user changes or modal opens
        setSelectedRole(availableRoles.find(r => r.id === user?.role) || availableRoles[0]);
    }, [user, isOpen]);

    if (!user) return null;

    const handleSaveClick = () => {
        if (selectedRole.id !== user.role) {
            onSave(user.id, selectedRole.id);
        } else {
            onClose(); // Close if role hasn't changed
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </Transition.Child>

                {/* Modal Content */}
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 flex items-center gap-2">
                                     <ShieldExclamationIcon className="h-6 w-6 text-emerald-600"/> Edit Role Pengguna
                                </Dialog.Title>
                                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" disabled={isLoading}>
                                    <XMarkIcon className="h-5 w-5" />
                                </button>

                                <div className="mt-4 space-y-3">
                                    <p className="text-sm text-gray-600">
                                        Mengubah role untuk: <strong className="font-medium">{user.nama_pengguna}</strong>
                                    </p>
                                    {/* Role Selector using Headless UI Listbox */}
                                    <Listbox value={selectedRole} onChange={setSelectedRole} disabled={isLoading}>
                                        <div className="relative">
                                            <Listbox.Label className="block text-sm font-medium text-gray-700">Role Baru:</Listbox.Label>
                                            <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm disabled:cursor-not-allowed disabled:bg-gray-50">
                                                <span className="block truncate">{selectedRole.name}</span>
                                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                </span>
                                            </Listbox.Button>
                                            <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                                                    {availableRoles.map((role) => (
                                                        <Listbox.Option
                                                            key={role.id}
                                                            className={({ active }) =>
                                                                `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-emerald-100 text-emerald-900' : 'text-gray-900'}`
                                                            }
                                                            value={role}
                                                        >
                                                            {({ selected }) => (
                                                                <>
                                                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{role.name}</span>
                                                                    {selected ? (
                                                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-600">
                                                                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                                        </span>
                                                                    ) : null}
                                                                </>
                                                            )}
                                                        </Listbox.Option>
                                                    ))}
                                                </Listbox.Options>
                                            </Transition>
                                        </div>
                                    </Listbox>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={onClose}
                                        disabled={isLoading}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="primary"
                                        onClick={handleSaveClick}
                                        disabled={isLoading || selectedRole.id === user.role}
                                        className="inline-flex items-center justify-center min-w-[100px]"
                                    >
                                        {isLoading ? (
                                            <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                                        ) : (
                                            <CheckIcon className="h-5 w-5 mr-1.5" />
                                        )}
                                        {isLoading ? 'Menyimpan...' : 'Simpan'}
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

// --- Delete User Modal Component ---
function DeleteUserModal({ isOpen, onClose, user, onConfirm, isLoading }) {
    if (!user) return null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </Transition.Child>

                {/* Modal Content */}
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-red-800 flex items-center gap-2 mb-1">
                                   <ExclamationTriangleIcon className="h-6 w-6 text-red-600"/> Hapus Pengguna
                                </Dialog.Title>
                                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" disabled={isLoading}>
                                    <XMarkIcon className="h-5 w-5" />
                                </button>

                                <div className="mt-3 space-y-3">
                                    <p className="text-sm text-gray-600">
                                        Apakah Anda yakin ingin menghapus pengguna <strong className="font-medium">{user.nama_pengguna}</strong>?
                                    </p>
                                    <p className="text-sm text-red-700 bg-red-50 p-3 rounded-md border border-red-100">
                                         <strong className="font-semibold">Peringatan:</strong> Tindakan ini akan menghapus akun pengguna dari sistem autentikasi dan semua data terkait di database (profil, donasi, dll.) secara permanen. Ini tidak dapat dibatalkan.
                                    </p>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={onClose}
                                        disabled={isLoading}
                                    >
                                        Batal
                                    </Button>
                                     <Button
                                        type="button"
                                        variant="danger"
                                        onClick={() => onConfirm(user.id)} // Pass ID to confirm
                                        disabled={isLoading}
                                        className="inline-flex items-center justify-center min-w-[140px]"
                                    >
                                        {isLoading ? (
                                            <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                                        ) : (
                                            <TrashIcon className="h-5 w-5 mr-1.5" />
                                        )}
                                        {isLoading ? 'Menghapus...' : 'Ya, Hapus Pengguna'}
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

// --- NEW: User Details Modal Component ---
function UserDetailsModal({ isOpen, onClose, user }) {
    if (!user) return null;

    const joinDate = formatDate(user.created_at);
    const roleInfo = availableRoles.find(r => r.id === user.role) || { name: user.role };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[60]" onClose={onClose}> {/* Higher z-index than other modals */}
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                {/* Modal Content */}
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 flex items-center gap-3 mb-4">
                                    {user.avatar_url ? (
                                        <img className="h-12 w-12 rounded-full object-cover bg-gray-100 ring-2 ring-emerald-200" src={user.avatar_url} alt="Avatar" />
                                    ) : (
                                        <span className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-semibold ring-1 ring-emerald-200">{getInitials(user.nama_pengguna)}</span>
                                    )}
                                    <span>Detail: {user.nama_pengguna}</span>
                                </Dialog.Title>
                                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>

                                <div className="border-t border-gray-200 pt-5">
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                        <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Nama Lengkap</dt><dd className="mt-1 text-sm text-gray-900">{user.nama_lengkap || <span className="italic text-gray-400">Tidak diisi</span>}</dd></div>
                                        <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Email</dt><dd className="mt-1 text-sm text-gray-900">{user.email || <span className="italic text-gray-400">Tidak tersedia</span>}</dd></div>
                                        <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Role</dt><dd className="mt-1"><span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{roleInfo.name}</span></dd></div>
                                        <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Bergabung</dt><dd className="mt-1 text-sm text-gray-900">{joinDate}</dd></div>
                                        <div className="sm:col-span-2"><dt className="text-sm font-medium text-gray-500">Bio</dt><dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap break-words">{user.bio || <span className="italic text-gray-400">Bio kosong</span>}</dd></div>
                                        {/* Placeholder for summary counts - requires extra queries */}
                                        {/* <div className="sm:col-span-2 border-t pt-4 mt-4"><dt className="text-sm font-medium text-gray-500">Aktivitas</dt><dd className="mt-1 text-sm text-gray-900"><p>Donasi: [Jumlah]</p><p>Permintaan: [Jumlah]</p></dd></div> */}
                                    </dl>
                                </div>

                                <div className="mt-6 flex justify-end">
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

// --- NEW: Add User Modal Component ---
function AddUserModal({ isOpen, onClose, onUserAdded }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState(availableRoles[0]); // Default to 'user'
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [passwordVisible, setPasswordVisible] = useState(false);

    const resetForm = () => {
        setEmail(''); setPassword(''); setConfirmPassword('');
        setSelectedRole(availableRoles[0]); setError(null); setIsSubmitting(false);
        setPasswordVisible(false);
    };

    const handleClose = () => {
        if (isSubmitting) return; // Prevent closing while submitting
        resetForm();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Basic Validations
        if (!email) { setError('Email wajib diisi.'); return; }
        if (!/\S+@\S+\.\S+/.test(email)) { setError('Format email tidak valid.'); return; }
        if (!password) { setError('Password wajib diisi.'); return; }
        if (password.length < 6) { setError('Password minimal 6 karakter.'); return; }
        if (password !== confirmPassword) { setError('Konfirmasi password tidak cocok.'); return; }

        setIsSubmitting(true);
        try {
            console.log(`Invoking create-user for ${email} with role ${selectedRole.id}`);
            const { error: functionError } = await supabase.functions.invoke('create-user', {
                body: { email, password, role: selectedRole.id },
            });

            if (functionError) {
                console.error('Create User Func Error:', functionError);
                 // Try to parse the error message from the function if possible
                let specificError = functionError.message || 'Gagal membuat pengguna.';
                try {
                     const errJson = JSON.parse(functionError.context?.responseText || '{}');
                     specificError = errJson.error || specificError;
                 } catch { /* ignore parsing error */ }
                throw new Error(specificError);
            }

            toast.success(`Pengguna ${email} berhasil dibuat!`);
            onUserAdded(); // Callback to refresh user list on parent
            handleClose(); // Close and reset form on success

        } catch (err) {
            console.error('Create User Submit Error:', err);
            setError(err.message || 'Terjadi kesalahan.');
            // Don't close modal on error
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[60]" onClose={handleClose}>
                {/* Backdrop */}
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                {/* Modal Content */}
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 flex items-center gap-2">
                                     <PlusIcon className="h-6 w-6 text-emerald-600"/> Tambah Pengguna Baru
                                </Dialog.Title>
                                <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" disabled={isSubmitting}><XMarkIcon className="h-5 w-5" /></button>

                                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                    {/* Error Display */}
                                    {error && (
                                        <div className="rounded-md bg-red-50 p-3 border border-red-200">
                                            <p className="text-sm text-red-700">{error}</p>
                                        </div>
                                    )}

                                    {/* Email Input */}
                                    <div>
                                        <label htmlFor="add-email" className="block text-sm font-medium text-gray-700">Email</label>
                                        <input
                                            type="email"
                                            id="add-email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                                            placeholder="contoh@email.com"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                     {/* Password Input */}
                                     <div className="relative">
                                         <label htmlFor="add-password" className="block text-sm font-medium text-gray-700">Password</label>
                                         <input
                                             type={passwordVisible ? 'text' : 'password'}
                                             id="add-password"
                                             value={password}
                                             onChange={(e) => setPassword(e.target.value)}
                                             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm pr-10"
                                             placeholder="Minimal 6 karakter"
                                             required
                                             minLength={6}
                                             disabled={isSubmitting}
                                         />
                                         <button
                                            type="button"
                                            onClick={() => setPasswordVisible(!passwordVisible)}
                                            className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700"
                                            title={passwordVisible ? 'Sembunyikan' : 'Tampilkan'}
                                        >
                                            {passwordVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                        </button>
                                     </div>

                                     {/* Confirm Password Input */}
                                     <div>
                                         <label htmlFor="add-confirm-password" className="block text-sm font-medium text-gray-700">Konfirmasi Password</label>
                                         <input
                                             type={passwordVisible ? 'text' : 'password'}
                                             id="add-confirm-password"
                                             value={confirmPassword}
                                             onChange={(e) => setConfirmPassword(e.target.value)}
                                             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                                             placeholder="Ulangi password"
                                             required
                                              minLength={6}
                                             disabled={isSubmitting}
                                         />
                                          {password && confirmPassword && password !== confirmPassword && <p className="mt-1 text-xs text-red-600">Password tidak cocok</p>}
                                     </div>


                                    {/* Role Selector */}
                                    <Listbox value={selectedRole} onChange={setSelectedRole} disabled={isSubmitting}>
                                        <div className="relative">
                                            <Listbox.Label className="block text-sm font-medium text-gray-700">Role</Listbox.Label>
                                            <Listbox.Button className="relative mt-1 w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm disabled:cursor-not-allowed disabled:bg-gray-50">
                                                <span className="block truncate">{selectedRole.name}</span>
                                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"><ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" /></span>
                                            </Listbox.Button>
                                            <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                                <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                                                    {availableRoles.map((role) => (
                                                        <Listbox.Option key={role.id} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-emerald-100 text-emerald-900' : 'text-gray-900'}`} value={role}>
                                                            {({ selected }) => (<><span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{role.name}</span>{selected ? (<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-600"><CheckIcon className="h-5 w-5" aria-hidden="true" /></span>) : null}</>)}
                                                        </Listbox.Option>
                                                    ))}
                                                </Listbox.Options>
                                            </Transition>
                                        </div>
                                    </Listbox>

                                    {/* Submit Button */}
                                    <div className="mt-6 flex justify-end gap-3 border-t pt-5">
                                        <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>Batal</Button>
                                        <Button type="submit" variant="primary" disabled={isSubmitting} className="inline-flex items-center justify-center min-w-[120px]">
                                             {isSubmitting ? (<ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />) : (<PlusIcon className="h-5 w-5 mr-1.5" />)}
                                            {isSubmitting ? 'Membuat...' : 'Buat Pengguna'}
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

// --- Helper to get badge icon component ---
const getBadgeIconComponent = (iconName) => {
    const IconComponent = HeroIconsOutline[iconName];
    // Add a check to ensure it's a valid component/function before rendering
    if (typeof IconComponent === 'function' || typeof IconComponent === 'object') {
         return IconComponent;
    }
    console.warn(`Badge icon "${iconName}" not found in Heroicons Outline. Using fallback.`);
    return TagIcon; // Return TagIcon as fallback
};

// --- NEW: Assign Badge Modal Component ---
function AssignBadgeModal({ isOpen, onClose, user, badges, onAssign, isLoading, error }) {
    const [selectedBadge, setSelectedBadge] = useState(null);

    useEffect(() => {
        // Reset selected badge when modal opens or badges list changes
        setSelectedBadge(badges && badges.length > 0 ? badges[0] : null);
    }, [isOpen, badges]);

    if (!user) return null;

    const handleAssignClick = () => {
        if (selectedBadge) {
            onAssign(user.id, selectedBadge.id);
        }
    };

    const SelectedBadgeIcon = selectedBadge ? getBadgeIconComponent(selectedBadge.icon_name) : null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[70]" onClose={onClose}> {/* z-index below Edit/Delete */}
                {/* Backdrop */}
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/35 backdrop-blur-sm" />
                </Transition.Child>

                {/* Modal Content */}
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 flex items-center gap-2">
                                     <AcademicCapIcon className="h-6 w-6 text-indigo-600"/> Berikan Badge
                                </Dialog.Title>
                                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" disabled={isLoading}><XMarkIcon className="h-5 w-5" /></button>

                                <div className="mt-4 space-y-4">
                                    <p className="text-sm text-gray-600">
                                        Pilih badge untuk diberikan kepada: <strong className="font-medium">{user.nama_pengguna}</strong>
                                    </p>
                                    {error && <div className="rounded-md bg-red-50 p-3 border border-red-200 text-sm text-red-700">{error}</div>}
                                    
                                    {/* Badge Selector */}
                                    <Listbox value={selectedBadge} onChange={setSelectedBadge} disabled={isLoading || !badges || badges.length === 0}>
                                        <div className="relative">
                                            <Listbox.Label className="block text-sm font-medium text-gray-700">Pilih Badge:</Listbox.Label>
                                            <Listbox.Button className="relative mt-1 w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm disabled:cursor-not-allowed disabled:bg-gray-50">
                                                {selectedBadge ? (
                                                    <span className="flex items-center gap-2">
                                                        <SelectedBadgeIcon className={`h-5 w-5 ${selectedBadge.color_class || 'text-gray-400'}`} />
                                                        <span className="block truncate">{selectedBadge.name}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500">{(badges && badges.length > 0) ? 'Pilih badge...' : 'Tidak ada badge tersedia'}</span>
                                                )}
                                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                </span>
                                            </Listbox.Button>
                                            <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                                                    {badges && badges.map((badge) => {
                                                        const IconComponent = getBadgeIconComponent(badge.icon_name);
                                                        return (
                                                            <Listbox.Option
                                                                key={badge.id}
                                                                className={({ active }) =>
                                                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'}`
                                                                }
                                                                value={badge}
                                                            >
                                                                {({ selected }) => (
                                                                    <>
                                                                        <span className={`flex items-center gap-2 truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                                            <IconComponent className={`h-5 w-5 ${badge.color_class || 'text-gray-400'}`} />
                                                                            {badge.name}
                                                                        </span>
                                                                        {selected ? (
                                                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                                                                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                                            </span>
                                                                        ) : null}
                                                                    </>
                                                                )}
                                                            </Listbox.Option>
                                                        );
                                                    })}
                                                     {(!badges || badges.length === 0) && <div className="text-center text-sm text-gray-500 py-2 px-4">Tidak ada badge tersedia.</div>}
                                                </Listbox.Options>
                                            </Transition>
                                        </div>
                                    </Listbox>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Batal</Button>
                                    <Button
                                        type="button"
                                        variant="primary"
                                        onClick={handleAssignClick}
                                        disabled={isLoading || !selectedBadge}
                                        className="inline-flex items-center justify-center min-w-[100px] bg-indigo-600 hover:bg-indigo-700 focus-visible:ring-indigo-500"
                                    >
                                        {isLoading ? (<ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />) : (<CheckIcon className="h-5 w-5 mr-1.5" />)}
                                        {isLoading ? 'Memberikan...' : 'Berikan'}
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

function ManageUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    
    // --- Filtering State --- 
    const [roleFilter, setRoleFilter] = useState(filterRoles[0]); // Default to 'all'
    
    // --- Searching State --- 
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

    // --- Sorting State --- 
    const [sortKey, setSortKey] = useState('created_at'); // Default sort column
    const [sortDirection, setSortDirection] = useState('desc'); // Default sort direction

    // --- Modal State --- 
    const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null); 
    const [isSavingRole, setIsSavingRole] = useState(false);
    const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
    const [deletingUser, setDeletingUser] = useState(null);
    const [isDeletingUser, setIsDeletingUser] = useState(false);
    // Feedback State
    const [recentlyUpdatedUserId, setRecentlyUpdatedUserId] = useState(null); // State for visual feedback
    const [deletingRowId, setDeletingRowId] = useState(null); // State for fade-out effect
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false); // State for Add User modal

    // --- NEW: Assign Badge Modal State ---
    const [isAssignBadgeModalOpen, setIsAssignBadgeModalOpen] = useState(false);
    const [assigningUser, setAssigningUser] = useState(null);
    const [availableBadges, setAvailableBadges] = useState([]);
    const [isAssigningBadge, setIsAssigningBadge] = useState(false);
    const [assignBadgeError, setAssignBadgeError] = useState(null);

    // Debounce Search Term
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedSearchTerm(searchTerm); }, 500);
        return () => { clearTimeout(handler); };
    }, [searchTerm]);
    
    // --- Fetch Users (Handles Search & Role Filter) --- 
    const fetchUsers = useCallback(async (currentPage, search, filter) => {
        setLoading(true);
        setError(null);
        const offset = (currentPage - 1) * USERS_PER_PAGE;

        try {
            let profileQuery = supabase
                .from('profil')
                .select('*', { count: 'exact' });
                
            // Apply search filter (on backend)
            if (search) { 
                profileQuery = profileQuery.ilike('nama_pengguna', `%${search}%`); 
            }
            // Apply role filter (on backend)
            if (filter && filter.id !== 'all') {
                profileQuery = profileQuery.eq('role', filter.id);
            }

            // Apply sorting on backend (more efficient for large datasets)
            // We sort by created_at descending by default, other sorts handled client-side for now
            // If implementing full server-side sort, adjust .order() based on sortKey/sortDirection
            profileQuery = profileQuery
                .order('created_at', { ascending: false }) // Keep default sort for initial load
                .range(offset, offset + USERS_PER_PAGE - 1);
            
            const { data: profiles, error: profileError, count } = await profileQuery;

            if (profileError) throw profileError;

            if (!profiles || profiles.length === 0) {
                setUsers([]); setTotalUsers(0); setLoading(false); return;
            }

            // --- Fetch Emails (RPC) --- 
             const userIds = profiles.map(p => p.id);
             let emailMap = {};
             if (userIds.length > 0) {
                 try {
                    const { data: emailsData, error: rpcError } = await supabase
                        .rpc('get_user_emails_by_ids', { user_ids: userIds });
                    if (rpcError) { console.error("RPC Error:", rpcError); toast.error(`Gagal email: ${rpcError.message}`); }
                    else if (emailsData) { emailMap = emailsData.reduce((map, user) => { map[user.id] = user.email; return map; }, {}); }
                 } catch(rpcCallErr) { console.error("RPC Call Err:", rpcCallErr); toast.error("Kesalahan ambil email."); }
             }

             // Merge emails and set state
             const usersWithEmails = profiles.map(profile => ({ ...profile, email: emailMap[profile.id] || null }));
             setUsers(usersWithEmails);
             setTotalUsers(count || 0);

        } catch (err) {
            console.error("Error fetching users:", err);
            const errorMsg = err.code === '42501' ? 'Akses ditolak. Periksa RLS atau hak akses.' : err.message;
            setError(errorMsg); setUsers([]); setTotalUsers(0); toast.error(errorMsg);
        } finally { setLoading(false); }
    }, []);

    // --- useEffect to Fetch Users (Depends on page, debounced search, role filter) --- 
    useEffect(() => {
        fetchUsers(page, debouncedSearchTerm, roleFilter); // Pass roleFilter
    }, [page, debouncedSearchTerm, roleFilter, fetchUsers]); // Add roleFilter dependency

    // --- NEW: Fetch Available Badges ---
    const fetchAvailableBadges = useCallback(async () => {
        // No need to set loading indicator specifically for this background fetch
        try {
            const { data, error } = await supabase
                .from('badges')
                .select('id, name, icon_name, color_class')
                .order('name', { ascending: true });
            if (error) throw error;
            setAvailableBadges(data || []);
        } catch (err) {
            console.error("Error fetching available badges:", err);
            toast.error("Gagal memuat daftar badge.");
            setAvailableBadges([]); // Ensure it's an empty array on error
        }
    }, []);

    // --- useEffect to Fetch Badges (Run once on mount) ---
    useEffect(() => { fetchAvailableBadges(); }, [fetchAvailableBadges]);

    // --- Client-Side Sorting Logic ---
    const sortedUsers = useMemo(() => {
        if (!users) return [];
        const sorted = [...users].sort((a, b) => {
            let valA = a[sortKey];
            let valB = b[sortKey];

            // Handle date sorting
            if (sortKey === 'created_at') {
                valA = new Date(valA || 0);
                valB = new Date(valB || 0);
            }

            // Basic case-insensitive string compare for username
            if (typeof valA === 'string' && typeof valB === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [users, sortKey, sortDirection]);

    const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE);

    // --- Handler for Changing Sort --- 
    const handleSort = (key) => {
        if (sortKey === key) {
            // Toggle direction if same key is clicked
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new key and default to ascending
            setSortKey(key);
            setSortDirection('asc');
        }
         // Go back to page 1 when sorting changes
        setPage(1);
    };

    // --- Action Handlers (Edit, Save, Delete Click, Confirm Delete) ---
    const handleEditRoleClick = (userProfile) => { setEditingUser(userProfile); setIsEditRoleModalOpen(true); };
    const handleSaveRole = async (userId, newRole) => {
        if (!editingUser || editingUser.role === newRole) {
            setIsEditRoleModalOpen(false);
            return;
        }
        setIsSavingRole(true);
        const loadingToastId = toast.loading(`Mengubah role ${editingUser.nama_pengguna} menjadi ${newRole}...`);

        try {
            const { error: updateError } = await supabase
                .from('profil')
                .update({ role: newRole, updated_at: new Date() })
                .eq('id', userId);

            if (updateError) throw updateError;

            // Update local state optimistically
            setUsers(currentUsers =>
                currentUsers.map(u => (u.id === userId ? { ...u, role: newRole } : u))
            );
            setRecentlyUpdatedUserId(userId); // Trigger feedback
            setTimeout(() => setRecentlyUpdatedUserId(null), 1500); // Clear feedback
            toast.success(`Role ${editingUser.nama_pengguna} berhasil diubah menjadi ${newRole}!`, { id: loadingToastId });
            setIsEditRoleModalOpen(false);
            setEditingUser(null);

        } catch (err) {
            console.error("Error updating role:", err);
            toast.error(`Gagal mengubah role: ${err.message}`, { id: loadingToastId });
        } finally {
            setIsSavingRole(false);
        }
    };
    const handleDeleteUserClick = (userProfile) => { setDeletingUser(userProfile); setIsDeleteUserModalOpen(true); };
    const confirmDeleteUser = async (userId) => {
        if (!deletingUser) return;
        
        // Set ID for fade-out effect immediately
        setDeletingRowId(userId); 
        setIsDeletingUser(true); 
        const loadingToastId = toast.loading(`Menghapus ${deletingUser.nama_pengguna}...`);

        try {
            console.log(`Invoking delete-user for ${userId}`);
            const { error: functionError } = await supabase.functions.invoke('delete-user', { body: { userId } });

            if (functionError) {
                // If function fails, clear fade-out state and throw error
                setDeletingRowId(null); 
                console.error('Func Error:', functionError);
                throw new Error(functionError.message || 'Gagal memanggil fungsi hapus.');
            }

            // If function succeeds, wait for fade-out animation, then update state
            setTimeout(() => {
                setUsers(currentUsers => currentUsers.filter(u => u.id !== userId));
                setTotalUsers(currentTotal => Math.max(0, currentTotal - 1));
                toast.success(`${deletingUser.nama_pengguna} dihapus.`, { id: loadingToastId });
                setIsDeleteUserModalOpen(false); 
                setDeletingUser(null);
                setDeletingRowId(null); // Clear fade-out state after removal
            }, 500); // Match duration of fade-out animation (500ms)

        } catch (error) {
            console.error(`Delete Err:`, error);
            toast.error(`Gagal hapus: ${error.message}`, { id: loadingToastId });
            setDeletingRowId(null); // Clear fade-out state on error
            setIsDeletingUser(false); // Ensure loading state is off on error
            // Note: We don't close the modal on error here, user might want to retry
        }
    };
    
    // --- Search & Filter Handlers --- 
    const handleSearchChange = (event) => { setSearchTerm(event.target.value); setPage(1); };
    const clearSearch = () => { setSearchTerm(''); setPage(1); };
    const handleRoleFilterChange = (selectedRoleOption) => { setRoleFilter(selectedRoleOption); setPage(1); };

    // --- Handler for Adding User ---
    const handleUserAdded = () => {
        // Refetch users on the current page to show the new user
        fetchUsers(page, debouncedSearchTerm, roleFilter); 
    };

    // --- NEW: Assign Badge Handlers ---
    const handleAssignBadgeClick = (userProfile) => {
        setAssigningUser(userProfile);
        setAssignBadgeError(null); // Clear previous error
        setIsAssignBadgeModalOpen(true);
        // We fetch badges on mount, no need to fetch here unless it's conditional
    };

    const handleConfirmAssignBadge = async (userId, badgeId) => {
        if (!assigningUser || !badgeId) return;
        setIsAssigningBadge(true);
        setAssignBadgeError(null);
        const selectedBadgeInfo = availableBadges.find(b => b.id === badgeId);
        const loadingToastId = toast.loading(`Memberikan badge "${selectedBadgeInfo?.name || '...'}" kepada ${assigningUser.nama_pengguna}...`);

        try {
            const { error: insertError } = await supabase
                .from('user_badges')
                .insert({ user_id: userId, badge_id: badgeId });

            if (insertError) {
                // Check for unique constraint violation (PostgreSQL code 23505)
                if (insertError.code === '23505') {
                    throw new Error(`Pengguna ini sudah memiliki badge "${selectedBadgeInfo?.name}".`);
                }
                throw insertError; // Throw other errors
            }

            toast.success(`Badge "${selectedBadgeInfo?.name}" berhasil diberikan!`, { id: loadingToastId });
            setIsAssignBadgeModalOpen(false);
            setAssigningUser(null);
        } catch (err) {
            console.error("Error assigning badge:", err);
            setAssignBadgeError(err.message || 'Gagal memberikan badge.'); // Show error in modal
            toast.error(`Gagal: ${err.message}`, { id: loadingToastId });
        } finally {
            setIsAssigningBadge(false);
        }
    };

    // --- Render ---
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <UserGroupIcon className="h-7 w-7 text-emerald-600"/>
                    Manajemen Pengguna
                </h1>
                <Button 
                    variant="primary"
                    onClick={() => setIsAddUserModalOpen(true)} // Open the modal
                    title="Tambah Pengguna Baru"
                    className="flex items-center"
                >
                    <PlusIcon className="h-5 w-5 mr-1.5" />
                    Tambah Pengguna
                </Button>
            </div>

            {/* Filters & Search Bar Row */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                 {/* Role Filter Dropdown */} 
                 <div className="w-full md:w-auto z-10"> {/* z-index needed for dropdown overlap */}
                     <Listbox value={roleFilter} onChange={handleRoleFilterChange}>
                         <div className="relative">
                              <Listbox.Button className="relative w-full md:min-w-[180px] cursor-default rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm">
                                 <span className="truncate flex items-center">
                                     <FunnelIcon className="h-4 w-4 mr-2 text-gray-400"/>
                                     {roleFilter.name}
                                </span>
                                 <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"><ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" /></span>
                             </Listbox.Button>
                             <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                 <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                                     {filterRoles.map((role) => (
                                         <Listbox.Option key={role.id} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-emerald-100 text-emerald-900' : 'text-gray-900'}`} value={role}>
                                             {({ selected }) => (<><span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{role.name}</span>{selected ? (<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-600"><CheckIcon className="h-5 w-5" aria-hidden="true" /></span>) : null}</>)}
                                         </Listbox.Option>
                                     ))}
                                 </Listbox.Options>
                             </Transition>
                         </div>
                     </Listbox>
                 </div>

                 {/* Search Bar */} 
                 <div className="relative flex-grow w-full">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                     </div>
                     <input 
                        type="search"
                        placeholder="Cari username..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 ease-in-out"
                     />
                     {/* Clear Search Button */} 
                     {searchTerm && (
                         <button 
                             onClick={clearSearch}
                             className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                             title="Hapus pencarian"
                         >
                             <XMarkIcon className="h-5 w-5"/>
                         </button>
                     )}
                     {/* Loading indicator for search */} 
                     {loading && debouncedSearchTerm && <ArrowPathIcon className="animate-spin h-5 w-5 text-gray-400 absolute right-10 top-1/2 -translate-y-1/2" />} 
                 </div>
            </div>

            {/* User Table Container */}
            <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden">
                 {/* Loading, Error, Empty States */} 
                 {loading && sortedUsers.length === 0 && ( /* Show loading only if no users displayed */
                     <div className="p-10 text-center"><ArrowPathIcon className="animate-spin h-7 w-7 text-emerald-500 inline mr-2" /> Memuat...</div>
                 )}
                 {!loading && error && (
                     <div className="p-10 text-center text-red-600 bg-red-50">Error: {error}</div>
                 )}
                 {!loading && !error && sortedUsers.length === 0 && (
                     <div className="p-10 text-center text-gray-500">
                        <p className="font-medium">Tidak Ada Pengguna Ditemukan</p>
                        {debouncedSearchTerm || roleFilter.id !== 'all' ? 
                           <p className="text-sm mt-1">Coba ubah filter atau kata kunci pencarian Anda.</p> : 
                           <p className="text-sm mt-1">Belum ada pengguna terdaftar.</p>}
                    </div>
                 )}

                 {/* Table Data (uses sortedUsers) */} 
                 {!error && sortedUsers.length > 0 && (
                     <div className="overflow-x-auto">
                         <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50">
                                 <tr>
                                     {/* Sortable User Header */} 
                                     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('nama_pengguna')}>
                                         <div className="flex items-center">
                                             Pengguna
                                             {sortKey === 'nama_pengguna' && (
                                                sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4 ml-1"/> : <ChevronDownIcon className="h-4 w-4 ml-1"/>
                                             )}
                                         </div>
                                     </th>
                                     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                     {/* Sortable Joined Header */} 
                                     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('created_at')}>
                                         <div className="flex items-center">
                                             Bergabung
                                             {sortKey === 'created_at' && (
                                                 sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4 ml-1"/> : <ChevronDownIcon className="h-4 w-4 ml-1"/>
                                             )}
                                         </div>
                                     </th>
                                     <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                 </tr>
                             </thead>
                             <tbody className="bg-white divide-y divide-gray-200">
                                 {/* Map over sortedUsers instead of users */} 
                                 {sortedUsers.map((userProfile) => (
                                     <tr 
                                         key={userProfile.id} 
                                         className={`
                                             align-middle transition-all duration-1000 ease-out 
                                             ${recentlyUpdatedUserId === userProfile.id ? 'bg-emerald-50' : 'hover:bg-gray-50/80'}
                                             ${deletingRowId === userProfile.id ? 'opacity-0' : 'opacity-100'}
                                         `}
                                         style={{ transitionDuration: deletingRowId === userProfile.id ? '500ms' : '1000ms' }}
                                     >
                                         <td className="px-6 py-4 whitespace-nowrap">
                                             <div className="flex items-center">
                                                  <div className="flex-shrink-0 h-10 w-10">
                                                      {userProfile.avatar_url ? <img className="h-10 w-10 rounded-full object-cover bg-gray-100 ring-1 ring-gray-200" src={userProfile.avatar_url} alt="Avatar" /> : <span className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-semibold ring-1 ring-emerald-200">{getInitials(userProfile.nama_pengguna)}</span>}
                                                  </div>
                                                  <div className="ml-4">
                                                      <div className="text-sm font-medium text-gray-900 truncate max-w-[180px]" title={userProfile.nama_pengguna}>{userProfile.nama_pengguna}</div>
                                                      <div className="text-xs text-gray-500 truncate max-w-[180px]" title={userProfile.nama_lengkap || '-'}>{userProfile.nama_lengkap || <span className="italic">Tidak ada nama</span>}</div>
                                                  </div>
                                              </div>
                                         </td>
                                          <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm text-gray-600">{userProfile.email || <span className="text-gray-400 italic">N/A</span>}</span></td>
                                          <td className="px-6 py-4 whitespace-nowrap">
                                              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${userProfile.role === 'admin' ? 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200' : 'bg-gray-100 text-gray-800 ring-1 ring-gray-200'}`}>
                                                 {userProfile.role === 'admin' ? <ShieldCheckIcon className="h-4 w-4 mr-1.5 text-yellow-600 inline"/> : <UserCircleIcon className="h-4 w-4 mr-1.5 text-gray-500 inline"/>}{userProfile.role}
                                             </span>
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(userProfile.created_at)}</td>
                                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                              <div className="flex items-center justify-center flex-wrap gap-x-3 gap-y-1">
                                                  <Link 
                                                      to={`/admin/users/${userProfile.id}`} 
                                                      className="text-sky-600 hover:text-sky-900 transition inline-flex items-center gap-1"
                                                      title="Lihat Detail Pengguna"
                                                  >
                                                      <EyeIcon className="h-5 w-5"/>
                                                  </Link>
                                                  <button onClick={() => handleEditRoleClick(userProfile)} className="text-emerald-600 hover:text-emerald-900 transition inline-flex items-center gap-1" title="Edit Role">
                                                      <ShieldExclamationIcon className="h-5 w-5"/>
                                                  </button>
                                                  <button onClick={() => handleAssignBadgeClick(userProfile)} className="text-indigo-600 hover:text-indigo-900 transition inline-flex items-center gap-1" title="Berikan Badge">
                                                      <AcademicCapIcon className="h-5 w-5"/>
                                                  </button>
                                                  <button onClick={() => handleDeleteUserClick(userProfile)} className="text-red-600 hover:text-red-900 transition inline-flex items-center gap-1" title="Hapus">
                                                      <TrashIcon className="h-5 w-5"/>
                                                  </button>
                                              </div>
                                          </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                 )}

                 {/* Pagination */} 
                 {!loading && !error && totalUsers > USERS_PER_PAGE && (
                     <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                          <div className="flex-1 flex justify-between sm:hidden"><Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Sebelumnya</Button><Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Berikutnya</Button></div>
                          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between"><div><p className="text-sm text-gray-700">Menampilkan <span className="font-medium">{(page - 1) * USERS_PER_PAGE + 1}</span> - <span className="font-medium">{Math.min(page * USERS_PER_PAGE, totalUsers)}</span> dari <span className="font-medium">{totalUsers}</span> pengguna</p></div><div><nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination"><Button variant="outline" size="sm" className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}><span className="sr-only">Sebelumnya</span><svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg></Button><span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">Hal {page} / {totalPages}</span><Button variant="outline" size="sm" className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><span className="sr-only">Berikutnya</span><svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg></Button></nav></div></div>
                     </div>
                 )}
             </div>

            {/* Modals */} 
             <EditRoleModal isOpen={isEditRoleModalOpen} onClose={() => !isSavingRole && setIsEditRoleModalOpen(false)} user={editingUser} onSave={handleSaveRole} isLoading={isSavingRole}/>
             <DeleteUserModal isOpen={isDeleteUserModalOpen} onClose={() => !isDeletingUser && setIsDeleteUserModalOpen(false)} user={deletingUser} onConfirm={confirmDeleteUser} isLoading={isDeletingUser}/>
             <AddUserModal 
                isOpen={isAddUserModalOpen} 
                onClose={() => setIsAddUserModalOpen(false)} 
                onUserAdded={handleUserAdded} // Pass callback to refresh list
            />
             <AssignBadgeModal 
                isOpen={isAssignBadgeModalOpen}
                onClose={() => !isAssigningBadge && setIsAssignBadgeModalOpen(false)}
                user={assigningUser}
                badges={availableBadges}
                onAssign={handleConfirmAssignBadge}
                isLoading={isAssigningBadge}
                error={assignBadgeError}
            />
        </div>
    );
}

export default ManageUsersPage; 