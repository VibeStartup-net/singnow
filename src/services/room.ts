import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    onSnapshot,

    arrayRemove,
    runTransaction
} from "firebase/firestore";
import { db } from "../firebase";
import type { Room, Song, Guest } from "../types";

const ROOMS_COLLECTION = "rooms";

export const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
};

export const createRoom = async (hostId: string): Promise<string> => {
    const roomId = generateRoomId();
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);

    const roomData: Room = {
        id: roomId,
        hostId,
        currentSong: null,
        queue: [],
        guests: [],
        createdAt: Date.now(),
    };

    await setDoc(roomRef, roomData);
    return roomId;
};

export const getRoom = async (roomId: string): Promise<Room | null> => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    const snap = await getDoc(roomRef);
    return snap.exists() ? (snap.data() as Room) : null;
};

export const subscribeToRoom = (roomId: string, callback: (room: Room) => void) => {
    return onSnapshot(doc(db, ROOMS_COLLECTION, roomId), (doc) => {
        if (doc.exists()) {
            callback(doc.data() as Room);
        }
    });
};

export const addSongToQueue = async (roomId: string, song: Song) => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);

    // Use a transaction to check if we should play immediately or queue
    await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) throw new Error("Room not found");

        const room = roomDoc.data() as Room;

        // If nothing is playing, start this song immediately
        if (!room.currentSong) {
            transaction.update(roomRef, { currentSong: song });
        } else {
            // Otherwise add to queue
            transaction.update(roomRef, {
                queue: [...(room.queue || []), song]
            });
        }
    });
};

export const removeSongFromQueue = async (roomId: string, song: Song) => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    await updateDoc(roomRef, {
        queue: arrayRemove(song)
    });
};

export const playNextSong = async (roomId: string) => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);

    await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) return;

        const room = roomDoc.data() as Room;
        const queue = room.queue || [];

        if (queue.length === 0) {
            transaction.update(roomRef, { currentSong: null });
            return;
        }

        const nextSong = queue[0];
        const remainingQueue = queue.slice(1);

        transaction.update(roomRef, {
            currentSong: nextSong,
            queue: remainingQueue
        });
    });
};

export const joinRoomAsGuest = async (roomId: string, name: string): Promise<Guest> => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);

    return await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) throw new Error("Room not found");

        const room = roomDoc.data() as Room;
        const guests = room.guests || [];
        const isAdmin = guests.length === 0; // First guest is admin

        const newGuest: Guest = {
            id: Math.random().toString(36).substring(2, 10),
            name,
            isAdmin,
            joinedAt: Date.now()
        };

        transaction.update(roomRef, {
            guests: [...guests, newGuest]
        });

        return newGuest;
    });
};

// Reorder the queue (used for drag-drop or up/down buttons)
export const reorderQueue = async (roomId: string, newQueue: Song[]) => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    await updateDoc(roomRef, { queue: newQueue });
};

// Toggle a guest's admin status
export const toggleGuestAdmin = async (roomId: string, guestId: string) => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);

    await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) throw new Error("Room not found");

        const room = roomDoc.data() as Room;
        const updatedGuests = (room.guests || []).map(guest =>
            guest.id === guestId
                ? { ...guest, isAdmin: !guest.isAdmin }
                : guest
        );

        transaction.update(roomRef, { guests: updatedGuests });
    });
};

// Toggle pause state for host playback sync
export const togglePause = async (roomId: string, isPaused: boolean) => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    await updateDoc(roomRef, { isPaused });
};
