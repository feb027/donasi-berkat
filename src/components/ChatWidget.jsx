import React, { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import Button from './ui/Button';
import PropTypes from 'prop-types';
import {
    PaperAirplaneIcon,
    ArrowPathIcon,
    XMarkIcon,
    ChatBubbleOvalLeftEllipsisIcon, // Icon for trigger
    ChevronLeftIcon, // Icon for back button in chat view
    InboxIcon, // Icon for empty conversation list
    ArrowLeftIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    PhotoIcon,
} from '@heroicons/react/24/solid';
import * as HeroIconsOutline from '@heroicons/react/24/outline'; // For fallback badge icons if needed

// --- Helper Functions (Copied from ChatInterfacePage for now) ---
function formatChatTime(dateString) {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit'
      });
    } catch (err) {
        console.error("Failed to format chat time:", err);
        return '';
    }
}

const getInitials = (name) => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

// --- NEW: Date Helper Functions ---
function isSameDay(date1, date2) {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

function formatDateSeparator(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (isSameDay(date, today)) {
        return 'Hari Ini';
    }
    if (isSameDay(date, yesterday)) {
        return 'Kemarin';
    }
    // Use a more verbose format for older dates
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// --- Date Separator Component ---
function DateSeparator({ dateString }) {
    const formattedDate = formatDateSeparator(dateString);
    if (!formattedDate) return null;
    return (
        <div className="flex justify-center items-center my-4">
            <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold shadow-sm">
                {formattedDate}
            </span>
        </div>
    );
}
DateSeparator.propTypes = { dateString: PropTypes.string };

// --- Message Bubble Component (Improved Grouping) ---
function MessageBubble({ message, currentUser, showAvatar, isFirstInSequence, isLastInSequence }) {
    const isSender = message.id_pengirim === currentUser?.id;
    const senderName = message.profil?.nama_pengguna || 'User tidak dikenal';
    const senderAvatar = message.profil?.avatar_url;
    const senderInitials = getInitials(senderName);

    // Adjust border radius based on sequence
    const getBorderRadiusClasses = () => {
        let classes = 'rounded-lg';
        if (isSender) {
            classes += ' rounded-bl-none'; // Standard sender corner
            if (!isFirstInSequence) classes += ' rounded-tr-sm'; // Smoothen top right if not first
            if (!isLastInSequence) classes += ' rounded-br-sm'; // Smoothen bottom right if not last
        } else {
            classes += ' rounded-br-none'; // Standard receiver corner
            if (!isFirstInSequence) classes += ' rounded-tl-sm'; // Smoothen top left if not first
            if (!isLastInSequence) classes += ' rounded-bl-sm'; // Smoothen bottom left if not last
        }
        return classes;
    };

    const bubbleBaseClasses = `px-3 py-2 shadow-md max-w-[85%] relative text-sm ${getBorderRadiusClasses()}`;
    const senderBubbleClasses = `bg-gradient-to-br from-emerald-500 to-emerald-600 text-white ${bubbleBaseClasses}`;
    const receiverBubbleClasses = `bg-white text-text-primary border border-gray-100 ${bubbleBaseClasses}`;
    const timeClasses = isSender ? 'text-emerald-100 opacity-80' : 'text-gray-400';

    // Reduce margin bottom if it's not the last message in a sequence
    const marginBottomClass = isLastInSequence ? 'mb-1.5' : 'mb-0.5';

    return (
     <div className={`flex items-end gap-2 ${marginBottomClass} ${isSender ? 'justify-end' : 'justify-start'}`}>
        {/* Receiver Avatar Placeholder (for alignment) */}
         <div className={`flex-shrink-0 h-7 w-7 rounded-full overflow-hidden self-start ${!isSender && showAvatar ? 'opacity-100' : 'opacity-0'}`}>
             {!isSender && showAvatar && senderAvatar ? (
                 <img src={senderAvatar} alt={senderName} className="h-full w-full object-cover" />
             ) : !isSender && showAvatar ? (
                 <span className="flex items-center justify-center h-full w-full text-[10px] font-semibold text-gray-600 bg-gray-200">{senderInitials}</span>
             ) : null}
         </div>

        {/* Bubble Pesan + Tail */}
        <div className={`${isSender ? senderBubbleClasses : receiverBubbleClasses}`}>
          {/* Sender Tail - Only show if last in sequence */}
          {isSender && isLastInSequence && <div className="absolute bottom-0 -right-1.5 w-0 h-0 border-l-[6px] border-l-transparent border-t-[8px] border-t-emerald-600"></div>}
          {/* Receiver Tail - Only show if last in sequence */}
          {!isSender && isLastInSequence && <div className="absolute bottom-0 -left-1.5 w-0 h-0 border-r-[6px] border-r-transparent border-t-[8px] border-t-white"></div>}

          <p className="whitespace-pre-wrap break-words">{message.konten}</p>
          <p className={`text-[10px] mt-1 ${timeClasses} text-right`}>
            {formatChatTime(message.dibuat_pada)}
          </p>
        </div>

         {/* Sender Avatar Placeholder (for alignment) */}
          <div className={`flex-shrink-0 h-7 w-7 rounded-full overflow-hidden self-start ${isSender && showAvatar ? 'opacity-100' : 'opacity-0'}`}>
             {isSender && showAvatar && senderAvatar ? (
                 <img src={senderAvatar} alt={senderName} className="h-full w-full object-cover" />
             ) : isSender && showAvatar ? (
                 <span className="flex items-center justify-center h-full w-full text-[10px] font-semibold text-gray-600 bg-gray-200">{senderInitials}</span>
             ) : null}
          </div>
      </div>
    );
}
MessageBubble.propTypes = {
    message: PropTypes.object.isRequired,
    currentUser: PropTypes.object,
    showAvatar: PropTypes.bool,
    isFirstInSequence: PropTypes.bool,
    isLastInSequence: PropTypes.bool
};

// --- Chat Widget Component (Refactored for Conversation Model) ---
function ChatWidget() {
    const {
        currentChatId, // Represents conversation_id
        isWidgetOpen,
        closeChatWidget,
        conversationList,
        isLoadingConversations,
        errorConversations,
        setCurrentChatId, 
        resetUnreadCount
    } = useChat();
    const { user, profile } = useAuth();
    const messagesEndRef = useRef(null);

    // State for ACTIVE CHAT VIEW
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [errorMessages, setErrorMessages] = useState(null);
    const [sending, setSending] = useState(false);
    // State for partner info (can be derived from conversationList when active)
    const [activeChatPartner, setActiveChatPartner] = useState({ name: '...', avatarUrl: null });

    // Function to scroll to bottom
    const scrollToBottom = useCallback(() => {
        // Use timeout to ensure DOM is updated after messages render
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
    }, []);

    // --- Mark messages as read (uses conversation_id) ---
    const markMessagesAsRead = useCallback(async (conversationId, currentUserId) => {
        if (!conversationId || !currentUserId) return;
        console.log(`Widget: Marking messages as read for conversation ${conversationId}`);
        try {
            const { error } = await supabase
                .from('pesan')
                .update({ dibaca_pada: new Date() })
                .eq('conversation_id', conversationId) // <-- Use conversation_id
                .neq('id_pengirim', currentUserId)
                .is('dibaca_pada', null);

            if (error) {
                console.error("Error marking messages as read:", error);
            } else {
                console.log(`Widget: Messages marked as read for conversation ${conversationId}`);
                resetUnreadCount(conversationId); // Use conversation_id
            }
        } catch (err) {
            console.error("Exception marking messages as read:", err);
        }
    }, [resetUnreadCount]);

    // --- Effect for ACTIVE CHAT ---
    useEffect(() => {
        if (!currentChatId || !user?.id) {
            setMessages([]);
            setErrorMessages(null);
            setActiveChatPartner({ name: '...', avatarUrl: null });
            return;
        }

        // Mark messages as read first
        markMessagesAsRead(currentChatId, user.id);

        let channel = null;
        let isMounted = true;

        const setupActiveChat = async () => {
            setLoadingMessages(true);
            setErrorMessages(null);
            setMessages([]);
            console.log(`Widget: Setting up ACTIVE chat for conversation ${currentChatId}`);

            try {
                // 1. Get Partner Info (from conversationList)
                // We access conversationList here, but don't need it in deps
                // as it's unlikely to change mid-chat in a way that requires re-fetch
                const currentConvo = conversationList.find(c => c.conversation_id === currentChatId);
                if (currentConvo) {
                    setActiveChatPartner({
                        name: currentConvo.partner_nama_pengguna || 'User',
                        avatarUrl: currentConvo.partner_avatar_url
                    });
                } else {
                    // Fallback if convo not found (shouldn't happen ideally)
                    console.warn("Widget: Could not find conversation details in list for ID:", currentChatId);
                    setActiveChatPartner({ name: 'User', avatarUrl: null });
                }

                // 2. Fetch Initial Messages using conversation_id
                const { data: initialMessages, error: messagesError } = await supabase
                    .from('pesan')
                    .select('*, profil(nama_pengguna, avatar_url)')
                    .eq('conversation_id', currentChatId) // <-- Use conversation_id
                    .order('dibuat_pada', { ascending: true });

                if (!isMounted) return;
                if (messagesError) throw messagesError;
                setMessages(initialMessages || []);

                // 3. Setup Realtime Subscription using conversation_id
                channel = supabase.channel(`chat-widget:${currentChatId}`)
                   .on(
                     'postgres_changes',
                     { 
                       event: 'INSERT', 
                       schema: 'public', 
                       table: 'pesan', 
                       filter: `conversation_id=eq.${currentChatId}` // <-- Use conversation_id
                     },
                     async (payload) => {
                       console.log('Widget received new message:', payload.new);
                       if (!isMounted) return;
                       // Fetch profile for new message (same as before)
                       const { data: newMessageWithProfile, error: fetchNewMsgError } = await supabase
                           .from('pesan')
                           .select('*, profil(nama_pengguna, avatar_url)')
                           .eq('id', payload.new.id)
                           .single();

                       if (!isMounted) return;
                       if (fetchNewMsgError) {
                           console.error("Widget error fetching new msg profile:", fetchNewMsgError);
                           const profileFallback = payload.new.id_pengirim === user.id ? { nama_pengguna: profile?.nama_pengguna, avatar_url: profile?.avatar_url } : { nama_pengguna: activeChatPartner.name, avatar_url: activeChatPartner.avatarUrl };
                           const messageToAdd = { ...payload.new, profil: profileFallback };
                           setMessages((current) => [...current, messageToAdd]);
                       } else {
                           setMessages((current) => [...current, newMessageWithProfile]);
                       }
                     }
                   )
                   .subscribe((status, err) => {
                        if (!isMounted) return; // Check mount status in callback
                        if (status === 'SUBSCRIBED') { console.log(`Widget subscribed to chat ${currentChatId}`); }
                        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { console.error(`Widget subscription error: ${status}`, err); setErrorMessages("Koneksi realtime gagal."); }
                   });

            } catch (err) {
                console.error("Widget: Error setting up chat:", err);
                if (isMounted) setErrorMessages(err.message || "Gagal memuat chat.");
                if (channel) supabase.removeChannel(channel);
            } finally {
                if (isMounted) setLoadingMessages(false);
            }
        };

        setupActiveChat();

        // Cleanup function
        return () => {
            isMounted = false; // Set flag on unmount
            if (channel) {
                supabase.removeChannel(channel)
                  .then(() => console.log(`Widget unsubscribed from ${currentChatId}`))
                  .catch(err => console.error("Widget unsubscribing error:", err));
            }
        };
    }, [currentChatId, user?.id, profile, markMessagesAsRead]);

    // Effect to scroll to bottom when messages change in active chat
    useEffect(() => {
        // Only scroll if we are in an active chat view
        if (currentChatId && messages.length > 0) {
            scrollToBottom();
        }
    }, [messages, currentChatId, scrollToBottom]);

    // Handler kirim pesan (uses conversation_id)
    const handleSendMessage = async (e) => {
        e.preventDefault();
        const content = newMessage.trim();
        if (!content || !user || !currentChatId) return;
        setSending(true);

        try {
            // Use conversation_id instead of id_permintaan
            const messageData = { conversation_id: currentChatId, id_pengirim: user.id, konten: content }; 
            const { error: insertError } = await supabase.from('pesan').insert([messageData]);
            if (insertError) throw insertError;
            setNewMessage('');
        } catch (err) {
            console.error("Widget: Error sending message:", err);
            setErrorMessages("Gagal kirim pesan.");
            setTimeout(() => setErrorMessages(null), 3000);
        } finally {
            setSending(false);
        }
    };

    // Render nothing if the widget is not open
    if (!isWidgetOpen) return null;

    // --- RENDER LOGIC --- 
    return (
        <div className="fixed bottom-4 right-4 z-50 w-[90vw] max-w-sm h-[70vh] max-h-[550px] flex flex-col bg-white shadow-2xl rounded-lg border border-gray-200 overflow-hidden animate-fade-in-up">

            {/* --- Conditional Rendering based on currentChatId --- */}
            {currentChatId === null ? (
                // --- Conversation List View (Updated) ---
                <>
                    <header className="bg-gray-50 border-b border-gray-200 p-3 flex items-center justify-between flex-shrink-0">
                         <h2 className="text-base font-semibold text-gray-800">Percakapan</h2>
                         <Button onClick={closeChatWidget} variant="ghost" size="icon" className="text-gray-400 hover:text-gray-700">
                             <XMarkIcon className="h-5 w-5" />
                         </Button>
                     </header>
                    <div className="flex-grow overflow-y-auto">
                        {isLoadingConversations ? (
                            <div className="flex items-center justify-center h-full text-gray-500"><ArrowPathIcon className="h-6 w-6 animate-spin mr-2" /> Memuat...</div>
                        ) : errorConversations ? (
                             <div className="p-4 text-center text-red-600 text-sm">Error: {errorConversations}</div>
                        ) : conversationList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center px-4 text-gray-500">
                                <InboxIcon className="h-12 w-12 text-gray-300 mb-2" />
                                <p className="text-sm font-medium">Belum ada percakapan.</p>
                                <p className="text-xs">Mulai chat dari halaman detail donasi.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {conversationList.map(convo => {
                                    // Data now comes directly from the new RPC structure
                                    const partner = {
                                        nama_pengguna: convo.partner_nama_pengguna,
                                        avatar_url: convo.partner_avatar_url
                                    };
                                    const lastMessagePrefix = convo.last_message_sender_id === user?.id ? "Anda: " : "";
                                    const lastMessageTime = convo.last_message_created_at ? formatChatTime(convo.last_message_created_at) : '' ;

                                    return (
                                        // Use conversation_id for key and onClick
                                        <li key={convo.conversation_id} 
                                            onClick={() => setCurrentChatId(convo.conversation_id)} 
                                            className="p-3 flex items-center gap-3 hover:bg-emerald-50 cursor-pointer transition-colors duration-150"
                                        >
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                                                 {partner?.avatar_url ? (
                                                     <img src={partner.avatar_url} alt={partner.nama_pengguna} className="h-full w-full object-cover" />
                                                 ) : (
                                                     <span className="flex items-center justify-center h-full w-full text-sm font-semibold text-gray-600">{getInitials(partner?.nama_pengguna)}</span>
                                                 )}
                                             </div>
                                             <div className="flex-grow min-w-0 flex flex-col">
                                                 <div className="flex justify-between items-center">
                                                     <p className="text-sm font-semibold text-gray-800 truncate pr-2">{partner?.nama_pengguna || 'User'}</p>
                                                     {lastMessageTime && <span className="text-xs text-gray-400 flex-shrink-0">{lastMessageTime}</span>}
                                                 </div>
                                                 <div className="flex justify-between items-center mt-0.5">
                                                     <p className="text-xs text-gray-500 truncate pr-2">
                                                        {convo.last_message_content ? (
                                                            <><span className="text-gray-600">{lastMessagePrefix}</span>{convo.last_message_content}</>
                                                        ) : (
                                                             <span className="italic">Belum ada pesan</span>
                                                         )}
                                                    </p>
                                                    {convo.unread_count > 0 && (
                                                        <span className="flex-shrink-0 ml-1 px-1.5 py-0.5 bg-secondary text-white rounded-full text-[10px] font-bold leading-none">
                                                            {convo.unread_count}
                                                        </span>
                                                    )}
                                                 </div>
                                             </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </>
            ) : (
                // --- Active Chat View (Updated Header/Context) ---
                <>
                     <header className="bg-gray-50 border-b border-gray-200 p-3 flex items-center flex-shrink-0">
                         {/* Back Button */}
                         <Button onClick={() => setCurrentChatId(null)} variant="ghost" size="icon" className="mr-1 text-gray-500 hover:text-gray-800">
                            <ChevronLeftIcon className="h-5 w-5" />
                         </Button>
                         {/* Avatar (uses activeChatPartner state) */}
                         <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 overflow-hidden ring-1 ring-gray-300 mr-2">
                             {activeChatPartner.avatarUrl ? (
                                 <img src={activeChatPartner.avatarUrl} alt={activeChatPartner.name} className="h-full w-full object-cover" />
                             ) : (
                                 <span className="flex items-center justify-center h-full w-full text-xs font-semibold text-gray-600">{getInitials(activeChatPartner.name)}</span>
                             )}
                         </div>
                         {/* Info (uses activeChatPartner state, removed donation title) */}
                         <div className="flex-grow min-w-0">
                             <h2 className="text-sm font-semibold text-gray-800 truncate">{activeChatPartner.name}</h2>
                         </div>
                         {/* Close Button */}
                         <Button onClick={closeChatWidget} variant="ghost" size="icon" className="ml-2 text-gray-400 hover:text-gray-700">
                             <XMarkIcon className="h-5 w-5" />
                         </Button>
                    </header>

                    {/* Message Area */}
                    <div className="flex-grow overflow-y-auto p-3 bg-gray-100/50">
                         {loadingMessages ? (
                             <div className="flex items-center justify-center h-full"><ArrowPathIcon className="h-6 w-6 text-gray-400 animate-spin" /></div>
                         ) : errorMessages ? (
                             <div className="text-center text-red-600 text-sm p-4">Error: {errorMessages}</div>
                         ) : messages.length === 0 ? (
                             <div className="text-center text-gray-500 text-sm italic pt-10">Mulai percakapan...</div>
                         ) : (
                            React.Children.toArray(messages.map((msg, index) => {
                                const prevMsg = messages[index - 1];
                                const nextMsg = messages[index + 1];

                                // Logic for showing avatar and date separator
                                const showAvatar = !prevMsg || prevMsg.id_pengirim !== msg.id_pengirim;
                                const showDateSeparator = !prevMsg || !isSameDay(prevMsg.dibuat_pada, msg.dibuat_pada);

                                // Logic for message grouping (bubble corners)
                                const isFirstInSequence = !prevMsg || prevMsg.id_pengirim !== msg.id_pengirim;
                                const isLastInSequence = !nextMsg || nextMsg.id_pengirim !== msg.id_pengirim;

                                return (
                                   <Fragment key={msg.id}>
                                        {showDateSeparator && <DateSeparator dateString={msg.dibuat_pada} />}
                                        <MessageBubble
                                            message={msg}
                                            currentUser={user}
                                            showAvatar={showAvatar}
                                            isFirstInSequence={isFirstInSequence}
                                            isLastInSequence={isLastInSequence}
                                        />
                                   </Fragment>
                                );
                            }))
                         )}
                         <div ref={messagesEndRef} className="h-1" />
                     </div>

                    {/* Input Footer (uses handleSendMessage which is updated) */}
                     <footer className="bg-white border-t border-gray-200 p-2 flex-shrink-0">
                          <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Ketik pesan..."
                              className="flex-grow pl-3 pr-10 py-1.5 border border-gray-300 bg-gray-50 rounded-full focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-200 text-sm transition duration-150"
                              disabled={sending || loadingMessages}
                              autoComplete="off"
                            />
                            <Button
                              type="submit"
                              variant="primary"
                              size="icon"
                              className="rounded-full w-8 h-8 flex flex-shrink-0 items-center justify-center bg-secondary hover:bg-emerald-700 focus-visible:ring-emerald-500"
                              disabled={sending || loadingMessages || !newMessage.trim()}
                              title="Kirim Pesan"
                            >
                              {sending ?
                                 <ArrowPathIcon className="animate-spin h-4 w-4 text-white" /> :
                                 <PaperAirplaneIcon className="h-4 w-4 text-white" />
                              }
                            </Button>
                          </form>
                     </footer>
                </>
            )}
        </div>
    );
}

export default ChatWidget; 