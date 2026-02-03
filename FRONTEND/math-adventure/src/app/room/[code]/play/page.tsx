'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    generateProblem,
    checkAnswer,
    MathProblem,
    Operation,
    Difficulty,
} from '@/lib/gameEngine';
import {
    listenToRoom,
    listenToParticipants,
    updateParticipantScore,
    Room,
    Participant,
} from '@/lib/firebase';
import styles from './page.module.css';

// Monster data for multiplayer
const MULTIPLAYER_MONSTERS = [
    { emoji: '🟢', name: 'Slime', maxHealth: 3 },
    { emoji: '👺', name: 'Goblin', maxHealth: 4 },
    { emoji: '💀', name: 'Skeleton', maxHealth: 5 },
    { emoji: '👻', name: 'Ghost', maxHealth: 4 },
    { emoji: '🧛', name: 'Vampire', maxHealth: 5 },
    { emoji: '🧙', name: 'Dark Mage', maxHealth: 6 },
    { emoji: '🐲', name: 'Baby Dragon', maxHealth: 5 },
    { emoji: '👹', name: 'Ogre', maxHealth: 7 },
    { emoji: '😈', name: 'Demon', maxHealth: 6 },
    { emoji: '🐉', name: 'Dragon Lord', maxHealth: 8 },
];

interface GameState {
    currentMonster: number;
    monsterHealth: number;
    totalMonstersDefeated: number;
    currentProblem: MathProblem;
    score: number;
    correctAnswers: number;
    totalAnswers: number;
    timeLeft: number;
    isComplete: boolean;
    feedback: 'correct' | 'wrong' | null;
    playerAttacking: boolean;
    streak: number;
}

function getRandomOperation(operation: string): Operation {
    if (operation === 'mixed') {
        const ops: Operation[] = ['addition', 'subtraction', 'multiplication', 'division'];
        return ops[Math.floor(Math.random() * ops.length)];
    }
    return operation as Operation;
}

function MultiplayerBattleContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const roomId = searchParams.get('roomId');
    const participantId = searchParams.get('participantId');

    const [room, setRoom] = useState<Room | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [playerAvatar, setPlayerAvatar] = useState('🦸');
    const [loading, setLoading] = useState(true);
    const [gameEnded, setGameEnded] = useState(false);

    // Load player info
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const name = localStorage.getItem('mathAdventurePlayerName') || 'Player';
            const avatar = localStorage.getItem('mathAdventureAvatar') || '🦸';
            setPlayerName(name);
            setPlayerAvatar(avatar);
        }
    }, []);

    // Subscribe to room updates
    useEffect(() => {
        if (!roomId) {
            router.push('/');
            return;
        }

        const unsubRoom = listenToRoom(roomId, (updatedRoom) => {
            if (!updatedRoom) {
                router.push('/');
                return;
            }
            setRoom(updatedRoom);

            if (updatedRoom.status === 'completed') {
                setGameEnded(true);
            }

            // Initialize game if not started
            if (!gameState && updatedRoom.status === 'active') {
                const op = getRandomOperation(updatedRoom.operation);
                const monster = MULTIPLAYER_MONSTERS[0];
                setGameState({
                    currentMonster: 0,
                    monsterHealth: monster.maxHealth,
                    totalMonstersDefeated: 0,
                    currentProblem: generateProblem(updatedRoom.difficulty as Difficulty, op),
                    score: 0,
                    correctAnswers: 0,
                    totalAnswers: 0,
                    timeLeft: 30, // 30 seconds per question
                    isComplete: false,
                    feedback: null,
                    playerAttacking: false,
                    streak: 0,
                });
                setLoading(false);
            } else if (updatedRoom.status === 'active') {
                setLoading(false);
            }
        });

        const unsubParticipants = listenToParticipants(roomId, (updatedParticipants) => {
            setParticipants(updatedParticipants);
        });

        return () => {
            unsubRoom();
            unsubParticipants();
        };
    }, [roomId, router, gameState]);

    // Timer countdown
    useEffect(() => {
        if (!gameState || gameState.isComplete || gameEnded || loading) return;

        const timer = setInterval(() => {
            setGameState(prev => {
                if (!prev || !room) return prev;

                const newTimeLeft = prev.timeLeft - 1;

                if (newTimeLeft <= 0) {
                    // Time's up - wrong answer
                    const newTotalAnswers = prev.totalAnswers + 1;
                    const op = getRandomOperation(room.operation);

                    return {
                        ...prev,
                        timeLeft: 30,
                        totalAnswers: newTotalAnswers,
                        streak: 0,
                        currentProblem: generateProblem(room.difficulty as Difficulty, op),
                        feedback: 'wrong',
                    };
                }

                return { ...prev, timeLeft: newTimeLeft };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState?.isComplete, gameEnded, loading, room]);

    // Clear animations
    useEffect(() => {
        if (gameState?.feedback || gameState?.playerAttacking) {
            const timeout = setTimeout(() => {
                setGameState(prev => prev ? {
                    ...prev,
                    feedback: null,
                    playerAttacking: false,
                } : null);
            }, 500);
            return () => clearTimeout(timeout);
        }
    }, [gameState?.feedback, gameState?.playerAttacking]);

    // Update score in Firebase
    const updateScore = useCallback(async (state: GameState) => {
        if (!roomId || !participantId) return;

        try {
            await updateParticipantScore(roomId, participantId, {
                score: state.score,
                correctAnswers: state.correctAnswers,
                totalAnswers: state.totalAnswers,
                monstersDefeated: state.totalMonstersDefeated,
                completed: state.isComplete,
            });
        } catch (err) {
            console.error('Error updating score:', err);
        }
    }, [roomId, participantId]);

    const handleSubmit = useCallback(() => {
        if (!gameState || gameState.isComplete || !room || gameEnded) return;

        const answer = parseInt(userAnswer);
        if (isNaN(answer)) return;

        const isCorrect = checkAnswer(gameState.currentProblem, answer);
        const newTotalAnswers = gameState.totalAnswers + 1;

        if (isCorrect) {
            const newStreak = gameState.streak + 1;
            const streakBonus = Math.min(newStreak, 5) * 10;
            const basePoints = 100;
            const timeBonus = Math.floor(gameState.timeLeft * 5);
            const points = basePoints + timeBonus + streakBonus;

            const newMonsterHealth = gameState.monsterHealth - 1;
            const newCorrectAnswers = gameState.correctAnswers + 1;
            let newScore = gameState.score + points;
            let newMonstersDefeated = gameState.totalMonstersDefeated;
            let currentMonsterIdx = gameState.currentMonster;
            let newMonsterMaxHealth = newMonsterHealth;
            let isComplete = false;

            // Play correct sound
            try {
                const audio = new Audio('/sounds/correct.mp3');
                audio.volume = 0.5;
                audio.play().catch(() => { });
            } catch { }

            if (newMonsterHealth <= 0) {
                // Monster defeated!
                newMonstersDefeated++;
                newScore += 200; // Bonus for defeating monster

                if (newMonstersDefeated >= room.monstersToDefeat) {
                    // All monsters defeated!
                    isComplete = true;
                } else {
                    // Next monster
                    currentMonsterIdx = Math.min(currentMonsterIdx + 1, MULTIPLAYER_MONSTERS.length - 1);
                    newMonsterMaxHealth = MULTIPLAYER_MONSTERS[currentMonsterIdx].maxHealth;
                }
            }

            const op = getRandomOperation(room.operation);
            const newState: GameState = {
                ...gameState,
                currentMonster: currentMonsterIdx,
                monsterHealth: newMonsterHealth <= 0 ? newMonsterMaxHealth : newMonsterHealth,
                totalMonstersDefeated: newMonstersDefeated,
                currentProblem: generateProblem(room.difficulty as Difficulty, op),
                score: newScore,
                correctAnswers: newCorrectAnswers,
                totalAnswers: newTotalAnswers,
                timeLeft: 30,
                isComplete,
                feedback: 'correct',
                playerAttacking: true,
                streak: newStreak,
            };

            setGameState(newState);
            updateScore(newState);
        } else {
            // Wrong answer
            const op = getRandomOperation(room.operation);
            const newState: GameState = {
                ...gameState,
                currentProblem: generateProblem(room.difficulty as Difficulty, op),
                totalAnswers: newTotalAnswers,
                timeLeft: 30,
                feedback: 'wrong',
                streak: 0,
            };

            setGameState(newState);
            updateScore(newState);
        }

        setUserAnswer('');
    }, [gameState, userAnswer, room, gameEnded, updateScore]);

    // Handle enter key
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    }, [handleSubmit]);

    // Loading state
    if (loading) {
        return (
            <main className={styles.main}>
                <div className={styles.loadingScreen}>
                    <div className={styles.spinner}></div>
                    <p>Loading battle...</p>
                </div>
            </main>
        );
    }

    // Game completed or ended
    if (gameEnded || gameState?.isComplete) {
        const myRank = participants.findIndex(p => p.id === participantId) + 1;

        return (
            <main className={styles.main}>
                <div className={styles.resultScreen}>
                    <div className={styles.resultCard}>
                        <h1 className={styles.resultTitle}>
                            {gameState?.isComplete ? '🎉 Quest Complete!' : '⏰ Time\'s Up!'}
                        </h1>

                        <div className={styles.resultStats}>
                            <div className={styles.resultStat}>
                                <span className={styles.resultValue}>{gameState?.score || 0}</span>
                                <span className={styles.resultLabel}>Points</span>
                            </div>
                            <div className={styles.resultStat}>
                                <span className={styles.resultValue}>#{myRank || '?'}</span>
                                <span className={styles.resultLabel}>Rank</span>
                            </div>
                            <div className={styles.resultStat}>
                                <span className={styles.resultValue}>{gameState?.totalMonstersDefeated || 0}</span>
                                <span className={styles.resultLabel}>Monsters</span>
                            </div>
                        </div>

                        <div className={styles.leaderboard}>
                            <h2>🏆 Final Leaderboard</h2>
                            {participants.slice(0, 5).map((p, index) => (
                                <div
                                    key={p.id}
                                    className={`${styles.leaderItem} ${p.id === participantId ? styles.me : ''}`}
                                >
                                    <span className={styles.leaderRank}>
                                        {index === 0 && '🥇'}
                                        {index === 1 && '🥈'}
                                        {index === 2 && '🥉'}
                                        {index > 2 && `#${index + 1}`}
                                    </span>
                                    <span className={styles.leaderAvatar}>{p.avatar}</span>
                                    <span className={styles.leaderName}>{p.name}</span>
                                    <span className={styles.leaderScore}>{p.score}</span>
                                </div>
                            ))}
                        </div>

                        <button className={styles.homeBtn} onClick={() => router.push('/')}>
                            🏠 Back to Home
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    if (!gameState || !room) return null;

    const currentMonster = MULTIPLAYER_MONSTERS[gameState.currentMonster];
    const healthPercent = (gameState.monsterHealth / currentMonster.maxHealth) * 100;

    return (
        <main className={styles.main}>
            <div className={styles.battleContainer}>
                {/* Top Bar */}
                <div className={styles.topBar}>
                    <div className={styles.roomInfo}>
                        <span className={styles.roomCodeSmall}>{room.roomCode}</span>
                        <span className={styles.roomName}>{room.roomName}</span>
                    </div>
                    <div className={styles.scoreDisplay}>
                        <span className={styles.scoreValue}>{gameState.score}</span>
                        <span className={styles.scoreLabel}>pts</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className={styles.progressSection}>
                    <span className={styles.progressLabel}>
                        👹 {gameState.totalMonstersDefeated}/{room.monstersToDefeat}
                    </span>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${(gameState.totalMonstersDefeated / room.monstersToDefeat) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Battle Arena */}
                <div className={styles.battleArena}>
                    {/* Player */}
                    <div className={styles.playerSection}>
                        <div className={`${styles.playerCharacter} ${gameState.playerAttacking ? styles.attacking : ''}`}>
                            {playerAvatar}
                        </div>
                        <span className={styles.playerNameTag}>{playerName}</span>
                        {gameState.streak >= 2 && (
                            <div className={styles.streakBadge}>🔥 {gameState.streak}x</div>
                        )}
                    </div>

                    {/* VS Divider */}
                    <div className={styles.vsDivider}>⚔️</div>

                    {/* Monster */}
                    <div className={styles.monsterSection}>
                        <div className={`${styles.monsterCharacter} ${gameState.feedback === 'correct' ? styles.hurt : ''}`}>
                            {currentMonster.emoji}
                        </div>
                        <span className={styles.monsterName}>{currentMonster.name}</span>
                        <div className={styles.healthBar}>
                            <div
                                className={styles.healthFill}
                                style={{ width: `${healthPercent}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Timer */}
                <div className={styles.timer}>
                    <div
                        className={`${styles.timerRing} ${gameState.timeLeft <= 5 ? styles.urgent : ''}`}
                    >
                        {gameState.timeLeft}
                    </div>
                </div>

                {/* Problem */}
                <div className={`${styles.problemCard} ${gameState.feedback ? styles[gameState.feedback] : ''}`}>
                    <span className={styles.problemText}>
                        {gameState.currentProblem.displayString} = ?
                    </span>
                </div>

                {/* Answer Input */}
                <div className={styles.inputSection}>
                    <input
                        type="number"
                        className={styles.answerInput}
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="?"
                        autoFocus
                    />
                    <button className={styles.submitBtn} onClick={handleSubmit}>
                        ⚡ Attack!
                    </button>
                </div>

                {/* Mini Leaderboard */}
                <div className={styles.miniLeaderboard}>
                    <h3>🏆 Top 3</h3>
                    <div className={styles.miniLeaderList}>
                        {participants.slice(0, 3).map((p, index) => (
                            <div
                                key={p.id}
                                className={`${styles.miniLeaderItem} ${p.id === participantId ? styles.me : ''}`}
                            >
                                <span>{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                                <span className={styles.miniName}>{p.name}</span>
                                <span className={styles.miniScore}>{p.score}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function MultiplayerBattle() {
    return (
        <Suspense fallback={
            <main className={styles.main}>
                <div className={styles.loadingScreen}>
                    <div className={styles.spinner}></div>
                </div>
            </main>
        }>
            <MultiplayerBattleContent />
        </Suspense>
    );
}
