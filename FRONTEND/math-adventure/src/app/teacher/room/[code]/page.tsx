'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    onAuthStateChange,
    getRoomByCode,
    listenToRoom,
    listenToParticipants,
    startRoom,
    endRoom,
    closeRoom,
    banStudent,
    Room,
    Participant,
} from '@/lib/firebase';
import { User } from 'firebase/auth';
import styles from './page.module.css';

export default function TeacherRoomPage() {
    const params = useParams();
    const router = useRouter();
    const roomCode = params.code as string;

    const [user, setUser] = useState<User | null>(null);
    const [room, setRoom] = useState<Room | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (authUser) => {
            if (!authUser) {
                router.push('/teacher');
                return;
            }
            setUser(authUser);

            try {
                const roomData = await getRoomByCode(roomCode);
                if (!roomData) {
                    setError('Room not found');
                    setLoading(false);
                    return;
                }

                // Check if this teacher owns the room
                if (roomData.teacherId !== authUser.uid) {
                    setError('You do not have access to this room');
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
                setError('Failed to load room');
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [roomCode, router]);

    const handleStartGame = async () => {
        if (!room) return;
        setActionLoading(true);
        try {
            await startRoom(room.id);
        } catch (err) {
            console.error('Error starting game:', err);
        }
        setActionLoading(false);
    };

    const handleEndGame = async () => {
        if (!room || !confirm('Are you sure you want to end the game?')) return;
        setActionLoading(true);
        try {
            await endRoom(room.id);
        } catch (err) {
            console.error('Error ending game:', err);
        }
        setActionLoading(false);
    };

    const handleCloseRoom = async () => {
        if (!room || !confirm('Are you sure you want to close this room? Students will no longer be able to join, but all data will be preserved.')) return;
        setActionLoading(true);
        try {
            await closeRoom(room.id);
        } catch (err) {
            console.error('Error closing room:', err);
        }
        setActionLoading(false);
    };

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomCode);
        alert(`Room code ${roomCode} copied!`);
    };

    const handleBanStudent = async (participant: Participant) => {
        if (!room) return;
        const confirmBan = confirm(`Are you sure you want to ban ${participant.name} from this room? They will be removed and cannot rejoin.`);
        if (!confirmBan) return;

        try {
            await banStudent(room.id, participant.id, participant.name);
        } catch (err) {
            console.error('Error banning student:', err);
            alert('Failed to ban student. Please try again.');
        }
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
                    <h2>Error</h2>
                    <p>{error}</p>
                    <button className={styles.backBtn} onClick={() => router.push('/teacher/dashboard')}>
                        ← Back to Dashboard
                    </button>
                </div>
            </main>
        );
    }

    if (!room) return null;

    const totalScore = participants.reduce((sum, p) => sum + p.score, 0);
    const avgAccuracy = participants.length > 0
        ? Math.round(participants.reduce((sum, p) => sum + (p.totalAnswers > 0 ? (p.correctAnswers / p.totalAnswers) * 100 : 0), 0) / participants.length)
        : 0;

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                {/* Header */}
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => router.push('/teacher/dashboard')}>
                        ← Dashboard
                    </button>
                    <div className={styles.roomTitle}>
                        <h1>{room.roomName}</h1>
                        <div className={styles.roomCodeBadge} onClick={copyRoomCode}>
                            <span>{room.roomCode}</span>
                            <span className={styles.copyIcon}>📋</span>
                        </div>
                    </div>
                </header>

                {/* Status & Controls */}
                <div className={styles.controlPanel}>
                    <div className={styles.statusSection}>
                        <span className={`${styles.statusDot} ${styles[room.status]}`}></span>
                        <span className={styles.statusText}>
                            {room.status === 'waiting' && 'Waiting for students...'}
                            {room.status === 'active' && '🎮 Game in Progress'}
                            {room.status === 'completed' && '✅ Game Completed'}
                            {room.status === 'closed' && '🔒 Room Closed'}
                        </span>
                    </div>

                    <div className={styles.controlButtons}>
                        {room.status === 'waiting' && (
                            <button
                                className={styles.startBtn}
                                onClick={handleStartGame}
                                disabled={participants.length === 0 || actionLoading}
                            >
                                {actionLoading ? 'Starting...' : '🚀 Start Game'}
                            </button>
                        )}
                        {room.status === 'active' && (
                            <button
                                className={styles.endBtn}
                                onClick={handleEndGame}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Ending...' : '🛑 End Game'}
                            </button>
                        )}
                        {room.status === 'completed' && (
                            <span className={styles.completedText}>Game has ended</span>
                        )}
                        {room.status === 'closed' && (
                            <span className={styles.completedText}>Room is closed</span>
                        )}
                        {(room.status === 'waiting' || room.status === 'active') && (
                            <button
                                className={styles.closeBtn}
                                onClick={handleCloseRoom}
                                disabled={actionLoading}
                            >
                                🔒 Close Room
                            </button>
                        )}
                    </div>
                </div>

                {/* Game Settings */}
                <div className={styles.settingsPanel}>
                    <div className={styles.settingItem}>
                        <span className={styles.settingIcon}>🎮</span>
                        <span>{room.gameMode === 'timeTrial' ? 'Time Trial' : 'Assignment'}</span>
                    </div>
                    <div className={styles.settingItem}>
                        <span className={styles.settingIcon}>📊</span>
                        <span>Grade {room.difficulty}</span>
                    </div>
                    <div className={styles.settingItem}>
                        <span className={styles.settingIcon}>➕</span>
                        <span className={styles.capitalize}>{room.operation}</span>
                    </div>
                    <div className={styles.settingItem}>
                        <span className={styles.settingIcon}>👹</span>
                        <span>{room.monstersToDefeat} monsters</span>
                    </div>
                    {room.gameMode === 'timeTrial' && (
                        <div className={styles.settingItem}>
                            <span className={styles.settingIcon}>⏱️</span>
                            <span>{Math.floor(room.timeLimit / 60)} min</span>
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{participants.length}</span>
                        <span className={styles.statLabel}>Students</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{totalScore}</span>
                        <span className={styles.statLabel}>Total Score</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{avgAccuracy}%</span>
                        <span className={styles.statLabel}>Avg Accuracy</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>
                            {participants.filter(p => p.completedAt).length}
                        </span>
                        <span className={styles.statLabel}>Completed</span>
                    </div>
                </div>

                {/* Leaderboard */}
                <div className={styles.leaderboardSection}>
                    <h2 className={styles.sectionTitle}>🏆 Live Leaderboard</h2>

                    {participants.length === 0 ? (
                        <div className={styles.emptyState}>
                            <span className={styles.emptyIcon}>👥</span>
                            <p>No students have joined yet.</p>
                            <p className={styles.shareText}>
                                Share the room code <strong>{room.roomCode}</strong> with your students!
                            </p>
                        </div>
                    ) : (
                        <div className={styles.leaderboard}>
                            {participants.map((p, index) => (
                                <div
                                    key={p.id}
                                    className={`${styles.leaderboardItem} ${index < 3 ? styles[`rank${index + 1}`] : ''}`}
                                >
                                    <span className={styles.rank}>
                                        {index === 0 && '🥇'}
                                        {index === 1 && '🥈'}
                                        {index === 2 && '🥉'}
                                        {index > 2 && `#${index + 1}`}
                                    </span>
                                    <span className={styles.avatar}>{p.avatar}</span>
                                    <div className={styles.playerInfo}>
                                        <span className={styles.playerName}>{p.name}</span>
                                        <span className={styles.playerStats}>
                                            {p.correctAnswers}/{p.totalAnswers} correct • {p.monstersDefeated} 👹
                                        </span>
                                    </div>
                                    <div className={styles.scoreSection}>
                                        <span className={styles.score}>{p.score}</span>
                                        <span className={styles.scoreLabel}>pts</span>
                                    </div>
                                    {p.completedAt && (
                                        <span className={styles.completedBadge}>✅</span>
                                    )}
                                    <button
                                        className={styles.banBtn}
                                        onClick={() => handleBanStudent(p)}
                                        title={`Ban ${p.name}`}
                                    >
                                        🚫
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
