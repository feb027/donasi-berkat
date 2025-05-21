import { useState, useEffect, Fragment } from 'react';
import { Outlet, Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useChat } from '../contexts/ChatContext';
import Button from './ui/Button';
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react';
import {
    ArrowRightOnRectangleIcon, ChevronDownIcon, PlusCircleIcon, Bars3Icon,
    MapPinIcon, EnvelopeIcon, PhoneIcon, ClockIcon, MagnifyingGlassIcon,
    ShieldCheckIcon, BellIcon, CheckCircleIcon, XCircleIcon,
    ChatBubbleLeftEllipsisIcon, UserPlusIcon, ArrowPathIcon,
    BellSlashIcon, TrashIcon,
    ListBulletIcon,
    QuestionMarkCircleIcon,
    SquaresPlusIcon,
    GiftIcon
} from '@heroicons/react/24/outline';
import { FaFacebookF, FaInstagram, FaTwitter } from 'react-icons/fa';
import ChatWidget from './ChatWidget';
import ChatTriggerButton from './ChatTriggerButton';
import logoKecilUrl from '../assets/logo-kecil.png';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `${seconds}d lalu`;
    if (minutes < 60) return `${minutes}m lalu`;
    if (hours < 24) return `${hours}j lalu`;
    if (days === 1) return 'Kemarin';
    // Fallback for older dates or if calculation is slightly off
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch (error) {
      console.error("Failed to format relative time:", error);
      return '-';
  }
}

function Layout() {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const { 
      notifications, 
      unreadCount, 
      isLoading: notificationsLoading, 
      markAsRead, 
      fetchNotifications,
      hasMore,
      isFetchingMore,
      clearReadNotifications
  } = useNotification();
  const { openChatWidget } = useChat();
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // --- DEBUG: Log unread count ---
  useEffect(() => {
    console.log("Layout: Unread Notification Count =", unreadCount);
  }, [unreadCount]);
  // -------------------------------

  const handleLogout = async () => {
    try {
        await signOut();
        navigate('/');
    } catch (error) {
        console.error("Logout failed:", error);
    }
  };

  const getInitials = (name) => {
      if (!name) return '?';
      const names = name.split(' ');
      if (names.length > 1) {
          return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      } else if (name.length > 0) {
          return name[0].toUpperCase();
      }
      return '?';
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    console.log("Layout location changed, scrolled window to top:", location.pathname);
  }, [location.pathname]);

  // --- Helper untuk mendapatkan ikon notifikasi ---
  function getNotificationIcon(type) {
      switch (type) {
          case 'new_message':
              return ChatBubbleLeftEllipsisIcon;
          case 'new_request':
              return UserPlusIcon; // Contoh, sesuaikan jika perlu
          case 'request_approved':
              return CheckCircleIcon;
          case 'request_rejected':
              return XCircleIcon;
          // Tambahkan case lain jika ada tipe notifikasi lain
          default:
              return BellIcon; // Fallback
      }
  }

  // --- Helper to check if any notification is read ---
  const hasReadNotifications = notifications.some(n => n.is_read);

  // --- NavLink Active Class Helper ---
  const getNavLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${isActive ? 'bg-emerald-50 text-emerald-600 font-semibold' : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-emerald-700'}`;
  
  // --- Dropdown Menu Item Class Helper ---
  const getMenuItemClass = ({ active }) => 
    `${active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'} group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors duration-150`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className={`bg-white text-gray-800 sticky top-0 z-50 border-b border-gray-200 transition-shadow duration-200 ${isScrolled ? 'shadow-md bg-white/95 backdrop-blur-sm' : 'shadow-sm'}`}>
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
             <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
                 <img src={logoKecilUrl} alt="DonasiBerkat Logo" className="h-9 w-auto transition-opacity duration-150 group-hover:opacity-85" />
                 <span className="text-xl font-bold text-emerald-600 transition-colors duration-150 group-hover:text-emerald-700">
                     DonasiBerkat
                 </span>
             </Link>
     
             <div className="flex items-center gap-2 md:gap-3">
                 <nav className="hidden md:flex items-center gap-1 md:gap-2">
                   {authLoading ? (
                     <div className="h-6 w-56 bg-gray-200 rounded animate-pulse"></div>
                   ) : user ? (
                     <>
                        {/* === Dropdown Telusuri (Logged In) === */}
                        <Menu as="div" className="relative">
                           <MenuButton className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-colors">
                               <MagnifyingGlassIcon className="h-4 w-4" /> Telusuri
                               <ChevronDownIcon className="h-4 w-4 ui-open:rotate-180 ui-open:transform transition-transform" />
                           </MenuButton>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95"
                            >
                                <MenuItems className="absolute left-0 mt-2 w-48 origin-top-left bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20 py-1">
                                     <MenuItem>
                                         {({ active }) => (
                                            <NavLink to="/browse" className={getMenuItemClass({ active })}> 
                                                <GiftIcon className="mr-2 h-4 w-4" /> Donasi Barang
                                            </NavLink>
                                         )}
                                     </MenuItem>
                                     <MenuItem>
                                         {({ active }) => (
                                            <NavLink to="/wishlist/browse" className={getMenuItemClass({ active })}> 
                                                 <ListBulletIcon className="mr-2 h-4 w-4" /> Permintaan Barang
                                            </NavLink>
                                         )}
                                     </MenuItem>
                                </MenuItems>
                           </Transition>
                        </Menu>

                       {/* Link Dashboard */}
                       <NavLink to="/dashboard" className={getNavLinkClass}> Dashboard </NavLink>


                       {/* === Dropdown Buat Baru === */}
                       <Menu as="div" className="relative ml-1">
                           <MenuButton as={Button} size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm flex items-center gap-1.5">
                               <SquaresPlusIcon className="h-4 w-4"/> Buat Baru 
                               <ChevronDownIcon className="h-4 w-4" />
                            </MenuButton>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95"
                            >
                                <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20 py-1">
                                     <MenuItem>
                                         {({ active }) => (
                                            <Link to="/donate" className={getMenuItemClass({ active })}> 
                                                <PlusCircleIcon className="mr-2 h-4 w-4" /> Buat Donasi
                                            </Link>
                                         )}
                                     </MenuItem>
                                     <MenuItem>
                                         {({ active }) => (
                                            <Link to="/wishlist/create" className={getMenuItemClass({ active })}> 
                                                 <QuestionMarkCircleIcon className="mr-2 h-4 w-4" /> Buat Permintaan
                                            </Link>
                                         )}
                                     </MenuItem>
                                </MenuItems>
                           </Transition>
                        </Menu>

                     </>
                   ) : (
                     <>
                       {/* === Dropdown Telusuri (Logged Out) === */}
                        <Menu as="div" className="relative">
                           <MenuButton className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-colors">
                               <MagnifyingGlassIcon className="h-4 w-4" /> Telusuri
                               <ChevronDownIcon className="h-4 w-4 ui-open:rotate-180 ui-open:transform transition-transform" />
                           </MenuButton>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95"
                            >
                                <MenuItems className="absolute left-0 mt-2 w-48 origin-top-left bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20 py-1">
                                     <MenuItem>
                                         {({ active }) => (
                                            <NavLink to="/browse" className={getMenuItemClass({ active })}> 
                                                <GiftIcon className="mr-2 h-4 w-4" /> Donasi Barang
                                            </NavLink>
                                         )}
                                     </MenuItem>
                                     <MenuItem>
                                         {({ active }) => (
                                            <NavLink to="/wishlist/browse" className={getMenuItemClass({ active })}> 
                                                 <ListBulletIcon className="mr-2 h-4 w-4" /> Permintaan Barang
                                            </NavLink>
                                         )}
                                     </MenuItem>
                                </MenuItems>
                           </Transition>
                        </Menu>

                       <Link to="/login" className="ml-1">
                         <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                           Masuk
                         </Button>
                       </Link>
                       <Link to="/signup">
                         <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm">
                           Daftar
                         </Button>
                       </Link>
                     </>
                   )}
                 </nav>

                {/* Notifikasi & Profile Dropdown (Hanya jika user login) */} 
                 {user && (
                    <div className="flex items-center gap-1 md:gap-2 pl-2 border-l border-gray-200">
                        {/* --- Notification Menu --- */}
                         <Menu as="div" className="relative">
                               <MenuButton className="relative rounded-full p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-colors">
                                 <span className="sr-only">Lihat notifikasi</span>
                                 <BellIcon className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
                                 {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 block h-4 w-4 md:h-5 md:w-5 rounded-full bg-red-500 ring-2 ring-white text-[10px] md:text-xs font-bold flex items-center justify-center text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                 )}
                               </MenuButton>
                                <Transition
                                   as={Fragment}
                                   enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
                                   leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95"
                               >
                                   <MenuItems className="absolute right-0 mt-2 w-80 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20 overflow-hidden">
                                       <div className="px-4 py-3 flex justify-between items-center border-b border-gray-100">
                                           <h3 className="text-sm font-semibold text-gray-800">Notifikasi</h3>
                                           <div className="flex items-center gap-2">
                                               {hasReadNotifications && (
                                                   <button
                                                        onClick={(e) => { e.stopPropagation(); clearReadNotifications(); }}
                                                        className="text-xs font-medium text-red-600 hover:text-red-800 hover:underline focus:outline-none p-1 rounded hover:bg-red-50"
                                                        title="Bersihkan Notifikasi Dibaca"
                                                   >
                                                        <TrashIcon className="h-4 w-4"/>
                                                    </button>
                                               )}
                                               {unreadCount > 0 && (
                                                  <button
                                                    onClick={(e) => { e.stopPropagation(); markAsRead('all'); }}
                                                    className="text-xs font-medium text-primary hover:text-emerald-600 hover:underline focus:outline-none"
                                                  >
                                                      Tandai semua dibaca
                                                  </button>
                                               )}
                                           </div>
                                       </div>
                                       <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                                           {notificationsLoading && notifications.length === 0 ? (
                                                <div className="p-6 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                                                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                                    <span>Memuat notifikasi...</span>
                                                </div>
                                           ) : !notificationsLoading && notifications.length === 0 ? (
                                                <div className="p-6 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                                                    <BellSlashIcon className="h-8 w-8 text-gray-300"/>
                                                    <span>Tidak ada notifikasi.</span>
                                                </div>
                                           ) : (
                                               notifications.map((notif) => {
                                                   const Icon = getNotificationIcon(notif.type);

                                                   return (
                                                       <MenuItem key={notif.id} as={Fragment}>
                                                          {({ active }) => (
                                                               <button
                                                                onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  markAsRead(notif.id);
                                                                  switch (notif.type) {
                                                                      case 'new_request':
                                                                      case 'request_approved':
                                                                      case 'request_rejected':
                                                                          navigate('/dashboard');
                                                                          break;
                                                                      case 'new_message':
                                                                          if (notif.related_entity_id) {
                                                                              openChatWidget(notif.related_entity_id);
                                                                          } else {
                                                                              openChatWidget();
                                                                          }
                                                                          break;
                                                                      default:
                                                                         navigate('/notifications');
                                                                  }
                                                                }}
                                                                className={`w-full pl-6 pr-4 py-3 text-left relative transition-colors cursor-pointer duration-150 flex items-start gap-3 ${active ? 'bg-gray-100' : 'bg-white'}`}
                                                              >
                                                                  {!notif.is_read && (
                                                                     <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary"></span>
                                                                  )}
                                                                  {Icon && <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${!notif.is_read ? 'text-emerald-600' : 'text-gray-400'}`} />}
                                                                  <div className="flex-grow">
                                                                     <p className={`text-sm line-clamp-2 ${!notif.is_read ? 'text-gray-800 font-medium' : 'text-gray-600 font-normal'}`}>
                                                                        {notif.message}
                                                                      </p>
                                                                      <p className={`text-xs mt-1 ${!notif.is_read ? 'text-primary' : 'text-gray-400'}`}>
                                                                          {formatRelativeTime(notif.created_at)}
                                                                      </p>
                                                                  </div>
                                                              </button>
                                                          )}
                                                       </MenuItem>
                                                  );
                                               })
                                           )}
                                            {hasMore && !notificationsLoading && (
                                                <div className="py-2 text-center border-t border-gray-100">
                                                     <button
                                                        onClick={() => fetchNotifications(true)}
                                                        disabled={isFetchingMore}
                                                        className="text-xs font-medium text-primary hover:text-emerald-700 hover:underline disabled:opacity-50 disabled:cursor-wait"
                                                     >
                                                         {isFetchingMore ? 'Memuat...' : 'Muat Lebih Banyak'}
                                                     </button>
                                                 </div>
                                            )}
                                       </div>
                                        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                                            <Link
                                              to="/notifications"
                                              className="block text-center text-xs font-medium text-primary hover:text-emerald-600 hover:underline focus:outline-none"
                                            >
                                              Lihat Semua Notifikasi
                                            </Link>
                                       </div>
                                   </MenuItems>
                               </Transition>
                           </Menu>

                        {/* --- Profile Menu --- */}
                        <Menu as="div" className="relative">
                           <div>
                               <MenuButton className="flex items-center gap-1 rounded-full p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 cursor-pointer transition-colors hover:bg-gray-100">
                                   <span className="sr-only">Buka menu pengguna</span>
                                   <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-semibold overflow-hidden" title={profile?.nama_pengguna || 'User'}>
                                       {profile?.avatar_url ? (
                                           <img src={profile.avatar_url} alt="Avatar" className="rounded-full h-full w-full object-cover" />
                                       ) : (
                                           <span>{getInitials(profile?.nama_pengguna)}</span>
                                       )}
                                   </div>
                                   <ChevronDownIcon className="hidden md:block h-4 w-4 text-gray-500 ui-open:rotate-180 ui-open:transform transition-transform duration-150" aria-hidden="true" />
                               </MenuButton>
                           </div>
                           <Transition
                               as={Fragment}
                               enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
                               leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95"
                           >
                               <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20 divide-y divide-gray-100">
                                    {/* ... isi menu profile ... */} 
                                     <Link to={`/profile/${user.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-t-md hover:bg-gray-50 transition-colors duration-150">
                                      <div className="px-4 py-3">
                                         <p className="text-sm font-semibold text-gray-900 truncate">{profile?.nama_pengguna || 'User'}</p>
                                         <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                      </div>
                                    </Link>
                                    <div className="py-1">
                                        {profile?.role === 'admin' && (
                                            <MenuItem>
                                                {({ active }) => (
                                                    <NavLink to="/admin" className={`${active ? 'bg-yellow-50 text-yellow-800' : 'text-yellow-700'} group flex w-full items-center rounded-md px-4 py-2 text-sm transition-colors duration-150`} >
                                                         <ShieldCheckIcon className="mr-2 h-5 w-5" aria-hidden="true" /> Admin Panel
                                                    </NavLink>
                                                )}
                                            </MenuItem>
                                        )}
                                        <MenuItem>
                                           {({ active }) => (
                                               <NavLink to="/dashboard" className={getMenuItemClass({ active })}> Dashboard </NavLink>
                                           )}
                                        </MenuItem>
                                        <MenuItem>
                                           {({ active }) => (
                                               <NavLink to="/edit-profile" className={getMenuItemClass({ active })}> Edit Profile </NavLink>
                                           )}
                                        </MenuItem>
                                    </div>
                                    <div className="py-1">
                                        <MenuItem>
                                            {({ active }) => (
                                                <button onClick={handleLogout} className={`${active ? 'bg-red-50 text-red-700' : 'text-red-600'} group flex w-full items-center rounded-md px-4 py-2 text-sm transition-colors duration-150`} >
                                                    <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5" aria-hidden="true" /> Logout
                                                </button>
                                            )}
                                        </MenuItem>
                                    </div>
                               </MenuItems>
                           </Transition>
                       </Menu>
                    </div>
                 )}

                 {/* Hamburger Menu (Mobile) */}
                 <div className="md:hidden ml-2">
                     <Menu as="div" className="relative inline-block text-left">
                         <div>
                           <MenuButton className="inline-flex justify-center items-center rounded-md p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">
                             <span className="sr-only">Buka menu</span>
                             <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                           </MenuButton>
                         </div>

                         <Transition
                           as={Fragment}
                           enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
                           leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95"
                         >
                           <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                             {user ? (
                                 <>
                                     {/* Profile Info */}
                                     <Link to={`/profile/${user.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-t-md hover:bg-gray-50 transition-colors duration-150">
                                        <div className="px-4 py-3">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{profile?.nama_pengguna || 'User'}</p>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>
                                     </Link>
                                     {/* Logged In Links */}
                                     <div className="py-1">
                                          {/* === Mobile Menu Items Logged In === */} 
                                          <MenuItem> {({ active }) => (<NavLink to="/browse" className={getMenuItemClass({ active })}><GiftIcon className="mr-2 h-4 w-4"/> Donasi Barang</NavLink>)} </MenuItem>
                                          <MenuItem> {({ active }) => (<NavLink to="/wishlist/browse" className={getMenuItemClass({ active })}><ListBulletIcon className="mr-2 h-4 w-4"/> Permintaan Barang</NavLink>)} </MenuItem>
                                          <MenuItem> {({ active }) => (<NavLink to="/dashboard" className={getMenuItemClass({ active })}> Dashboard </NavLink>)} </MenuItem>
                                          <MenuItem> {({ active }) => (<NavLink to="/edit-profile" className={getMenuItemClass({ active })}> Edit Profile </NavLink>)} </MenuItem>
                                          {profile?.role === 'admin' && (
                                             <MenuItem> {({ active }) => (<NavLink to="/admin" className={`${active ? 'bg-yellow-50 text-yellow-800' : 'text-yellow-700'} group flex w-full items-center rounded-md px-4 py-2 text-sm`}><ShieldCheckIcon className="mr-2 h-5 w-5"/> Admin Panel</NavLink>)} </MenuItem>
                                          )}
                                     </div>
                                      {/* Mobile Create Links */} 
                                      <div className="py-1">
                                         <MenuItem> {({ active }) => (<Link to="/donate" className={getMenuItemClass({ active })}><PlusCircleIcon className="mr-2 h-4 w-4"/> Buat Donasi</Link>)} </MenuItem>
                                         <MenuItem> {({ active }) => (<Link to="/wishlist/create" className={getMenuItemClass({ active })}><QuestionMarkCircleIcon className="mr-2 h-4 w-4"/> Buat Permintaan</Link>)} </MenuItem>
                                      </div>
                                     {/* Logout */}
                                     <div className="py-1">
                                         <MenuItem>
                                             {({ active }) => (
                                                 <button onClick={handleLogout} className={`${active ? 'bg-red-50 text-red-700' : 'text-red-600'} group flex w-full items-center rounded-md px-4 py-2 text-sm`} >
                                                     <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5" aria-hidden="true" /> Logout
                                                 </button>
                                             )}
                                         </MenuItem>
                                     </div>
                                 </>
                             ) : (
                                 <div className="py-1">
                                     {/* === Mobile Menu Items Logged Out === */} 
                                     <MenuItem> {({ active }) => (<NavLink to="/browse" className={getMenuItemClass({ active })}><GiftIcon className="mr-2 h-4 w-4"/> Donasi Barang</NavLink>)} </MenuItem>
                                     <MenuItem> {({ active }) => (<NavLink to="/wishlist/browse" className={getMenuItemClass({ active })}><ListBulletIcon className="mr-2 h-4 w-4"/> Permintaan Barang</NavLink>)} </MenuItem>
                                     <MenuItem> {({ active }) => (<Link to="/login" className={getMenuItemClass({ active })}> Masuk </Link>)} </MenuItem>
                                     <MenuItem> {({ active }) => (<Link to="/signup" className={getMenuItemClass({ active })}> Daftar </Link>)} </MenuItem>
                                 </div>
                             )}
                           </MenuItems>
                         </Transition>
                     </Menu>
                 </div>
             </div> 
         </div>
      </header>

      <main className="flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="bg-gradient-to-t from-gray-950 to-gray-900 text-gray-300 mt-auto">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              
              <div className="space-y-4 pr-4">
                <Link to="/" className="flex items-center gap-2 group mb-2">
                   <img src={logoKecilUrl} alt="DonasiBerkat Logo" className="h-8 w-auto" /> 
                   <span className="text-lg font-bold text-white">
                       DonasiBerkat
                   </span>
                </Link>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Platform yang menghubungkan pendonor barang bekas layak pakai dengan mereka yang membutuhkan.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider">Tautan Cepat</h4>
                <ul className="space-y-3 text-sm">
                  <li><Link to="/" className="inline-block hover:text-white hover:underline transition-colors duration-200">Beranda</Link></li>
                  <li><Link to="/browse" className="inline-block hover:text-white hover:underline transition-colors duration-200">Cari Barang Donasi</Link></li>
                  <li><Link to="/wishlist/browse" className="inline-block hover:text-white hover:underline transition-colors duration-200">Lihat Permintaan Barang</Link></li>
                  <li><Link to="/donate" className="inline-block hover:text-white hover:underline transition-colors duration-200">Donasi Barang</Link></li>
                  <li><Link to="/tentang-kami" className="inline-block hover:text-white hover:underline transition-colors duration-200">Tentang Kami</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider">Kontak</h4>
                <ul className="space-y-4 text-sm">
                  <li className="flex items-start gap-3">
                      <MapPinIcon className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Jl. Siliwangi No. 12, Tasikmalaya</span>
                  </li>
                  <li className="flex items-center gap-3">
                       <EnvelopeIcon className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                       <a href="mailto:info@donasiberkat.id" className="hover:text-white hover:underline transition-colors duration-200">info@donasiberkat.id</a>
                  </li>
                   <li className="flex items-center gap-3">
                       <PhoneIcon className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                       <span>(+62) 85314493791</span>
                  </li>
                  <li className="flex items-center gap-3">
                       <ClockIcon className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                       <span>Senin - Jumat, 08:00 - 17:00</span>
                  </li>
                </ul>
              </div>

              <div>
                 <h4 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider">Ikuti Kami</h4>
                 <p className="text-sm text-gray-400 mb-4">Dapatkan info terbaru melalui sosial media kami.</p>
                <div className="flex space-x-3">
                   <a href="#" target="_blank" rel="noopener noreferrer" title="Facebook" className="flex items-center justify-center h-8 w-8 bg-gray-700 rounded-full text-gray-400 hover:bg-emerald-500 hover:text-white transition-colors">
                       <FaFacebookF />
                   </a>
                   <a href="#" target="_blank" rel="noopener noreferrer" title="Instagram" className="flex items-center justify-center h-8 w-8 bg-gray-700 rounded-full text-gray-400 hover:bg-emerald-500 hover:text-white transition-colors">
                       <FaInstagram />
                   </a>
                   <a href="#" target="_blank" rel="noopener noreferrer" title="Twitter" className="flex items-center justify-center h-8 w-8 bg-gray-700 rounded-full text-gray-400 hover:bg-emerald-500 hover:text-white transition-colors">
                       <FaTwitter />
                   </a>
                </div>
              </div>

            </div>
          </div>

          <div className="bg-gray-950 py-4 border-t border-gray-800">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center md:flex md:justify-between">
                 <p className="text-xs text-gray-500 mb-2 md:mb-0">
                    &copy; {new Date().getFullYear()} DonasiBerkat. Hak Cipta Dilindungi.
                 </p>
                 <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
                     <Link to="/kebijakan-privasi" className="text-gray-400 hover:text-white transition-colors duration-200">Kebijakan Privasi</Link>
                     <span className="text-gray-700" aria-hidden="true">|</span>
                     <Link to="/syarat-ketentuan" className="text-gray-400 hover:text-white transition-colors duration-200">Syarat & Ketentuan</Link>
                     <span className="text-gray-700" aria-hidden="true">|</span>
                     <Link to="/faq" className="text-gray-400 hover:text-white transition-colors duration-200">FAQ</Link>
                     <span className="text-gray-700" aria-hidden="true">|</span>
                     <Link to="/technical-overview" className="text-gray-400 hover:text-white transition-colors duration-200">Tinjauan Teknis</Link>
                 </div>
              </div>
          </div>
      </footer>

      <ChatWidget />

      {user && <ChatTriggerButton />}

    </div>
  );
}

export default Layout; 