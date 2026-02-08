import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { joinRoomAsGuest } from '../services/room';
import { FaArrowRight } from 'react-icons/fa';

export default function Join() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [name, setName] = useState('');
    const [roomId, setRoomId] = useState(searchParams.get('room') || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !roomId) return;

        setIsLoading(true);
        setError('');

        try {
            const guest = await joinRoomAsGuest(roomId.toUpperCase(), name);
            // Store guest info in local storage session
            localStorage.setItem(`guest_${roomId.toUpperCase()}`, JSON.stringify(guest));
            navigate(`/guest/${roomId.toUpperCase()}`);
        } catch (err: any) {
            console.error(err);
            setError('Could not join room. Check the code and try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-vinyl-black p-6">
            <div className="w-full max-w-md bg-surface-gray p-8 rounded-2xl shadow-xl border border-gray-800">
                <h2 className="text-3xl font-bold text-white mb-2 text-center">Join the Party</h2>
                <p className="text-gray-400 text-center mb-8">Enter your name to start singing.</p>

                <form onSubmit={handleJoin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Room Code</label>
                        <input
                            type="text"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                            placeholder="ABCD"
                            className="w-full bg-black/50 border border-gray-700 rounded-xl p-4 text-white text-lg font-mono focus:border-singnow-red focus:ring-1 focus:ring-singnow-red outline-none transition-colors"
                            maxLength={4}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Mike R."
                            className="w-full bg-black/50 border border-gray-700 rounded-xl p-4 text-white text-lg focus:border-singnow-red focus:ring-1 focus:ring-singnow-red outline-none transition-colors"
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-singnow-red hover:bg-red-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? 'Joining...' : (
                            <>
                                Enter Stage <FaArrowRight />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
