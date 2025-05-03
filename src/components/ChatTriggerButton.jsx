import React from 'react';
import { useChat } from '../contexts/ChatContext';
import { ChatBubbleOvalLeftEllipsisIcon, XMarkIcon } from '@heroicons/react/24/solid';
import Button from './ui/Button';

function ChatTriggerButton() {
    const { isWidgetOpen, openChatWidget, closeChatWidget } = useChat();

    // If the widget is open, don't render the trigger button
    // (Widget itself has a close button in its header)
    if (isWidgetOpen) {
        return null;
    }

    const toggleWidget = () => {
        // Now, this button only serves to OPEN the widget
        if (isWidgetOpen) {
            closeChatWidget(); // Logic remains, but button won't be visible when open
        } else {
            openChatWidget(); // Open to conversation list by default
        }
    };

    // Render the button only if the widget is closed
    return (
        <Button
            onClick={toggleWidget}
            variant="primary" // Use primary color for visibility
            size="icon"
            className="fixed bottom-5 right-5 z-[60] rounded-full w-14 h-14 shadow-lg flex items-center justify-center transition-transform hover:scale-110 focus:ring-offset-2 focus:ring-emerald-400 bg-secondary hover:bg-emerald-700"
            title={isWidgetOpen ? "Tutup Chat" : "Buka Chat"} // Title is still technically correct based on state
            aria-label={isWidgetOpen ? "Tutup Chat" : "Buka Chat"}
        >
            {/* Since button is only visible when widget is closed, always show open icon */}
            <ChatBubbleOvalLeftEllipsisIcon className="h-7 w-7 text-white" />
        </Button>
    );
}

export default ChatTriggerButton; 