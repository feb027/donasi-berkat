import React, { createContext, useState, useContext, useMemo, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; // Import supabase for fetching
import { useAuth } from './AuthContext'; // Need user context to know who is logged in
import { XMarkIcon } from '@heroicons/react/24/solid'; // Keep for toast

// 1. Buat Context
const ChatContext = createContext(null);

// 2. Buat Provider Component
export function ChatProvider({ children }) {
    // currentChatId now represents conversation_id
    const [currentChatId, _setCurrentChatId] = useState(null); 
    const [isWidgetOpen, setIsWidgetOpen] = useState(false);

    // State for Conversation List
    const [conversationList, setConversationList] = useState([]);
    const [isLoadingConversations, setIsLoadingConversations] = useState(false);
    const [errorConversations, setErrorConversations] = useState(null);

    const { user } = useAuth(); // Get current user

    // --- Fungsi Inti --- 

    // Fungsi Fetch Conversation List
    const fetchConversations = useCallback(async () => {
        if (!user?.id) return;
        console.log("ChatContext: Fetching conversations using NEW RPC...");
        setIsLoadingConversations(true);
        setErrorConversations(null);
        try {
            const { data, error } = await supabase.rpc('get_user_conversations', {
                p_user_id: user.id
            });
            if (error) throw error;
            console.log("ChatContext: Fetched conversations via RPC:", data);
            // Data now has conversation_id, partner info, last message, etc.
            setConversationList(data || []);
        } catch (error) {
            console.error("ChatContext: Failed to fetch conversations:", error);
            setErrorConversations(error.message || "Gagal memuat daftar percakapan.");
            setConversationList([]);
        } finally {
            setIsLoadingConversations(false);
        }
    }, [user?.id]);


    // Fungsi untuk membuka widget, bisa dengan chatId spesifik atau tidak
    const openChatWidget = useCallback((chatId = null) => {
        console.log(`ChatContext: Opening widget. Target conversationId: ${chatId}`);
        setIsWidgetOpen(true);
        if (chatId) {
            _setCurrentChatId(chatId); // Set specific conversation_id
        } else {
            _setCurrentChatId(null); // Open to conversation list
            // Fetch if list is empty or not loading
            if (conversationList.length === 0 && !isLoadingConversations) { 
                 fetchConversations();
            }
            // Consider always fetching on list open? fetchConversations(); 
        }
    }, [fetchConversations, conversationList.length, isLoadingConversations]);

     // Fungsi untuk mengatur chat ID yang aktif di widget
     const setCurrentChatId = useCallback((conversationId) => {
        console.log(`ChatContext: Setting current conversation ID to: ${conversationId}`);
         _setCurrentChatId(conversationId);
     }, []);

    // Fungsi untuk mereset unread count di state lokal (dipanggil setelah mark as read)
    const resetUnreadCount = useCallback((conversationId) => {
        console.log(`ChatContext: Resetting unread count for ${conversationId}`);
        setConversationList(prevList =>
            prevList.map(convo =>
                // Match based on conversation_id now
                convo.conversation_id === conversationId ? { ...convo, unread_count: 0 } : convo
            )
        );
    }, []);

    // Fungsi untuk menutup widget
    const closeChatWidget = useCallback(() => {
        console.log("ChatContext: Closing chat widget");
        setIsWidgetOpen(false);
        _setCurrentChatId(null);
    }, []);

    // --- Realtime Subscription for Conversation List Updates ---
    useEffect(() => {
        if (!user?.id) return;

        // Fetch initial list if needed
        if (conversationList.length === 0) {
            fetchConversations();
        }

        console.log("ChatContext: Setting up NEW conversation list subscription (conversations table).");
        
        // Subscribe to CHANGES in the conversations table where the user is involved
        const channel = supabase
            .channel('public:conversations')
            .on(
                'postgres_changes',
                { 
                    event: 'UPDATE', // Listen for updates (specifically last_message_at)
                    schema: 'public', 
                    table: 'conversations',
                    // Filter on the server-side for conversations involving the user
                    // Note: RLS ensures they can only subscribe to relevant rows anyway,
                    // but explicit filter might be slightly more efficient?
                    // For simplicity, let's rely on RLS first.
                    // filter: `or(user1_id.eq.${user.id},user2_id.eq.${user.id})` 
                },
                (payload) => {
                    // Check if the change is relevant (RLS should handle this, but double-check)
                    if (payload.new.user1_id === user.id || payload.new.user2_id === user.id) {
                        console.log('ChatContext: Detected relevant change in conversations table, refetching conversations:', payload);
                        fetchConversations(); // Refetch the sorted list
                    } else {
                        console.log('ChatContext: Received conversation update, but not relevant to user:', payload);
                    }
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log('ChatContext: Conversation list subscription active.');
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.error('ChatContext: Conversation list subscription error:', status, err);
                    // Consider setting an error state here
                    // setErrorConversations("Gagal menyambung ke update percakapan.");
                }
            });

        // Cleanup subscription
        return () => {
            console.log("ChatContext: Removing conversation list subscription.");
            supabase.removeChannel(channel);
        };
    // We only need user.id and the stable fetchConversations reference here
    }, [user?.id, fetchConversations]); 

    // --- NEW: Function to find/create conversation and open widget --- 
    const startOrOpenChat = useCallback(async (partnerId) => {
        if (!user?.id || !partnerId || user.id === partnerId) {
            console.error("startOrOpenChat: Invalid user IDs provided.");
            // Optionally show an error toast/message here
            return; 
        }
        console.log(`ChatContext: Starting or opening chat with partner ${partnerId}`);
        // Optionally show loading state
        try {
             const { data: conversationId, error: rpcError } = await supabase.rpc('find_or_create_conversation', {
                 user_id_1: user.id,
                 user_id_2: partnerId
             });

             if (rpcError) throw rpcError;

             if (conversationId) {
                 console.log(`ChatContext: Got conversation ID: ${conversationId}`);
                 setCurrentChatId(conversationId);
                 setIsWidgetOpen(true);
                 // Optional: Force refresh list if it was a NEW conversation?
                 // The realtime subscription might cover this, but explicit refresh is safer.
                 // We could check if conversationId already exists in conversationList
                 const exists = conversationList.some(c => c.conversation_id === conversationId);
                 if (!exists) {
                     console.log("ChatContext: New conversation created, refreshing list.");
                     await fetchConversations(); // Refresh to include the new convo
                 }
             } else {
                 throw new Error("Failed to find or create conversation.");
             }

        } catch (error) {
            console.error("Error in startOrOpenChat:", error);
            // Show error message to user (e.g., using a toast library)
            // toast.error(`Gagal memulai chat: ${error.message}`);
        } finally {
            // Hide loading state
        }
    }, [user, fetchConversations, conversationList]); // Added conversationList dependency

    // Memoize nilai context untuk mencegah re-render yang tidak perlu
    const value = useMemo(() => ({
        currentChatId, // Represents conversation_id
        isWidgetOpen,
        resetUnreadCount, // Updated to use conversation_id
        conversationList, // Holds new data structure
        isLoadingConversations,
        errorConversations,
        openChatWidget,
        closeChatWidget,
        fetchConversations, // Still useful for initial load/manual refresh
        setCurrentChatId, // Updated to use conversation_id
        startOrOpenChat // <-- Expose the new function
    }), [
        currentChatId, isWidgetOpen, conversationList, isLoadingConversations,
        errorConversations, openChatWidget, closeChatWidget, fetchConversations,
        setCurrentChatId, resetUnreadCount, startOrOpenChat
    ]);

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
}

// 3. Buat Custom Hook untuk menggunakan Context
export function useChat() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
} 