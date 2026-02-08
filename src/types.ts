export interface Song {
    id: string; // Video ID
    title: string;
    channelTitle: string;
    thumbnail: string;
    addedBy: string; // User name
    addedAt: number;
}

export interface Room {
    id: string;
    hostId: string;
    currentSong: Song | null;
    queue: Song[];
    guests: Guest[];
    createdAt: number;
    isPaused?: boolean;
}

export interface Guest {
    id: string;
    name: string;
    isAdmin: boolean;
    joinedAt: number;
}
