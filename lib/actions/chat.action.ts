"use client";

import { db } from "@/firebase/client";
import { collection, addDoc, query, where, orderBy, onSnapshot, limit, getDocs } from "firebase/firestore";

// Find or create a thread between two participants
export async function findOrCreateChatThread(userId: string, businessId: string, jobId?: string, gigId?: string): Promise<string> {
    const participants = [userId, businessId].sort();
    
    // Check for existing thread
    const q = query(
        collection(db, "chatThreads"),
        where("participants", "==", participants),
        limit(1)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        return snapshot.docs[0].id;
    }

    // Create new thread
    const newThread = {
        participants,
        jobId: jobId || null,
        gigId: gigId || null,
        lastMessageAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, "chatThreads"), newThread);
    return docRef.id;
}

// Send a message
export async function sendMessage(threadId: string, senderId: string, content: string) {
    const threadRef = collection(db, "chatThreads", threadId, "messages");
    const message = {
        threadId,
        senderId,
        content,
        timestamp: new Date().toISOString(),
    };
    await addDoc(threadRef, message);
}

// Real-time listener for messages
export function subscribeToMessages(threadId: string, callback: (messages: ChatMessage[]) => void) {
    const messagesRef = collection(db, "chatThreads", threadId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ChatMessage[];
        callback(messages);
    });
}