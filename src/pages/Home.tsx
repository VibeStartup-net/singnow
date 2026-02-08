import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { createRoom } from '../services/room';
import { FaMicrophone, FaMusic } from 'react-icons/fa';

export default function Home() {
    const navigate = useNavigate();
    const [isCreating, setIsCreating] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleHost = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const userCred = await signInWithEmailAndPassword(auth, email, password);
            const roomId = await createRoom(userCred.user.uid);
            navigate(`/host/${roomId}`);
        } catch (err) {
            console.error("Error creating room:", err);
            alert("Could not start party. Check console for details.");
            setIsCreating(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-vinyl-black relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-singnow-red blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-queue-blue blur-[120px]"></div>
            </div>

            <div className="z-10 text-center px-6 max-w-md w-full">
                <div className="mb-12 flex justify-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-singnow-red to-orange-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-singnow-red/30">
                        <FaMicrophone className="text-white text-4xl" />
                    </div>
                </div>

                <h1 className="text-5xl font-bold mb-4 tracking-tight">SingNow</h1>
                <p className="text-gray-400 mb-12 text-lg">The modern jukebox for your party.</p>

                <div className="space-y-4">
                    {!showLogin ? (
                        <button
                            onClick={() => setShowLogin(true)}
                            className="w-full bg-singnow-red hover:bg-red-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-singnow-red/25 flex items-center justify-center gap-3"
                        >
                            <FaMusic /> Host a Party
                        </button>
                    ) : (
                        <form onSubmit={handleHost} className="space-y-4 bg-white/10 p-6 rounded-xl border border-white/10">
                            <h3 className="text-white font-bold text-lg mb-4">Host Login</h3>
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/40 border border-gray-600 rounded-lg py-3 px-4 text-white focus:border-singnow-red focus:outline-none"
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/40 border border-gray-600 rounded-lg py-3 px-4 text-white focus:border-singnow-red focus:outline-none"
                                required
                            />
                            <button
                                type="submit"
                                disabled={isCreating}
                                className="w-full bg-singnow-red hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg shadow-singnow-red/25 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreating ? 'Creating Room...' : 'Start Party'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowLogin(false)}
                                className="w-full text-gray-400 hover:text-white text-sm py-2"
                            >
                                Cancel
                            </button>
                        </form>
                    )}

                    <button
                        onClick={() => navigate('/join')}
                        className="w-full bg-surface-gray hover:bg-gray-800 text-white font-semibold py-4 px-6 rounded-xl transition-all border border-gray-700 hover:border-gray-500"
                    >
                        Join a Party
                    </button>
                </div>
            </div>
        </div>
    );
}
