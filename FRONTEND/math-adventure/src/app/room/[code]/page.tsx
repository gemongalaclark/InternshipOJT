'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    getRoomByCode,
    joinRoom,
    listenToRoom,
    listenToParticipants,
    Room,
    Participant,
} from '@/lib/firebase';
import styles from './page.module.css';

export default function RoomPage() {
    const params = useParams();
    const router = useRouter();
    const roomCode = params.code as string;

    const [room, setRoom] = useState<Room | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [joining, setJoining] = useState(false);
    const [joined, setJoined] = useState(false);
    const [participantId, setParticipantId] = useState<string | null>(null);


    // Get player info from localStorage
    const [playerName, setPlayerName] = useState('');
    const [playerAvatar, setPlayerAvatar] = useState('🦸');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const name = localStorage.getItem('mathAdventurePlayerName') || '';
            const avatar = localStorage.getItem('mathAdventureAvatar') || '🦸';
            setPlayerName(name);
            setPlayerAvatar(avatar);
        }
    }, []);

    // Load room data
    useEffect(() => {
        async function loadRoom() {
            try {
                const roomData = await getRoomByCode(roomCode);
                if (!roomData) {
                    setError('Room not found. Please check the code and try again.');
                    setLoading(false);
                    return;
                }
                setRoom(roomData);
                setLoading(false);

                // Listen to room updates
                const unsubRoom = listenToRoom(roomData.id, (updatedRoom) => {
                    setRoom(updatedRoom);
                });

                // Listen to participants
                const unsubParticipants = listenToParticipants(roomData.id, (updatedParticipants) => {
                    setParticipants(updatedParticipants);
                });

                return () => {
                    unsubRoom();
                    unsubParticipants();
                };
            } catch (err) {
                console.error('Error loading room:', err);
                setError('Failed to load room. Please try again.');
                setLoading(false);
            }
        }

        loadRoom();
    }, [roomCode]);

    const handleJoin = async () => {
        if (!room || !playerName.trim()) return;

        setJoining(true);
        try {
            const result = await joinRoom(roomCode, playerName, playerAvatar);
            if (result) {
                setJoined(true);
                setParticipantId(result.participantId);
                // Save participant ID
                localStorage.setItem('mathAdventureParticipantId', result.participantId);
                localStorage.setItem('mathAdventureRoomId', result.room.id);
            }
        } catch (err) {
            console.error('Error joining room:', err);
            setError('Failed to join room. Please try again.');
        }
        setJoining(false);
    };

    const handleStartGame = () => {
        if (!room) return;
        router.push(`/room/${roomCode}/play?roomId=${room.id}&participantId=${participantId}`);
    };

    if (loading) {
        return (
            <main className={styles.main}>
                <div className={styles.loadingScreen}>
                    <div className={styles.spinner}></div>
                    <p>Loading room...</p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className={styles.main}>
                <div className={styles.errorScreen}>
                    <span className={styles.errorIcon}>❌</span>
                    <h2>Oops!</h2>
                    <p>{error}</p>
                    <button className={styles.backBtn} onClick={() => router.push('/')}>
                        ← Back to Home
                    </button>
                </div>
            </main>
        );
    }

    if (!room) return null;

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                {/* Room Header */}
                <div className={styles.roomHeader}>
                    <div className={styles.roomInfo}>
                        <span className={styles.roomCode}>{room.roomCode}</span>
                        <h1 className={styles.roomName}>{room.roomName}</h1>
                        <p className={styles.teacherName}>By: {room.teacherName}</p>
                    </div>
                    <div className={`${styles.statusBadge} ${styles[room.status]}`}>
                        {room.status === 'waiting' && '⏳ Waiting'}
                        {room.status === 'active' && '🎮 In Progress'}
                        {room.status === 'completed' && '✅ Completed'}
                    </div>
                </div>

                {/* Game Info */}
                <div className={styles.gameInfo}>
                    <div className={styles.infoItem}>
                        <span className={styles.infoIcon}>🎮</span>
                        <span>{room.gameMode === 'timeTrial' ? 'Time Trial' : 'Assignment'}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoIcon}>📊</span>
                        <span>Grade {room.difficulty}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoIcon}>👹</span>
                        <span>{room.monstersToDefeat} Monsters</span>
                    </div>
                    {room.gameMode === 'timeTrial' && (
                        <div className={styles.infoItem}>
                            <span className={styles.infoIcon}>⏱️</span>
                            <span>{Math.floor(room.timeLimit / 60)} min</span>
                        </div>
                    )}
                </div>

                {/* Join Section */}
                {!joined ? (
                    <div className={styles.joinSection}>
                        <div className={styles.playerPreview}>
                            <span className={styles.playerAvatar}>{playerAvatar}</span>
                            <span className={styles.playerName}>{playerName || 'Anonymous'}</span>
                        </div>

                        {!playerName && (
                            <p className={styles.warning}>
                                ⚠️ Please go back and enter your name first!
                            </p>
                        )}

                        <button
                            className={styles.joinBtn}
                            onClick={handleJoin}
                            disabled={!playerName || joining || room.status === 'completed'}
                        >
                            {joining ? 'Joining...' : '🚀 Join Game!'}
                        </button>

                        <button className={styles.backLink} onClick={() => router.push('/')}>
                            ← Back to Home
                        </button>
                    </div>
                ) : (
                    <div className={styles.waitingSection}>
                        <div className={styles.joinedMessage}>
                            <span className={styles.checkIcon}>✅</span>
                            <h2>You&apos;re In!</h2>
                            <p>Waiting for the game to start...</p>
                        </div>

                        {room.status === 'active' && (
                            <button className={styles.playBtn} onClick={handleStartGame}>
                                🎮 Start Playing!
                            </button>
                        )}

                        {room.status === 'waiting' && (
                            <p className={styles.waitingText}>
                                The teacher will start the game soon...
                            </p>
                        )}
                    </div>
                )}

                {/* Participants List */}
                <div className={styles.participantsSection}>
                    <h3 className={styles.sectionTitle}>
                        👥 Players ({participants.length})
                    </h3>
                    <div className={styles.participantsList}>
                        {participants.length === 0 ? (
                            <p className={styles.noPlayers}>No players yet. Be the first to join!</p>
                        ) : (
                            participants.map((p, index) => (
                                <div key={p.id} className={styles.participantItem}>
                                    <span className={styles.rank}>#{index + 1}</span>
                                    <span className={styles.participantAvatar}>{p.avatar}</span>
                                    <span className={styles.participantName}>{p.name}</span>
                                    <span className={styles.participantScore}>{p.score} pts</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
