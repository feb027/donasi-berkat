    // src/components/features/DonationDiscussion.jsx
    import { useState, useEffect, useCallback, useRef } from 'react';
    import { supabase } from '../../lib/supabaseClient';
    import { useAuth } from '../../contexts/AuthContext';
    import Button from '../ui/Button';
    import { Link } from 'react-router-dom'; // Import Link for login prompt
    import { PaperAirplaneIcon, ArrowUturnDownIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon, ChevronUpDownIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid'; // Added reply icon
    import { formatDistanceToNow, parseISO } from 'date-fns'; // Added date-fns imports
    import { id } from 'date-fns/locale'; // Import Indonesian locale for date-fns

    const COMMENT_LIMIT = 10; // Number of comments to load per page

    // Helper for Relative Timestamps
    function formatRelativeTime(dateString) {
        if (!dateString) return '';
        try {
            const date = parseISO(dateString); // Use parseISO for Supabase timestampz
            return formatDistanceToNow(date, { addSuffix: true, locale: id });
        } catch (error) {
            console.error("Error formatting relative time:", error);
            return ''; // Fallback
        }
    }

    // --- Confirmation Modal Component ---
    function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }) {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-60 backdrop-blur-sm" onClick={onClose}>
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-start">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-red-100 sm:mx-0 sm:h-8 sm:w-8">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" aria-hidden="true" />
                        </div>
                        <div className="ml-3 text-left">
                             <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                               {title}
                             </h3>
                             <div className="mt-1">
                                 <p className="text-sm text-gray-500">
                                     {message}
                                 </p>
                             </div>
                        </div>
                    </div>
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-2">
                        <Button
                            variant="danger"
                            onClick={onConfirm}
                            className="w-full sm:w-auto"
                        >
                            Hapus
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={onClose}
                             className="w-full sm:w-auto mt-2 sm:mt-0"
                        >
                            Batal
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Komponen untuk satu item Diskusi - Dipersiapkan untuk nesting
    function DiscussionItem({
        item,
        allItems,
        onReplyClick,
        level = 0,
        donatorId,
        user, // Pass current user
        onEdit, // Handler for edit action
        onDelete, // Handler for delete action
        isEditing, // Is this item currently being edited?
        editText, // Current text in edit mode
        onEditTextChange, // Handle changes to edit text
        onSaveEdit, // Save the edit
        onCancelEdit, // Cancel the edit
        isSavingEdit, // Loading state for saving edit
        editingItemId // Pass down editingItemId for correct isEditing checks
    }) {
        const isOwner = user && user.id === item.id_pengirim;
        const isDonatorComment = item.id_pengirim === donatorId;
        const replies = allItems.filter(reply => reply.parent_id === item.id);

        // Inline styles for indentation lines (can be moved to CSS)
        const indentationStyle = level > 0 ? {
            position: 'relative',
            paddingLeft: '1rem', // Indentation space
            marginLeft: `${(level -1) * 1.25}rem` // Base margin for levels > 0
        } : {};

        const lineStyle = level > 0 ? {
            content: '""',
            position: 'absolute',
            left: '0',
            top: '1.75rem', // Adjust vertical position to align with avatar/text
            bottom: '0',
            width: '2px',
            backgroundColor: '#e5e7eb', // gray-200
        } : {};

        // Add a state for initial animation
        const [isVisible, setIsVisible] = useState(false);
        useEffect(() => {
            // Timeout ensures the transition happens after mount
            const timer = setTimeout(() => setIsVisible(true), 10);
            return () => clearTimeout(timer);
        }, []);

        return (
            <div
                style={indentationStyle}
                className={`discussion-item comment-item ${isVisible ? 'comment-item-enter-active' : 'comment-item-enter'}`}
            >
                {level > 0 && <span style={lineStyle} aria-hidden="true"></span>}
                <div className={`relative flex items-start space-x-3 py-3 ${isDonatorComment ? 'bg-emerald-50/50 rounded-md px-2 -mx-2' : ''} ${level > 0 && !isDonatorComment ? 'pt-2' : ''}`}>
                <img
                    src={item.profil?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.profil?.nama_pengguna || '?')}&background=random&size=32`}
                    alt={item.profil?.nama_pengguna || 'User'}
                    className="h-8 w-8 rounded-full flex-shrink-0 object-cover bg-gray-200"
                        onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.profil?.nama_pengguna || '?')}&background=random&size=32`;
                            e.target.onerror = null;
                         }}
                />
                <div className="flex-grow">
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-0.5">
                           <div className="flex items-baseline space-x-2 flex-wrap mr-2">
                               <span className="font-semibold text-sm text-gray-800 flex-shrink-0">{item.profil?.nama_pengguna || 'Anonim'}</span>
                               {/* === BADGE DONATUR === */} 
                               {item.id_pengirim === donatorId && (
                                   <span className="ml-1.5 px-1.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                                       Donatur
                                   </span>
                               )}
                               {/* === END BADGE === */} 
                               <span className="text-xs text-gray-400 flex-shrink-0" title={new Date(item.created_at).toLocaleString('id-ID')}>
                                   {formatRelativeTime(item.created_at)}
                               </span>
                       </div>
                           {/* Action Buttons: Reply, Edit, Delete */}
                           <div className="flex items-center space-x-2 flex-shrink-0">
                               {!isEditing && ( // Hide actions when editing this item
                           <button
                                       onClick={() => onReplyClick(item.id, item.isi_diskusi)}
                                       disabled={isSavingEdit || !!editingItemId} // Disable if any edit saving OR any item is being edited
                                       className="text-xs text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                       title="Balas"
                                   >
                                       <ArrowUturnDownIcon className="h-3 w-3" />
                                       <span className="hidden sm:inline">Balas</span>
                           </button>
                               )}
                               {isOwner && !isEditing && ( // Show Edit/Delete only for owner & not editing
                                   <>
                                       <button
                                           onClick={() => onEdit(item.id, item.isi_diskusi)}
                                           disabled={isSavingEdit || !!editingItemId} // Disable if any edit saving OR any item is being edited
                                           className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                           title="Edit"
                                       >
                                           <PencilIcon className="h-3 w-3" />
                                            <span className="hidden sm:inline">Edit</span>
                                       </button>
                                       <button
                                           onClick={() => onDelete(item.id)} // Now opens modal
                                           disabled={isSavingEdit || !!editingItemId} // Disable if any edit saving OR any item is being edited
                                           className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                           title="Hapus"
                                       >
                                           <TrashIcon className="h-3 w-3" />
                                            <span className="hidden sm:inline">Hapus</span>
                                       </button>
                                   </>
                               )}
                           </div>
                        </div>

                        {/* Display comment text OR Edit form */}
                        {!isEditing ? (
                             <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-wrap break-words">{item.isi_diskusi}</p>
                        ) : (
                            // Edit Form with animation class control
                            <div className={`edit-form-container ${isEditing ? 'edit-form-container-visible' : ''}`}>
                                 <div className="mt-2">
                                     <textarea
                                        value={editText}
                                        onChange={onEditTextChange}
                                        rows={3}
                                        className="w-full p-2 border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm transition duration-150 ease-in-out"
                                        autoFocus
                                        // No disabled prop needed here, parent controls interaction
                                     />
                                      <div className="flex items-center justify-end space-x-2 mt-1">
                                          <Button
                                             onClick={onCancelEdit}
                                             variant="secondary" size="xs"
                                             className="inline-flex items-center justify-center"
                                             disabled={isSavingEdit}
                                         >
                                             <XMarkIcon className="h-4 w-4" /> Batal
                                         </Button>
                                         <Button
                                              onClick={() => onSaveEdit(item.id)} // Calls parent's onSaveEdit
                                              variant="success" size="xs"
                                              className="inline-flex items-center justify-center min-w-[70px]" // min-width for consistent size
                                              disabled={isSavingEdit || !editText.trim()}
                                         >
                                              {isSavingEdit ? <ArrowPathIcon className="animate-spin h-4 w-4 mr-1 spinner-centered"/> : <CheckIcon className="h-4 w-4 mr-1"/>}
                                              {isSavingEdit ? 'Menyimpan...' : 'Simpan'}
                                         </Button>
                                     </div>
                                 </div>
                             </div>
                       )}
                    </div>
                </div>
                {/* Recursive rendering for replies */}
                {replies.length > 0 && (
                    // Container for replies, applies the base margin for levels > 0
                    <div className={`replies-container ${level > 0 ? 'ml-5' : ''}`}>
                        {replies.map(reply => (
                            <DiscussionItem
                                key={reply.id}
                                item={reply}
                                allItems={allItems}
                                onReplyClick={onReplyClick}
                                level={level + 1}
                                donatorId={donatorId}
                                user={user}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                isEditing={editingItemId === reply.id} // Correct check
                                editText={editingItemId === reply.id ? editText : ''} // Pass text only if editing this item
                                onEditTextChange={onEditTextChange} // Pass parent handler
                                onSaveEdit={() => onSaveEdit(reply.id)} // Pass ID to save
                                onCancelEdit={onCancelEdit}
                                isSavingEdit={isSavingEdit} // Check saving state for this specific item
                                editingItemId={editingItemId} // Pass down for recursive checks
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // --- Main Discussion Component ---
    function DonationDiscussion({ donationId, donatorId }) {
        const { user, profile } = useAuth();
        const [discussionItems, setDiscussionItems] = useState([]);
        const [loadingDiscussion, setLoadingDiscussion] = useState(true);
        const [errorDiscussion, setErrorDiscussion] = useState(null);
        const [replyingTo, setReplyingTo] = useState(null);
        const [newDiscussionText, setNewDiscussionText] = useState('');
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [submitError, setSubmitError] = useState(null);

        // --- New State for Features ---
        const [sortOrder, setSortOrder] = useState('asc');
        const [offset, setOffset] = useState(0);
        const [hasMore, setHasMore] = useState(true);
        const [loadingMore, setLoadingMore] = useState(false);
        const [editingItemId, setEditingItemId] = useState(null); // ID of item being edited
        const [editText, setEditText] = useState(''); // Text of item being edited
        const [isSavingEdit, setIsSavingEdit] = useState(false);
        const listContainerRef = useRef(null);
        const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
        const [itemToDelete, setItemToDelete] = useState(null); // Store { id: string }
        const [isInitialLoading, setIsInitialLoading] = useState(true); // Flicker control

        // Define handlers *before* useEffect hooks that might depend on them
        const handleCancelEdit = useCallback(() => {
            setEditingItemId(null);
            setEditText('');
        }, []); // Empty dependency array makes it stable
        
        // It's good practice to define other handlers here too if they 
        // are used in useEffect or passed down and need stable references.
        // Example (adjust dependencies as needed):
        const handleEdit = useCallback((itemId, currentText) => {
            setEditingItemId(itemId);
            setEditText(currentText);
            setReplyingTo(null);
        }, []);

        const handleReplyClick = useCallback((parentId, parentText) => {
            setReplyingTo({ parentId, parentText });
            setNewDiscussionText('');
            setSubmitError(null);
            setEditingItemId(null); // Cancel edit if replying
            const formElement = document.getElementById('discussion-form');
            formElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, []);
        
        // --- Fetch Discussion with Pagination & Sorting ---
        const fetchDiscussion = useCallback(async (loadMore = false) => {
            // Prevent fetching if donationId is not set
            if (!donationId) {
                setDiscussionItems([]);
                setLoadingDiscussion(false);
                setLoadingMore(false);
                setIsInitialLoading(false);
                setHasMore(false);
                return;
            }

            const currentOffset = loadMore ? offset : 0;
            // Set main loading only on initial page/sort load
            if (!loadMore) {
            setLoadingDiscussion(true);
            } else {
                setLoadingMore(true);
            }
            setErrorDiscussion(null);

            try {
                console.log(`Fetching discussion: loadMore=${loadMore}, offset=${currentOffset}, limit=${COMMENT_LIMIT}, sort=${sortOrder}`);
                const { data, error, count: _count } = await supabase
                    .from('diskusi_donasi')
                    .select('id, isi_diskusi, created_at, id_pengirim, parent_id, profil ( nama_pengguna, avatar_url )', { count: 'exact' })
                    .eq('id_donasi', donationId)
                    .order('created_at', { ascending: sortOrder === 'asc' })
                    .range(currentOffset, currentOffset + COMMENT_LIMIT - 1);

                if (error) throw error;

                const newItems = data || [];
                console.log(`Fetched ${newItems.length} items.`);

                // Use functional update for safety
                setDiscussionItems(prev => {
                    if (!loadMore) {
                        return newItems; // Replace items on initial load
                    } else {
                        // Append new items, ensuring no duplicates if fetch/realtime overlap
                        const existingIds = new Set(prev.map(i => i.id));
                        const uniqueNewItems = newItems.filter(i => !existingIds.has(i.id));
                        return [...prev, ...uniqueNewItems];
                    }
                });
                setOffset(currentOffset + newItems.length);
                setHasMore(newItems.length === COMMENT_LIMIT);

            } catch (err) {
                console.error("Error fetching discussion:", err);
                setErrorDiscussion("Gagal memuat diskusi.");
            } finally {
                // Ensure all loading states are reset, including initial load flag
                setLoadingDiscussion(false);
                setLoadingMore(false);
                setIsInitialLoading(false); // Mark initial load phase complete
                console.log("Fetch finished, isInitialLoading set to false");
            }
        // Dependencies: Only things that change the query itself
        }, [donationId, sortOrder, offset]); 

        // --- Effect for Initial Fetch / Reset on ID/Sort Change (SINGLE EFFECT) ---
        useEffect(() => {
            console.log(`Effect running: donationId=${donationId}, sortOrder=${sortOrder}`);
            // When ID or sort order changes:
            setIsInitialLoading(true); // Mark as new initial load phase
            setOffset(0);              // Reset pagination
            setHasMore(true);          // Assume more might exist
            setDiscussionItems([]);    // Clear existing items immediately
            setReplyingTo(null);       // Reset reply state
            setEditingItemId(null);    // Reset edit state
            setEditText('');
            setErrorDiscussion(null);    // Clear previous errors
            
            // Trigger the fetch directly if donationId is valid
            if (donationId) {
                console.log("Triggering fetch from initial effect");
                // Call fetchDiscussion, which uses the just-reset offset (0)
                fetchDiscussion(false); 
            } else {
                // If donationId becomes null, ensure loading flags are reset
                setIsInitialLoading(false);
                setLoadingDiscussion(false); 
            }
            // This effect now ONLY runs when donationId or sortOrder changes
        }, [donationId, sortOrder]); // REMOVED fetchDiscussion from dependencies

        // --- Realtime Handler ---
        useEffect(() => {
            if (!donationId) return;
            console.log(`Subscribing to realtime for ${donationId}`);
            
            const handleNewDiscussionItem = async (_payload) => {
                let profileData = null;
                try {
                    const { data: fetchedProfile, error: profileError } = await supabase
                        .from('profil')
                        .select('*')
                        .eq('id', _payload.new.id_pengirim)
                        .single();
                    if (profileError) throw profileError;
                    profileData = fetchedProfile;
                } catch(_err) {
                    console.error("[Realtime] Error fetching profile for new discussion item:", _err);
                }
                const newItem = { ..._payload.new, profil: profileData };
                
                // Restore state update logic using newItem
                setDiscussionItems(current => {
                    if (current.some(item => item.id === newItem.id)) return current; // Prevent duplicates
                    const newItems = [...current, newItem];
                    // Sort based on current sortOrder state
                    return newItems.sort((a, b) => {
                        const dateA = new Date(a.created_at);
                        const dateB = new Date(b.created_at);
                        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
                    });
                });
            };

            const handleUpdateDiscussionItem = (_payload) => {
                console.log('[Realtime] Updated discussion item received:', _payload.new);
                if (editingItemId === _payload.new.id) {
                    setEditText(_payload.new.isi_diskusi);
                }
                setDiscussionItems(current => current.map(item =>
                    item.id === _payload.new.id ? { ...item, isi_diskusi: _payload.new.isi_diskusi } : item
                ));
            };

             const handleDeleteDiscussionItem = (_payload) => {
                 console.log('[Realtime] Deleted discussion item received:', _payload.old);
                 if (editingItemId === _payload.old.id) {
                     handleCancelEdit(); 
                 }
                 setDiscussionItems(current => current.filter(item => item.id !== _payload.old.id));
             };

            // Subscribe using the defined handlers
            const channel = supabase.channel(`discussion:${donationId}`)
               .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'diskusi_donasi', filter: `id_donasi=eq.${donationId}` }, handleNewDiscussionItem)
               .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'diskusi_donasi', filter: `id_donasi=eq.${donationId}` }, handleUpdateDiscussionItem) 
               .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'diskusi_donasi', filter: `id_donasi=eq.${donationId}` }, handleDeleteDiscussionItem) 
               // Add underscore to unused status and err parameters
               .subscribe((_status, _err) => { 
                    // Optional: Log status changes or errors for debugging
                    // console.log('[Realtime] Status:', _status, 'Error:', _err);
                    if (_status === 'CHANNEL_ERROR') console.error('Realtime channel error:', _err);
                 });

            return () => { 
                console.log(`Unsubscribing from realtime for ${donationId}`);
                supabase.removeChannel(channel); 
            };
        // Dependencies remain the same for realtime
        }, [donationId, editingItemId, sortOrder, handleCancelEdit]); 

        // Other handlers can be defined here or above using useCallback as needed
        const handleSaveEdit = async (itemId) => {
            if (!editText.trim() || !itemId) return;
            setIsSavingEdit(true);
            try {
                const { error } = await supabase
                    .from('diskusi_donasi')
                    .update({ isi_diskusi: editText.trim() })
                    .eq('id', itemId)
                    .eq('id_pengirim', user.id); // Ensure owner

                if (error) throw error;

                 // Optimistic UI update (realtime should also catch this)
                 setDiscussionItems(current => current.map(item =>
                     item.id === itemId ? { ...item, isi_diskusi: editText.trim() } : item
                 ));

                handleCancelEdit(); // Close edit mode on success
            } catch (err) {
                console.error("Error saving edit:", err);
                // TODO: Show error to user?
            } finally {
                setIsSavingEdit(false);
            }
        };

         const handleDelete = (itemId) => {
            // Open the modal instead of confirming directly
            setItemToDelete({ id: itemId });
            setIsDeleteModalOpen(true);
        };

        const confirmDelete = async () => {
            if (!itemToDelete) return;
            const itemId = itemToDelete.id;
            setIsDeleteModalOpen(false); // Close modal immediately

            try {
                 // If deleting the item currently being edited, cancel edit mode first
                 if (editingItemId === itemId) {
                     handleCancelEdit();
                 }

                const { error } = await supabase
                    .from('diskusi_donasi')
                    .delete()
                    .eq('id', itemId)
                    .eq('id_pengirim', user.id);

                if (error) throw error;

                 // Optimistic update done via Realtime listener now
                 // setDiscussionItems(current => current.filter(item => item.id !== itemId));
                 setItemToDelete(null); // Clear item to delete

            } catch (err) {
                console.error("Error deleting comment:", err);
                setItemToDelete(null); // Clear item even on error
                // TODO: Show persistent error to user?
            }
        };

         const handleCloseDeleteModal = () => {
             setIsDeleteModalOpen(false);
             setItemToDelete(null);
         };

        const handleSubmit = async (e) => {
            e.preventDefault();
            const content = newDiscussionText;
            const parentId = replyingTo?.parentId || null; // parentId dari state replyingTo

            if (!content.trim() || !user) return; // Hanya butuh user login

            setIsSubmitting(true);
            setSubmitError(null);

            try {
                const { data: _insertedData, error } = await supabase
                    .from('diskusi_donasi')
                    .insert({
                        id_donasi: donationId,
                        id_pengirim: user.id,
                        isi_diskusi: content.trim(),
                        parent_id: parentId
                    })
                    .select().single();

                 if (error) throw error;

                // Clear form and reset reply state
                setNewDiscussionText('');
                setReplyingTo(null);

                // --- Optimistic UI update (alternative to realtime if needed) ---
                // (Realtime should handle this, but keep as fallback/option)
                // const newItemWithProfile = { ...insertedData, profil: { nama_pengguna: user.user_metadata?.nama_pengguna, avatar_url: user.user_metadata?.avatar_url }};
                // setDiscussionItems(current => {
                //     const newItems = [...current, newItemWithProfile];
                //     return newItems.sort((a, b) => { /* ... sort logic ... */ });
                // });

            } catch (err) {
                console.error(`Error submitting discussion:`, err);
                setSubmitError(err.message || `Gagal mengirim. Silakan coba lagi.`);
            } finally {
                setIsSubmitting(false);
            }
        };

        // --- Load More Handler ---
        const handleLoadMore = () => {
            if (!loadingMore) {
                fetchDiscussion(true);
            }
        };

        // Filter top-level items for initial rendering based on current items
        const topLevelItems = discussionItems.filter(item => item.parent_id === null);

        return (
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-semibold text-gray-800">Diskusi ({discussionItems.length})</h3>
                     {/* --- Sort Dropdown --- */}
                     <div className="relative inline-block text-left">
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="appearance-none inline-flex justify-center items-center gap-x-1.5 rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none"
                            disabled={loadingDiscussion || loadingMore}
                        >
                           <option value="asc">Terlama</option>
                           <option value="desc">Terbaru</option>
                        </select>
                         {/* Optional: Custom dropdown arrow */}
                         <ChevronUpDownIcon className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                     </div>
                 </div>

                 {/* Conditional Rendering based on isInitialLoading */} 
                 {isInitialLoading ? (
                     // --- Initial Loading Spinner --- 
                     <div className="flex justify-center items-center p-10 text-gray-500">
                         <ArrowPathIcon className="animate-spin h-5 w-5 mr-2"/>
                         <span>Memuat diskusi...</span>
                     </div>
                 ) : (
                     // --- Content Area (Render after initial load) --- 
                     <>
                         <div ref={listContainerRef} className="space-y-1 mb-6 max-h-[600px] overflow-y-auto pr-2 -mr-1 custom-scrollbar">
                             {/* --- Error State --- */}
                             {errorDiscussion && (
                                 <p className="text-sm text-red-600 p-4 text-center">{errorDiscussion}</p>
                             )}
                             {/* --- Empty State --- */} 
                             {!errorDiscussion && discussionItems.length === 0 && (
                                 <p className="text-sm text-gray-500 p-4 text-center">Belum ada diskusi untuk donasi ini.</p>
                             )}

                             {/* --- Render Discussion Items --- */}
                             {discussionItems.length > 0 && topLevelItems.map(item => (
                            <DiscussionItem
                                     key={item.id}
                                     item={item}
                                     allItems={discussionItems}
                                onReplyClick={handleReplyClick}
                                     level={0}
                                     donatorId={donatorId}
                                     user={user}
                                     onEdit={handleEdit}
                                     onDelete={handleDelete}
                                     isEditing={editingItemId === item.id}
                                     editText={editText}
                                     onEditTextChange={(e) => setEditText(e.target.value)}
                                     onSaveEdit={handleSaveEdit}
                                     onCancelEdit={handleCancelEdit}
                                     isSavingEdit={isSavingEdit}
                                     editingItemId={editingItemId}
                                 />
                             ))}

                             {/* --- Load More Button --- */} 
                             {hasMore && !loadingDiscussion && (
                                 <div className="text-center pt-4">
                                      <Button onClick={handleLoadMore} disabled={loadingMore} variant="outline" size="sm" className="inline-flex items-center justify-center min-w-[150px]">
                                           {loadingMore ? <ArrowPathIcon className="animate-spin h-4 w-4 mr-2 spinner-centered"/> : null}
                                           {loadingMore ? 'Memuat...' : 'Muat Komentar Lainnya'}
                                              </Button>
                                          </div>
                             )}
                             {/* Optional: Add loading more indicator? */} 
                             {loadingMore && <div className="text-center p-2 text-sm text-gray-400">Memuat...</div>}
                 </div>

                         {/* --- Form Input Diskusi --- */}
                          {user ? (
                               <form id="discussion-form" onSubmit={handleSubmit} className="border-t border-gray-200 pt-4">
                                   {/* Indikator Sedang Membalas */} 
                                   {replyingTo && (
                                        <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-100 rounded-md flex justify-between items-center">
                                            <span>Membalas: "{replyingTo.parentText?.substring(0, 50)}..."</span>
                                            <button type="button" onClick={() => {setReplyingTo(null); setSubmitError(null);}} className="font-medium text-emerald-600 hover:text-emerald-800" disabled={isSubmitting || isSavingEdit}>Batal</button>
                                        </div>
                                   )}
                                   {/* --- Editing indicator (optional) --- */}
                                   {editingItemId && (
                                        <div className="text-xs text-gray-500 mb-2 p-2 bg-blue-50 rounded-md flex justify-between items-center">
                                            <span>Mode Edit Aktif (Scroll ke komentar yang diedit)</span>
                                            <button type="button" onClick={handleCancelEdit} className="font-medium text-blue-600 hover:text-blue-800" disabled={isSavingEdit}>Batal Edit</button>
                                        </div>
                                   )}

                                   <div className="flex items-start space-x-3"> 
                                       {/* Prioritize profile.avatar_url from context */}
                                       <img 
                                           src={profile?.avatar_url || user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.nama_pengguna || user.email || '?')}&background=random&size=32`} 
                                           alt="User Avatar" 
                                           className="h-8 w-8 rounded-full flex-shrink-0 object-cover bg-gray-200 mt-1"
                                           onError={(e) => { 
                                               e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.nama_pengguna || user.email || '?')}&background=random&size=32`;
                                               e.target.onerror = null;
                                           }}
                                       />
                           <div className="flex-grow">
                                            <textarea
                                                value={newDiscussionText}
                                                onChange={(e) => setNewDiscussionText(e.target.value)}
                                                placeholder={editingItemId ? "Edit komentar di atas..." : (replyingTo ? "Tulis balasan Anda..." : "Tulis komentar Anda...")}
                                                rows={replyingTo ? 2 : 3}
                                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm transition duration-150 ease-in-out disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                required
                                                disabled={isSubmitting || !!editingItemId || isSavingEdit} // Disable if submitting OR editing OR saving edit
                                                autoFocus={!!replyingTo}
                                            />
                                            {submitError && <p className="text-xs text-red-600 mt-1">{submitError}</p>}
                                <div className="flex justify-end mt-2">
                                                <Button
                                                    type="submit"
                                                    variant="primary"
                                                    size="sm"
                                                    disabled={isSubmitting || !newDiscussionText.trim() || !!editingItemId || isSavingEdit}
                                                    className="inline-flex items-center justify-center min-w-[80px]"
                                                >
                                                    {isSubmitting ? <ArrowPathIcon className="animate-spin h-4 w-4 mr-1 spinner-centered"/> : null}
                                                    {isSubmitting ? 'Mengirim...' : (replyingTo ? 'Kirim Balasan' : 'Kirim')}
                                    </Button>
                                            </div>
                                </div>
                           </div>
                       </form>
                          ) : (
                               <p className="text-xs text-gray-500 border-t border-gray-200 pt-3 text-center">
                                  Silakan <Link to="/login" className="text-emerald-600 hover:underline">masuk</Link> untuk berdiskusi.
                               </p>
                          )}
                     </>
                 )}

                 {/* --- Delete Confirmation Modal --- */}
                  <ConfirmationModal
                      isOpen={isDeleteModalOpen}
                      onClose={handleCloseDeleteModal}
                      onConfirm={confirmDelete}
                      title="Hapus Komentar"
                      message="Apakah Anda yakin ingin menghapus komentar ini? Aksi ini tidak dapat dibatalkan."
                  />
            </div>
        );
    }

    export default DonationDiscussion;