import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/solid';

const NotificationContext = createContext();

const NOTIFICATION_LIMIT = 15; // Limit number of notifications initially loaded/shown

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    // --- Fetch Notifications ---
    const fetchNotifications = useCallback(async (loadMore = false) => {
        if (!user?.id) {
            setNotifications([]);
            setUnreadCount(0);
            setIsLoading(false);
            setHasMore(false);
            setOffset(0);
            return;
        }

        const currentOffset = loadMore ? offset : 0;
        if (loadMore) setIsFetchingMore(true); else setIsLoading(true);
        setError(null);

        try {
            // Fetch notifications
            const { data, error: fetchError, count: _count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact' })
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .range(currentOffset, currentOffset + NOTIFICATION_LIMIT - 1);

            if (fetchError) throw fetchError;

            const newNotifications = data || [];
            setNotifications(prev => loadMore ? [...prev, ...newNotifications] : newNotifications);
            setOffset(currentOffset + newNotifications.length);
            setHasMore(newNotifications.length === NOTIFICATION_LIMIT);

            // Calculate unread count from the *entire* potential list on initial load for accuracy,
            // or maintain based on fetched unread items if loading more (approximation)
            if (!loadMore) {
                const { count: totalUnreadCount, error: countError } = await supabase
                    .from('notifications')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('is_read', false);
                
                if (countError) console.error("Error counting unread notifications:", countError);
                setUnreadCount(totalUnreadCount ?? 0);
            }


        } catch (err) {
            console.error("Error fetching notifications:", err);
            setError("Gagal memuat notifikasi.");
            if (!loadMore) setNotifications([]); // Clear on initial load error
            setHasMore(false);
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    }, [user?.id, offset]);

    // --- Mark Notifications as Read ---
    const markAsRead = useCallback(async (notificationId = 'all') => {
        if (!user?.id) return;

        const currentlyUnread = notifications.filter(n => !n.is_read);
        if (currentlyUnread.length === 0 && notificationId === 'all') return; // Nothing to mark

        // Optimistic UI update
        const previousNotifications = [...notifications];
        const previousUnreadCount = unreadCount;

        if (notificationId === 'all') {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } else {
            setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
            // Decrement count only if the specific notification was unread
            if (previousNotifications.find(n => n.id === notificationId && !n.is_read)) {
                 setUnreadCount(prev => Math.max(0, prev - 1));
            }
        }

        try {
            let query = supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false); // Only update unread ones

            if (notificationId !== 'all') {
                query = query.eq('id', notificationId);
            }

            const { error: updateError } = await query;

            if (updateError) {
                console.error("Error marking notification(s) as read:", updateError);
                // Revert optimistic update on error
                setNotifications(previousNotifications);
                setUnreadCount(previousUnreadCount);
                toast.error("Gagal menandai notifikasi.");
            } else {
                 console.log(`Notification(s) marked as read: ${notificationId}`);
                 // Optionally refetch count for absolute accuracy after marking all
                 if (notificationId === 'all') {
                     fetchNotifications(); // Refetch to be sure count is accurate
                 }
            }
        } catch (err) {
            console.error("Exception marking notifications as read:", err);
             // Revert optimistic update on error
            setNotifications(previousNotifications);
            setUnreadCount(previousUnreadCount);
            toast.error("Terjadi kesalahan saat menandai notifikasi.");
        }
    }, [user?.id, notifications, unreadCount, fetchNotifications]);

    // --- NEW: Clear Read Notifications ---
    const clearReadNotifications = useCallback(async () => {
        if (!user?.id) return;

        const readNotificationsExist = notifications.some(n => n.is_read);
        if (!readNotificationsExist) {
            toast("Tidak ada notifikasi yang sudah dibaca untuk dibersihkan.", { icon: 'ℹ️' });
            return;
        }

        // Optimistic UI update: remove read notifications
        const previousNotifications = [...notifications];
        setNotifications(prev => prev.filter(n => !n.is_read));
        const loadingToastId = toast.loading('Membersihkan notifikasi...');

        try {
            const { error: deleteError } = await supabase
                .from('notifications')
                .delete()
                .eq('user_id', user.id)
                .eq('is_read', true);

            if (deleteError) {
                console.error("Error clearing read notifications:", deleteError);
                // Revert optimistic update on error
                setNotifications(previousNotifications);
                toast.error(`Gagal membersihkan notifikasi: ${deleteError.message}`, { id: loadingToastId });
            } else {
                console.log("Read notifications cleared successfully.");
                toast.success("Notifikasi yang sudah dibaca dibersihkan.", { id: loadingToastId });
                // Optionally adjust offset if needed, though maybe not critical here
                // Recalculate offset based on remaining notifications?
                // setOffset(notifications.filter(n => !n.is_read).length);
            }
        } catch (err) {
            console.error("Exception clearing read notifications:", err);
             // Revert optimistic update on error
            setNotifications(previousNotifications);
            toast.error("Terjadi kesalahan saat membersihkan notifikasi.", { id: loadingToastId });
        }
    }, [user?.id, notifications]);

    // --- Realtime Subscription for New Notifications ---
    useEffect(() => {
        if (!user?.id) return;

        // Initial fetch
        fetchNotifications();

        console.log("NotificationContext: Setting up realtime subscription.");
        const channel = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}` // Only listen for inserts for the current user
                },
                (payload) => {
                    console.log('NotificationContext: New notification received:', payload.new);
                    const newNotification = payload.new;
                    // Add to the beginning of the list and update count
                    setNotifications(prev => [newNotification, ...prev]);
                    setUnreadCount(prev => prev + 1);
                    // Optional: Show a toast
                    toast(
                        (t) => (
                          <div className="flex items-start gap-3">
                             <div className="flex-grow">
                                <p className="text-sm font-medium text-gray-900">Notifikasi Baru</p>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{newNotification.message}</p>
                             </div>
                              <button
                                  onClick={() => toast.dismiss(t.id)}
                                  className="ml-auto p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                >
                                  <XMarkIcon className="h-4 w-4 text-gray-500" />
                              </button>
                          </div>
                        ),
                        {
                          icon: '🔔',
                          duration: 5000, // Keep toast longer
                        }
                      );
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log('NotificationContext: Realtime subscription active.');
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.error('NotificationContext: Realtime subscription error:', status, err);
                    setError("Gagal terhubung ke notifikasi real-time.");
                } else {
                    console.log('NotificationContext: Realtime subscription status:', status);
                }
            });

        // Cleanup
        return () => {
            console.log("NotificationContext: Removing realtime subscription.");
            supabase.removeChannel(channel);
        };
    }, [user?.id, fetchNotifications]);

    const value = useMemo(() => ({
        notifications,
        unreadCount,
        isLoading,
        error,
        hasMore,
        isFetchingMore,
        fetchNotifications,
        markAsRead,
        clearReadNotifications
    }), [
        notifications, unreadCount, isLoading, error, hasMore, isFetchingMore,
        fetchNotifications, markAsRead, clearReadNotifications
    ]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}; 