import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadGuest } from '../utils/storage';
import { subscribeToRoom, addSongToQueue, removeSongFromQueue, reorderQueue, toggleGuestAdmin, playNextSong, togglePause } from '../services/room';
import { searchVideos } from '../services/youtube';
import type { VideoResult } from '../services/youtube';
import type { Room, Guest as GuestType, Song } from '../types';
import { FaSearch, FaPlus, FaTrash, FaMicrophone, FaPlay, FaPause, FaForward, FaArrowUp, FaArrowDown, FaUserShield, FaUser, FaCog, FaUsers, FaCheck } from 'react-icons/fa';
import clsx from 'clsx';

type GuestView = 'search' | 'queue' | 'controls' | 'users';

// Toast component
const Toast = ({ message, show }: { message: string; show: boolean }) => (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 bg-surface-gray border border-green-500/30 text-green-400 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-all duration-300 z-50 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <FaCheck className="text-green-500" />
        <span className="font-medium text-sm">{message}</span>
    </div>
);

export default function Guest() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [room, setRoom] = useState<Room | null>(null);
    const [guest, setGuest] = useState<GuestType | null>(null);
    const [view, setView] = useState<GuestView>('search');

    // Search State
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<VideoResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Toast state
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);

    const showToastMessage = (msg: string) => {
        setToastMessage(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
    };

    useEffect(() => {
        if (!roomId) return;

        // Load Guest from LocalStorage
        const storedGuest = loadGuest(roomId);
        if (!storedGuest) {
            navigate(`/join?room=${roomId}`);
            return;
        }
        setGuest(storedGuest);

        const unsubscribe = subscribeToRoom(roomId, (data) => {
            setRoom(data);
            // Update guest data from room in case admin status changed
            const updatedGuest = data.guests.find(g => g.id === storedGuest.id);
            if (updatedGuest) {
                setGuest(updatedGuest);
            }
        });
        return () => unsubscribe();
    }, [roomId, navigate]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        try {
            const videos = await searchVideos(query);
            setResults(videos);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddSong = async (video: VideoResult) => {
        if (!roomId || !guest) return;

        const song: Song = {
            id: video.id,
            title: video.title,
            channelTitle: video.channelTitle,
            thumbnail: video.thumbnail,
            addedBy: guest.name,
            addedAt: Date.now()
        };

        try {
            await addSongToQueue(roomId, song);
            showToastMessage('Song added to queue!');
            // Stay on find page, don't switch tabs
        } catch (e) {
            console.error(e);
            showToastMessage('Error adding song');
        }
    };

    const handleRemoveSong = async (song: Song) => {
        if (!roomId || !guest || !guest.isAdmin) return;
        if (confirm(`Remove ${song.title} from queue?`)) {
            await removeSongFromQueue(roomId, song);
        }
    };

    // Admin Controls
    const handlePlayPause = async () => {
        if (!roomId || !room) return;
        const newPausedState = !room.isPaused;
        await togglePause(roomId, newPausedState);
    };

    const handleSkip = async () => {
        if (!roomId) return;
        await playNextSong(roomId);
    };

    const handleMoveUp = async (index: number) => {
        if (!roomId || !room || index === 0) return;
        const newQueue = [...room.queue];
        [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
        await reorderQueue(roomId, newQueue);
    };

    const handleMoveDown = async (index: number) => {
        if (!roomId || !room || index >= room.queue.length - 1) return;
        const newQueue = [...room.queue];
        [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
        await reorderQueue(roomId, newQueue);
    };

    const handleToggleAdmin = async (guestId: string) => {
        if (!roomId) return;
        await toggleGuestAdmin(roomId, guestId);
    };

    if (!room || !guest) return <div className="p-8 text-center text-white">Loading...</div>;

    const isAdmin = guest.isAdmin;

    return (
        <div className="h-screen flex flex-col bg-vinyl-black font-sans">
            {/* Toast */}
            <Toast message={toastMessage} show={showToast} />

            {/* Top Bar */}
            <div className="bg-surface-gray py-4 px-6 shadow-md z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-singnow-red p-1.5 rounded-lg">
                        <FaMicrophone className="text-white" />
                    </div>
                    <span className="font-bold text-white tracking-wide">SingNow</span>
                    {isAdmin && (
                        <span className="bg-singnow-red/20 text-singnow-red text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">
                            ADMIN
                        </span>
                    )}
                </div>

                <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium text-gray-300">
                    {room.queue.length} Songs in Queue
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800 bg-surface-gray">
                <button
                    onClick={() => setView('search')}
                    className={clsx(
                        "flex-1 py-3 text-center font-bold text-xs uppercase tracking-wider transition-colors relative",
                        view === 'search' ? "text-singnow-red" : "text-gray-500 hover:text-white"
                    )}
                >
                    <FaSearch className="mx-auto mb-1" />
                    Find
                    {view === 'search' && <div className="absolute bottom-0 left-0 w-full h-1 bg-singnow-red"></div>}
                </button>
                <button
                    onClick={() => setView('queue')}
                    className={clsx(
                        "flex-1 py-3 text-center font-bold text-xs uppercase tracking-wider transition-colors relative",
                        view === 'queue' ? "text-singnow-red" : "text-gray-500 hover:text-white"
                    )}
                >
                    <FaMicrophone className="mx-auto mb-1" />
                    Queue
                    {view === 'queue' && <div className="absolute bottom-0 left-0 w-full h-1 bg-singnow-red"></div>}
                </button>
                {isAdmin && (
                    <>
                        <button
                            onClick={() => setView('controls')}
                            className={clsx(
                                "flex-1 py-3 text-center font-bold text-xs uppercase tracking-wider transition-colors relative",
                                view === 'controls' ? "text-singnow-red" : "text-gray-500 hover:text-white"
                            )}
                        >
                            <FaCog className="mx-auto mb-1" />
                            Controls
                            {view === 'controls' && <div className="absolute bottom-0 left-0 w-full h-1 bg-singnow-red"></div>}
                        </button>
                        <button
                            onClick={() => setView('users')}
                            className={clsx(
                                "flex-1 py-3 text-center font-bold text-xs uppercase tracking-wider transition-colors relative",
                                view === 'users' ? "text-singnow-red" : "text-gray-500 hover:text-white"
                            )}
                        >
                            <FaUsers className="mx-auto mb-1" />
                            Users
                            {view === 'users' && <div className="absolute bottom-0 left-0 w-full h-1 bg-singnow-red"></div>}
                        </button>
                    </>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 pb-24">

                {/* SEARCH VIEW */}
                {view === 'search' && (
                    <div className="max-w-xl mx-auto space-y-4">
                        <form onSubmit={handleSearch} className="relative">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search YouTube..."
                                className="w-full bg-surface-gray border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white focus:border-singnow-red focus:outline-none placeholder-gray-500 shadow-inner"
                            />
                        </form>

                        <div className="space-y-3">
                            {isSearching && <div className="text-center text-gray-500 py-4">Searching...</div>}

                            {results.map((video) => (
                                <div key={video.id} className="bg-surface-gray p-3 rounded-lg border border-gray-800 flex gap-3 shadow-sm hover:border-gray-600 transition-colors">
                                    <img src={video.thumbnail} alt={video.title} className="w-24 h-16 object-cover rounded bg-black" />
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <h4 className="font-bold text-sm text-white truncate" dangerouslySetInnerHTML={{ __html: video.title }}></h4>
                                        <p className="text-xs text-gray-500 truncate">{video.channelTitle}</p>
                                    </div>
                                    <button
                                        onClick={() => handleAddSong(video)}
                                        className="bg-white/5 hover:bg-singnow-red text-singnow-red hover:text-white rounded-full p-3 transition-colors flex flex-shrink-0 items-center justify-center"
                                    >
                                        <FaPlus />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* QUEUE VIEW */}
                {view === 'queue' && (
                    <div className="max-w-xl mx-auto space-y-3">
                        {room.currentSong && (
                            <div className="mb-6">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Now Playing</h3>
                                <div className="bg-gradient-to-r from-singnow-red/20 to-singnow-red/5 border border-singnow-red/30 p-4 rounded-xl flex gap-4 items-center">
                                    <img src={room.currentSong.thumbnail} alt="Now Playing" className="w-16 h-16 rounded-lg object-cover shadow-lg" />
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-white text-lg truncate">{room.currentSong.title}</h4>
                                        <p className="text-sm text-singnow-red">Added by {room.currentSong.addedBy}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Up Next</h3>
                        {room.queue.length === 0 ? (
                            <div className="text-center text-gray-500 py-8 bg-surface-gray rounded-xl border border-dashed border-gray-700">
                                Queue is empty. Add some songs!
                            </div>
                        ) : (
                            room.queue.map((song, idx) => (
                                <div key={`${song.id}-${idx}`} className="bg-surface-gray p-4 rounded-xl border border-gray-800 flex items-center gap-4 group">
                                    <span className="text-gray-500 font-mono font-bold w-6 text-center">{idx + 1}</span>
                                    <img src={song.thumbnail} alt="Thumb" className="w-12 h-12 rounded object-cover bg-black" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-white text-sm truncate">{song.title}</h4>
                                        <p className="text-xs text-gray-500">Added by {song.addedBy}</p>
                                    </div>
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleRemoveSong(song)}
                                            className="text-gray-600 hover:text-red-500 p-2 opacity-50 group-hover:opacity-100 transition-all"
                                        >
                                            <FaTrash />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* CONTROLS VIEW (Admin Only) */}
                {view === 'controls' && isAdmin && (
                    <div className="max-w-xl mx-auto space-y-6">
                        {/* Now Playing */}
                        {room.currentSong && (
                            <div className="mb-6">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Now Playing</h3>
                                <div className="bg-gradient-to-r from-singnow-red/20 to-singnow-red/5 border border-singnow-red/30 p-4 rounded-xl flex gap-4 items-center">
                                    <img src={room.currentSong.thumbnail} alt="Now Playing" className="w-16 h-16 rounded-lg object-cover shadow-lg" />
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-white text-lg truncate">{room.currentSong.title}</h4>
                                        <p className="text-sm text-singnow-red">Added by {room.currentSong.addedBy}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Playback Controls */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Playback Controls</h3>
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={handlePlayPause}
                                    className={`w-16 h-16 flex items-center justify-center rounded-full border transition-all ${room.isPaused ? 'bg-singnow-red border-singnow-red text-white' : 'bg-surface-gray border-gray-700 hover:bg-singnow-red hover:border-singnow-red text-white'}`}
                                >
                                    {room.isPaused ? <FaPlay size={24} className="ml-1" /> : <FaPause size={24} />}
                                </button>
                                <button
                                    onClick={handleSkip}
                                    className="w-16 h-16 flex items-center justify-center rounded-full bg-surface-gray border border-gray-700 hover:bg-singnow-red hover:border-singnow-red text-white transition-all"
                                    title="Skip to next song"
                                >
                                    <FaForward size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Queue Management */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Manage Queue</h3>
                            {room.queue.length === 0 ? (
                                <div className="text-center text-gray-500 py-6 bg-surface-gray rounded-xl border border-dashed border-gray-700">
                                    Queue is empty
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {room.queue.map((song, idx) => (
                                        <div key={`${song.id}-${idx}`} className="bg-surface-gray p-3 rounded-xl border border-gray-800 flex items-center gap-3">
                                            <img src={song.thumbnail} alt="Thumb" className="w-12 h-12 rounded object-cover bg-black" />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-white text-sm truncate">{song.title}</h4>
                                                <p className="text-xs text-gray-500">{song.addedBy}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleMoveUp(idx)}
                                                    disabled={idx === 0}
                                                    className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    <FaArrowUp size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleMoveDown(idx)}
                                                    disabled={idx >= room.queue.length - 1}
                                                    className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    <FaArrowDown size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveSong(song)}
                                                    className="p-2 text-gray-400 hover:text-singnow-red"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* USERS VIEW (Admin Only) */}
                {view === 'users' && isAdmin && (
                    <div className="max-w-xl mx-auto space-y-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                            Guests ({room.guests.length})
                        </h3>

                        {room.guests.length === 0 ? (
                            <div className="text-center text-gray-500 py-8 bg-surface-gray rounded-xl border border-dashed border-gray-700">
                                No guests yet
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {room.guests.map((g) => (
                                    <div key={g.id} className="bg-surface-gray p-4 rounded-xl border border-gray-800 flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${g.isAdmin ? 'bg-singnow-red' : 'bg-gray-700'}`}>
                                            {g.isAdmin ? <FaUserShield size={20} className="text-white" /> : <FaUser size={20} className="text-gray-400" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-bold truncate">
                                                {g.name}
                                                {g.id === guest.id && <span className="text-gray-500 font-normal ml-2">(You)</span>}
                                            </p>
                                            <p className="text-xs text-gray-500">{g.isAdmin ? 'Admin' : 'Guest'}</p>
                                        </div>
                                        {g.id !== guest.id && (
                                            <button
                                                onClick={() => handleToggleAdmin(g.id)}
                                                className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${g.isAdmin
                                                        ? 'bg-singnow-red/20 text-singnow-red hover:bg-singnow-red hover:text-white'
                                                        : 'bg-gray-700 text-gray-400 hover:bg-singnow-red hover:text-white'
                                                    }`}
                                            >
                                                {g.isAdmin ? 'Remove Admin' : 'Make Admin'}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
