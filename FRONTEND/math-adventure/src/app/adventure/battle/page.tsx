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
    LEVELS,
    LEVEL_INTROS,
    VICTORY_MESSAGES,
    DEFEAT_MESSAGES,
    loadProgress,
    unlockNextLevel,
    PlayerProgress,
    Level,
} from '@/lib/adventureMode';
import styles from './page.module.css';

interface BattleState {
    level: Level;
    monsterHealth: number;
    playerHealth: number;
    currentProblem: MathProblem;
    questionsAnswered: number;
    correctAnswers: number;
    timeLeft: number;
    isVictory: boolean;
    isDefeat: boolean;
    showIntro: boolean;
    feedback: 'correct' | 'wrong' | null;
    playerAttacking: boolean;
    monsterAttacking: boolean;
}

// Player characters to choose from (stored in localStorage)
const PLAYER_AVATARS = ['🦸', '🧙‍♂️', '🥷', '🧝‍♀️', '🦹', '🤴', '👸', '🧑‍🚀'];

function getRandomOperation(operation: Operation | 'mixed'): Operation {
    if (operation === 'mixed') {
        const ops: Operation[] = ['addition', 'subtraction', 'multiplication', 'division'];
        return ops[Math.floor(Math.random() * ops.length)];
    }
    return operation;
}

function BattleContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [battleState, setBattleState] = useState<BattleState | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [progress, setProgress] = useState<PlayerProgress | null>(null);
    const [playerAvatar, setPlayerAvatar] = useState('🦸');
    const [showForfeitModal, setShowForfeitModal] = useState(false);

    // Load player avatar from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('mathAdventureAvatar');
            if (saved) setPlayerAvatar(saved);
        }
    }, []);

    // Initialize battle
    useEffect(() => {
        const levelParam = searchParams.get('level');
        if (!levelParam) {
            router.push('/adventure');
            return;
        }

        const levelId = parseInt(levelParam);
        const level = LEVELS.find(l => l.id === levelId);

        if (!level) {
            router.push('/adventure');
            return;
        }

        const savedProgress = loadProgress();
        setProgress(savedProgress);

        const op = getRandomOperation(level.operation);

        setBattleState({
            level,
            monsterHealth: level.monster.maxHealth,
            playerHealth: 3, // 3 hearts
            currentProblem: generateProblem(level.difficulty as Difficulty, op),
            questionsAnswered: 0,
            correctAnswers: 0,
            timeLeft: level.timePerQuestion,
            isVictory: false,
            isDefeat: false,
            showIntro: true,
            feedback: null,
            playerAttacking: false,
            monsterAttacking: false,
        });
    }, [searchParams, router]);

    // Timer countdown
    useEffect(() => {
        if (!battleState || battleState.isVictory || battleState.isDefeat || battleState.showIntro) return;

        const timer = setInterval(() => {
            setBattleState(prev => {
                if (!prev) return prev;

                const newTimeLeft = prev.timeLeft - 1;

                if (newTimeLeft <= 0) {
                    // Time's up - monster attacks
                    const newHealth = prev.playerHealth - 1;

                    if (newHealth <= 0) {
                        return { ...prev, timeLeft: 0, playerHealth: 0, isDefeat: true, monsterAttacking: true };
                    }

                    const op = getRandomOperation(prev.level.operation);
                    return {
                        ...prev,
                        timeLeft: prev.level.timePerQuestion,
                        playerHealth: newHealth,
                        currentProblem: generateProblem(prev.level.difficulty as Difficulty, op),
                        feedback: 'wrong',
                        monsterAttacking: true,
                    };
                }

                return { ...prev, timeLeft: newTimeLeft };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [battleState?.isVictory, battleState?.isDefeat, battleState?.showIntro]);

    // Clear animations
    useEffect(() => {
        if (battleState?.feedback || battleState?.playerAttacking || battleState?.monsterAttacking) {
            const timeout = setTimeout(() => {
                setBattleState(prev => prev ? {
                    ...prev,
                    feedback: null,
                    playerAttacking: false,
                    monsterAttacking: false
                } : null);
            }, 600);
            return () => clearTimeout(timeout);
        }
    }, [battleState?.feedback, battleState?.playerAttacking, battleState?.monsterAttacking]);

    const handleSubmit = useCallback(() => {
        if (!battleState || battleState.isVictory || battleState.isDefeat) return;

        const answer = parseInt(userAnswer);
        if (isNaN(answer)) return;

        const isCorrect = checkAnswer(battleState.currentProblem, answer);

        if (isCorrect) {
            // Player attacks monster
            const newMonsterHealth = battleState.monsterHealth - 1;
            const newCorrectAnswers = battleState.correctAnswers + 1;

            // Play correct sound
            try {
                const audio = new Audio('/sounds/correct.mp3');
                audio.volume = 0.5;
                audio.play().catch(() => { });
            } catch { }

            if (newMonsterHealth <= 0) {
                // Victory!
                setBattleState(prev => prev ? {
                    ...prev,
                    monsterHealth: 0,
                    correctAnswers: newCorrectAnswers,
                    isVictory: true,
                    feedback: 'correct',
                    playerAttacking: true,
                } : null);

                // Calculate stars
                const accuracy = newCorrectAnswers / (battleState.questionsAnswered + 1);
                const stars = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : 1;

                // Unlock next level
                if (progress) {
                    const newProgress = unlockNextLevel(progress, battleState.level.id, stars);
                    setProgress(newProgress);
                }
            } else {
                const op = getRandomOperation(battleState.level.operation);
                setBattleState(prev => prev ? {
                    ...prev,
                    monsterHealth: newMonsterHealth,
                    correctAnswers: newCorrectAnswers,
                    questionsAnswered: prev.questionsAnswered + 1,
                    timeLeft: prev.level.timePerQuestion,
                    currentProblem: generateProblem(prev.level.difficulty as Difficulty, op),
                    feedback: 'correct',
                    playerAttacking: true,
                } : null);
            }
        } else {
            // Monster attacks player
            const newHealth = battleState.playerHealth - 1;

            // Play wrong sound
            try {
                const audio = new Audio('/sounds/wrong.mp3');
                audio.volume = 0.4;
                audio.play().catch(() => { });
            } catch { }

            if (newHealth <= 0) {
                setBattleState(prev => prev ? {
                    ...prev,
                    playerHealth: 0,
                    isDefeat: true,
                    feedback: 'wrong',
                    monsterAttacking: true,
                } : null);
            } else {
                const op = getRandomOperation(battleState.level.operation);
                setBattleState(prev => prev ? {
                    ...prev,
                    playerHealth: newHealth,
                    questionsAnswered: prev.questionsAnswered + 1,
                    timeLeft: prev.level.timePerQuestion,
                    currentProblem: generateProblem(prev.level.difficulty as Difficulty, op),
                    feedback: 'wrong',
                    monsterAttacking: true,
                } : null);
            }
        }

        setUserAnswer('');
    }, [battleState, userAnswer, progress]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    }, [handleSubmit]);

    const handleStartBattle = () => {
        setBattleState(prev => prev ? { ...prev, showIntro: false } : null);
    };

    const selectAvatar = (avatar: string) => {
        setPlayerAvatar(avatar);
        if (typeof window !== 'undefined') {
            localStorage.setItem('mathAdventureAvatar', avatar);
        }
    };

    const handleForfeit = () => {
        setShowForfeitModal(false);
        setBattleState(prev => prev ? {
            ...prev,
            playerHealth: 0,
            isDefeat: true,
        } : null);
    };

    if (!battleState) {
        return (
            <main className={styles.main}>
                <div className={styles.loading}>Loading battle...</div>
            </main>
        );
    }

    // Intro screen with avatar selection
    if (battleState.showIntro) {
        return (
            <main className={styles.main}>
                <div className={styles.introModal}>
                    <div className={styles.introContent}>
                        <div className={styles.levelBadge}>Level {battleState.level.id}</div>
                        <h1 className={styles.levelTitle}>{battleState.level.name}</h1>

                        {/* Avatar Selection */}
                        <div className={styles.avatarSection}>
                            <p className={styles.avatarLabel}>Choose your hero:</p>
                            <div className={styles.avatarGrid}>
                                {PLAYER_AVATARS.map((avatar) => (
                                    <button
                                        key={avatar}
                                        className={`${styles.avatarBtn} ${playerAvatar === avatar ? styles.avatarSelected : ''}`}
                                        onClick={() => selectAvatar(avatar)}
                                    >
                                        {avatar}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* VS Preview */}
                        <div className={styles.vsPreview}>
                            <div className={styles.vsPlayer}>
                                <span className={styles.vsAvatar}>{playerAvatar}</span>
                                <span className={styles.vsName}>You</span>
                            </div>
                            <span className={styles.vsText}>VS</span>
                            <div className={styles.vsMonster}>
                                <span className={styles.vsAvatar}>{battleState.level.monster.emoji}</span>
                                <span className={styles.vsName}>{battleState.level.monster.name}</span>
                            </div>
                        </div>

                        <p className={styles.introText}>{LEVEL_INTROS[battleState.level.id]}</p>

                        <div className={styles.battleInfo}>
                            <span>❤️ 3 Lives</span>
                            <span>💪 {battleState.level.monster.maxHealth} HP</span>
                            <span>⏱️ {battleState.level.timePerQuestion}s</span>
                        </div>

                        <button className="btn btn-primary btn-lg" onClick={handleStartBattle}>
                            ⚔️ FIGHT!
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    // Victory screen
    if (battleState.isVictory) {
        const accuracy = battleState.correctAnswers / Math.max(battleState.questionsAnswered + 1, 1);
        const stars = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : 1;

        return (
            <main className={styles.main}>
                <div className={styles.resultModal}>
                    <div className={styles.resultContent}>
                        <div className={styles.resultIcon}>🎉</div>
                        <h1 className={styles.resultTitle}>Victory!</h1>
                        <p className={styles.resultText}>
                            {VICTORY_MESSAGES[Math.floor(Math.random() * VICTORY_MESSAGES.length)]}
                        </p>
                        <div className={styles.defeatMonster}>
                            <span className={styles.monsterDefeated}>{battleState.level.monster.emoji}</span>
                            <span className={styles.defeatedText}>Defeated!</span>
                        </div>
                        <div className="stars" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
                            {[1, 2, 3].map((s) => (
                                <span key={s} className={`star ${s <= stars ? 'filled' : ''}`} style={{ animationDelay: `${s * 0.2}s` }}>
                                    ⭐
                                </span>
                            ))}
                        </div>
                        <div className={styles.actions}>
                            {battleState.level.id < LEVELS.length && (
                                <button
                                    className="btn btn-success btn-lg"
                                    onClick={() => router.push(`/adventure/battle?level=${battleState.level.id + 1}`)}
                                >
                                    ➡️ Next Level
                                </button>
                            )}
                            <button
                                className="btn btn-outline"
                                onClick={() => router.push('/adventure')}
                            >
                                🗺️ Back to Map
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // Defeat screen
    if (battleState.isDefeat) {
        return (
            <main className={styles.main}>
                <div className={styles.resultModal}>
                    <div className={styles.resultContent}>
                        <div className={styles.resultIcon}>💔</div>
                        <h1 className={styles.resultTitle}>Defeated!</h1>
                        <p className={styles.resultText}>
                            {DEFEAT_MESSAGES[Math.floor(Math.random() * DEFEAT_MESSAGES.length)]}
                        </p>
                        <div className={styles.actions}>
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={() => router.push(`/adventure/battle?level=${battleState.level.id}`)}
                            >
                                🔄 Try Again
                            </button>
                            <button
                                className="btn btn-outline"
                                onClick={() => router.push('/adventure')}
                            >
                                🗺️ Back to Map
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // Battle screen - Player vs Monster layout
    const monsterHealthPercent = (battleState.monsterHealth / battleState.level.monster.maxHealth) * 100;
    const playerHealthPercent = (battleState.playerHealth / 3) * 100;

    return (
        <main className={styles.main}>
            <div className={styles.battleArena}>
                {/* Forfeit Modal */}
                {showForfeitModal && (
                    <div className={styles.forfeitModal}>
                        <div className={styles.forfeitContent}>
                            <div className={styles.forfeitIcon}>🏳️</div>
                            <h2 className={styles.forfeitTitle}>Forfeit Battle?</h2>
                            <p className={styles.forfeitText}>
                                Are you sure you want to give up? You will be defeated and won&apos;t earn any stars.
                            </p>
                            <div className={styles.forfeitActions}>
                                <button
                                    className={styles.forfeitConfirmBtn}
                                    onClick={handleForfeit}
                                >
                                    😔 Yes, Forfeit
                                </button>
                                <button
                                    className={styles.forfeitCancelBtn}
                                    onClick={() => setShowForfeitModal(false)}
                                >
                                    ⚔️ Keep Fighting!
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top Bar */}
                <div className={styles.topBar}>
                    <div className={styles.levelInfo}>
                        Level {battleState.level.id}: {battleState.level.name}
                    </div>
                    <div className={styles.topBarRight}>
                        <button
                            className={styles.forfeitBtn}
                            onClick={() => setShowForfeitModal(true)}
                            title="Forfeit Battle"
                        >
                            🏳️
                        </button>
                        <div className={`${styles.timer} ${battleState.timeLeft <= 5 ? styles.timerWarning : ''}`}>
                            ⏱️ {battleState.timeLeft}s
                        </div>
                    </div>
                </div>

                {/* Battle Field */}
                <div className={styles.battlefield}>
                    {/* Player Side */}
                    <div className={styles.fighterSide}>
                        <div className={styles.healthBarContainer}>
                            <div className={styles.healthLabel}>YOU</div>
                            <div className={styles.healthBarOuter}>
                                <div
                                    className={styles.healthBarInner}
                                    style={{ width: `${playerHealthPercent}%`, background: 'linear-gradient(90deg, #48BB78, #38A169)' }}
                                />
                            </div>
                            <div className={styles.hearts}>
                                {[1, 2, 3].map((h) => (
                                    <span key={h} className={h <= battleState.playerHealth ? styles.heart : styles.heartEmpty}>
                                        ❤️
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className={`${styles.fighter} ${styles.player} ${battleState.playerAttacking ? styles.attacking : ''} ${battleState.monsterAttacking ? styles.hurt : ''}`}>
                            {playerAvatar}
                        </div>
                    </div>

                    {/* VS Divider */}
                    <div className={styles.vsDivider}>
                        <span>⚔️</span>
                    </div>

                    {/* Monster Side */}
                    <div className={styles.fighterSide}>
                        <div className={styles.healthBarContainer}>
                            <div className={styles.healthLabel}>{battleState.level.monster.name.toUpperCase()}</div>
                            <div className={styles.healthBarOuter}>
                                <div
                                    className={styles.healthBarInner}
                                    style={{ width: `${monsterHealthPercent}%`, background: 'linear-gradient(90deg, #E53E3E, #C53030)' }}
                                />
                            </div>
                            <div className={styles.hpText}>{battleState.monsterHealth}/{battleState.level.monster.maxHealth} HP</div>
                        </div>
                        <div className={`${styles.fighter} ${styles.monster} ${battleState.monsterAttacking ? styles.attacking : ''} ${battleState.playerAttacking ? styles.hurt : ''}`}>
                            {battleState.level.monster.emoji}
                        </div>
                    </div>
                </div>

                {/* Attack Effect */}
                {battleState.feedback && (
                    <div className={`${styles.attackEffect} ${styles[battleState.feedback]}`}>
                        {battleState.feedback === 'correct' ? '💥 HIT!' : '😵 MISS!'}
                    </div>
                )}

                {/* Problem Card */}
                <div className={styles.problemSection}>
                    <div className={styles.problemCard}>
                        <div className={styles.problemText}>
                            {battleState.currentProblem.displayString} = ?
                        </div>
                    </div>

                    {/* Answer Input */}
                    <div className={styles.answerRow}>
                        <input
                            type="number"
                            className={styles.answerInput}
                            placeholder="?"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            onKeyPress={handleKeyPress}
                            autoFocus
                        />
                        <button
                            className={styles.attackBtn}
                            onClick={handleSubmit}
                            disabled={!userAnswer}
                        >
                            ⚔️ ATTACK!
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function BattlePage() {
    return (
        <Suspense fallback={<div className={styles.loading}>Loading battle...</div>}>
            <BattleContent />
        </Suspense>
    );
}
