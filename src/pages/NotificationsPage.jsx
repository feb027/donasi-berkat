import React, { useEffect, useMemo } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useChat } from '../contexts/ChatContext';
import Button from '../components/ui/Button';
import {
    ArrowPathIcon,
    BellSlashIcon,
    CheckCircleIcon,
    XCircleIcon,
    ChatBubbleLeftEllipsisIcon,
    UserPlusIcon,
    BellIcon,
    InboxIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';

// --- Helper Functions (Copy or move to utils) ---
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
      if (days < 7) return `${days}h lalu`; // Tampilkan 'h' untuk hari
      // Fallback untuk tanggal lebih lama
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (error) {
        console.error("Failed to format relative time:", error);
        return '-';
    }
  }

function getNotificationIcon(type) {
    switch (type) {
        case 'new_message':
            return ChatBubbleLeftEllipsisIcon;
        case 'new_request':
            return UserPlusIcon;
        case 'request_approved':
            return CheckCircleIcon;
        case 'request_rejected':
            return XCircleIcon;
        // Tambahkan case lain jika perlu
        default:
            return BellIcon; // Fallback
    }
}
// --- End Helper Functions ---

function NotificationsPage() {
    const {
        notifications,
        isLoading,
        error,
        hasMore,
        isFetchingMore,
        fetchNotifications,
        markAsRead,
        clearReadNotifications
    } = useNotification();
    const { openChatWidget } = useChat();
    const navigate = useNavigate();

    // Fetch notifications when the component mounts
    useEffect(() => {
        fetchNotifications(false);
    }, [fetchNotifications]);

    // Memoized checks
    const hasUnread = useMemo(() => notifications.some(n => !n.is_read), [notifications]);
    const hasRead = useMemo(() => notifications.some(n => n.is_read), [notifications]);

    // Updated Click Handler
    const handleNotificationClick = (notification) => {
        // Tandai dibaca saat diklik
        if (!notification.is_read) {
            markAsRead(notification.id);
        }
        // Logika navigasi
        switch (notification.type) {
            case 'new_request':
            case 'request_approved':
            case 'request_rejected':
                console.log(`Navigating to dashboard for notification type: ${notification.type}`);
                navigate('/dashboard'); 
                break;
            case 'new_message':
                if (notification.related_entity_id) {
                    console.log(`Opening chat widget for chat ID: ${notification.related_entity_id}`);
                    openChatWidget(notification.related_entity_id); // Gunakan ID dari notifikasi
                } else {
                    console.warn("New message notification missing related chat ID. Opening chat list.");
                    openChatWidget(); // Buka daftar chat jika ID tidak ada
                }
                break;
            default:
                console.log("No specific navigation for notification type:", notification.type);
                // Mungkin tidak perlu navigasi default, atau bisa ke halaman notifikasi itu sendiri (sudah di sini)
        }
    }

    return (
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Notifikasi</h1>
                <div className="flex items-center gap-2">
                    {/* Tombol Clear Read */}
                    {hasRead && (
                         <Button
                            variant="outline"
                            size="sm"
                            onClick={clearReadNotifications}
                            disabled={isFetchingMore || isLoading}
                            className="inline-flex items-center gap-1.5 text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 focus:ring-red-500"
                            title="Hapus semua notifikasi yang sudah dibaca"
                         >
                             <TrashIcon className="h-4 w-4" /> Bersihkan yg Dibaca
                         </Button>
                    )}
                     {/* Tombol Mark All Read */}
                    {hasUnread && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => markAsRead('all')}
                            disabled={isFetchingMore || isLoading}
                        >
                            Tandai semua dibaca
                        </Button>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {isLoading && notifications.length === 0 && (
                <div className="text-center py-10">
                    <div className="flex justify-center items-center text-gray-500">
                        <ArrowPathIcon className="animate-spin h-6 w-6 mr-2" />
                        <span>Memuat notifikasi...</span>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                 <div className="text-center py-10 px-4">
                    <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-100">
                        <XCircleIcon className="h-5 w-5 flex-shrink-0"/>
                        <span>Error: {error}</span>
                    </div>
                 </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && notifications.length === 0 && (
                <div className="text-center py-20 px-6 bg-gray-50/70 rounded-lg border border-dashed border-gray-300">
                    <InboxIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-text-secondary text-base mb-2 font-medium">Tidak ada notifikasi</p>
                    <p className="text-sm text-gray-500">Semua notifikasi Anda akan muncul di sini.</p>
               </div>
            )}

            {/* Notifications List */}
            {!isLoading && !error && notifications.length > 0 && (
                <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    {notifications.map((notif) => {
                        const Icon = getNotificationIcon(notif.type);
                        return (
                            <li
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`p-4 flex items-start gap-4 transition-colors duration-150 cursor-pointer ${
                                    !notif.is_read ? 'bg-emerald-50/40 hover:bg-emerald-50/80' : 'bg-white hover:bg-gray-50 opacity-80'
                                }`}
                            >
                                {/* Unread Indicator & Icon */}
                                <div className="flex-shrink-0 mt-0.5 relative">
                                    {Icon && <Icon className={`h-6 w-6 ${!notif.is_read ? 'text-emerald-600' : 'text-gray-400'}`} />}
                                    {!notif.is_read && (
                                         <span className="absolute -top-0.5 -right-0.5 block h-2 w-2 rounded-full bg-primary ring-1 ring-white"></span>
                                    )}
                                </div>
                                {/* Message & Time */}
                                <div className="flex-grow">
                                    <p className={`text-sm leading-relaxed ${!notif.is_read ? 'text-gray-800 font-semibold' : 'text-gray-600'}`}>
                                        {notif.message}
                                    </p>
                                    <p className={`text-xs mt-1 ${!notif.is_read ? 'text-primary' : 'text-gray-400'}`}>
                                        {formatRelativeTime(notif.created_at)}
                                    </p>
                                </div>
                                {/* Optional: Action button specific to notification? */}
                            </li>
                        );
                    })}
                </ul>
            )}

            {/* Load More Button */}
            {hasMore && !isLoading && (
                <div className="text-center pt-8">
                    <Button
                        onClick={() => fetchNotifications(true)}
                        disabled={isFetchingMore}
                        variant="outline"
                        className="inline-flex items-center justify-center gap-2 text-sm"
                    >
                        {isFetchingMore ? <ArrowPathIcon className="animate-spin h-4 w-4"/> : null}
                        {isFetchingMore ? 'Memuat...' : 'Muat Lebih Banyak Notifikasi'}
                    </Button>
                </div>
            )}

        </div>
    );
}

// PropTypes untuk helper functions
formatRelativeTime.propTypes = { dateString: PropTypes.string };
getNotificationIcon.propTypes = { type: PropTypes.string };


export default NotificationsPage;