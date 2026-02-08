import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import YouTube from 'react-youtube';
import { QRCodeCanvas } from 'qrcode.react';
import { subscribeToRoom, playNextSong } from '../services/room';
import type { Room } from '../types';

export default function Host() {
    const { roomId } = useParams();
    const [room, setRoom] = useState<Room | null>(null);
    const [player, setPlayer] = useState<any>(null);
    const [showNextToast, setShowNextToast] = useState(false);
    const lastPauseState = useRef<boolean | undefined>(undefined);

    // URL for guests to join
    const joinUrl = `${window.location.protocol}//${window.location.host}/guest/${roomId}`;

    useEffect(() => {
        if (!roomId) return;
        const unsubscribe = subscribeToRoom(roomId, (data) => {
            setRoom(data);
        });
        return () => unsubscribe();
    }, [roomId]);

    // Sync pause state from Firestore
    useEffect(() => {
        if (!player || room?.isPaused === undefined) return;

        // Only act if pause state changed
        if (lastPauseState.current !== room.isPaused) {
            lastPauseState.current = room.isPaused;
            if (room.isPaused) {
                player.pauseVideo();
            } else {
                player.playVideo();
            }
        }
    }, [player, room?.isPaused]);

    // Check progress for "Up Next" toast
    useEffect(() => {
        if (!player) return;

        const interval = setInterval(async () => {
            try {
                const currentTime = await player.getCurrentTime();
                const duration = await player.getDuration();

                if (duration - currentTime <= 15 && duration > 0 && room?.queue?.length) {
                    setShowNextToast(true);
                } else {
                    setShowNextToast(false);
                }
            } catch (e) {
                // Player might not be ready
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [player, room?.queue]);

    const onPlayerReady = (event: any) => {
        setPlayer(event.target);
        event.target.playVideo();
    };

    const handleVideoEnd = () => {
        if (roomId) {
            playNextSong(roomId);
        }
    };

    if (!room) return <div className="h-screen flex items-center justify-center text-white">Loading Stage...</div>;

    const currentSong = room.currentSong;

    return (
        <div className="h-screen w-screen bg-black overflow-hidden relative font-sans">

            {currentSong ? (
                // Active Player View - Display Only (controlled from mobile)
                <div className="w-full h-full relative">
                    <div className="pointer-events-none absolute inset-0 z-0">
                        <YouTube
                            videoId={currentSong.id}
                            opts={{
                                height: '100%',
                                width: '100%',
                                playerVars: {
                                    autoplay: 1,
                                    controls: 0,
                                    disablekb: 1,
                                    fs: 0,
                                    modestbranding: 1,
                                    rel: 0,
                                    showinfo: 0,
                                    iv_load_policy: 3
                                },
                            }}
                            className="w-full h-full absolute inset-0"
                            onReady={onPlayerReady}
                            onEnd={handleVideoEnd}
                        />
                    </div>

                    {/* Now Playing Overlay */}
                    <div className="absolute top-8 left-8 z-20">
                        <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 max-w-lg">
                            <h2 className="text-3xl font-bold text-white drop-shadow-lg line-clamp-2">{currentSong.title}</h2>
                            <div className="flex items-center gap-2 mt-2 text-gray-200">
                                <span className="text-sm font-medium bg-singnow-red px-2 py-0.5 rounded">NOW PLAYING</span>
                                <span className="text-sm opacity-80">Added by {currentSong.addedBy}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // Empty State / Lobby
                <div className="w-full h-full flex flex-col items-center justify-center relative z-10 p-8">
                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 to-black">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-singnow-red via-transparent to-transparent"></div>
                    </div>

                    <h1 className="text-6xl font-black text-white mb-6 tracking-tight relative z-10">Ready to Sing?</h1>
                    <p className="text-2xl text-gray-400 mb-12 max-w-xl text-center z-10">Scan the QR code to add songs to the queue.</p>

                    <div className="p-6 bg-white rounded-3xl shadow-2xl shadow-singnow-red/20 z-10 transform hover:scale-105 transition-transform duration-500">
                        <QRCodeCanvas value={joinUrl} size={300} />
                    </div>

                    <div className="mt-8 text-center z-10">
                        <p className="text-gray-500 uppercase text-sm font-bold tracking-widest mb-2">Room Code</p>
                        <p className="text-5xl font-mono font-bold text-singnow-red">{room.id}</p>
                    </div>
                </div>
            )}

            {/* Persistent Status Bar / QR (Bottom Right) */}
            <div className={`absolute bottom-8 right-8 z-30 flex items-end transition-all duration-500 ${currentSong ? 'opacity-100' : 'opacity-0'}`}>

                {/* Up Next Toast */}
                <div className={`bg-surface-gray/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-5 mr-6 transform transition-all duration-500 origin-right ${showNextToast ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}>
                    <div className="flex flex-col items-end text-right min-w-[200px]">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-0.5">Up Next</span>
                        <h4 className="text-sm font-bold text-white truncate max-w-[160px]">
                            {room.queue[0]?.title || "End of Queue"}
                        </h4>
                        <div className="flex items-center gap-1 justify-end">
                            <span className="text-[10px] text-gray-500">
                                {room.queue[0] ? `Added by ${room.queue[0].addedBy}` : ''}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Mini QR */}
                <div className="flex items-center gap-3 bg-surface-gray/80 backdrop-blur p-3 rounded-xl border border-white/5">
                    <div className="bg-white p-1 rounded-lg">
                        <QRCodeCanvas value={joinUrl} size={60} />
                    </div>
                    <div className="flex flex-col pr-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Scan to Join</span>
                        <span className="text-xl font-black text-singnow-red tracking-tight leading-none">{room.id}</span>
                    </div>
                </div>
            </div>

        </div>
    );
}
