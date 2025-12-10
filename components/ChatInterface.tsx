
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendMessage, subscribeToMessages } from "@/lib/actions/chat.action";

interface ChatProps {
    threadId: string;
    currentUserId: string;
}

const ChatInterface = ({ threadId, currentUserId }: ChatProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');

    useEffect(() => {
        if (!threadId) return;
        const unsubscribe = subscribeToMessages(threadId, setMessages);
        return () => unsubscribe();
    }, [threadId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() === '') return;

        await sendMessage(threadId, currentUserId, input);
        setInput('');
    };

    return (
        <div className="flex flex-col h-[600px] border border-input rounded-xl bg-card">
            <div className="flex-1 overflow-y-auto space-y-3 p-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`max-w-[70%] p-3 rounded-xl shadow-md ${
                            msg.senderId === currentUserId 
                                ? 'ml-auto bg-primary-200 text-dark-100' // Your primary color
                                : 'mr-auto bg-dark-200 text-light-100' // Dark background color
                        }`}
                    >
                        <p className="text-sm">{msg.content}</p>
                    </div>
                ))}
            </div>
            <form onSubmit={handleSend} className="flex gap-2 p-4 border-t border-input">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Send a message..."
                    className="flex-1"
                />
                <Button type="submit">Send</Button>
            </form>
        </div>
    );
};

export default ChatInterface;