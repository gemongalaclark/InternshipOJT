'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Operation,
    Difficulty,
    GameState,
    createInitialGameState,
    generateProblem,
    checkAnswer,
    calculateScore,
    calculateStars,
    getDifficultyLabel,
    getOperationLabel,
} from '@/lib/gameEngine';
import styles from './page.module.css';

function GameContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [gameState, setGameState] = useState<GameState | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [playerName, setPlayerName] = useState('');

    // Initialize game from URL params
    useEffect(() => {
        const difficultyParam = searchParams.get('difficulty');
        const operationParam = searchParams.get('operation');
        const nameParam = searchParams.get('name');

        if (!difficultyParam || !operationParam || !nameParam) {
            router.push('/play');
            return;
        }

        const difficulty = parseInt(difficultyParam) as Difficulty;
        const operation = operationParam as Operation;

        setPlayerName(nameParam);
        setGameState(createInitialGameState(difficulty, operation));
        setIsGameStarted(true);
    }, [searchParams, router]);

    // Timer countdown
    useEffect(() => {
        if (!isGameStarted || !gameState || gameState.isGameOver) return;

        const timer = setInterval(() => {
            setGameState((prev) => {
                if (!prev) return prev;

                const newTimeLeft = prev.timeLeft - 1;

                if (newTimeLeft <= 0) {
                    // Game over
                    return {
                        ...prev,
                        timeLeft: 0,
                        isGameOver: true,
                        stars: calculateStars(prev.correctAnswers, prev.questionsAnswered || 1),
                    };
                }

                return { ...prev, timeLeft: newTimeLeft };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isGameStarted, gameState?.isGameOver]);

    // Handle answer submission
    const handleSubmit = useCallback(() => {
        if (!gameState || !gameState.currentProblem || gameState.isGameOver) return;

        const answer = parseInt(userAnswer);
        if (isNaN(answer)) return;

        const isCorrect = checkAnswer(gameState.currentProblem, answer);

        if (isCorrect) {
            // Correct answer
            setFeedback('correct');
            const newStreak = gameState.streak + 1;
            const scoreGained = calculateScore(newStreak, gameState.difficulty);

            setGameState((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    score: prev.score + scoreGained,
                    streak: newStreak,
                    correctAnswers: prev.correctAnswers + 1,
                    questionsAnswered: prev.questionsAnswered + 1,
                    currentProblem: generateProblem(prev.difficulty, prev.operation),
                };
            });

            // Play correct sound (if available)
            try {
                const audio = new Audio('/sounds/correct.mp3');
                audio.volume = 0.5;
                audio.play().catch(() => { });
            } catch { }
        } else {
            // Wrong answer
            setFeedback('wrong');

            setGameState((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    streak: 0,
                    wrongAnswers: prev.wrongAnswers + 1,
                    questionsAnswered: prev.questionsAnswered + 1,
                    currentProblem: generateProblem(prev.difficulty, prev.operation),
                };
            });

            // Play wrong sound (if available)
            try {
                const audio = new Audio('/sounds/wrong.mp3');
                audio.volume = 0.4;
                audio.play().catch(() => { });
            } catch { }
        }

        setUserAnswer('');

        // Clear feedback after animation
        setTimeout(() => setFeedback(null), 500);
    }, [gameState, userAnswer]);

    // Handle keypress
    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    }, [handleSubmit]);

    // Navigate to results when game is over
    useEffect(() => {
        if (gameState?.isGameOver) {
            const stars = calculateStars(gameState.correctAnswers, gameState.questionsAnswered || 1);

            // Store results in sessionStorage for results page
            sessionStorage.setItem('gameResults', JSON.stringify({
                playerName,
                score: gameState.score,
                correctAnswers: gameState.correctAnswers,
                wrongAnswers: gameState.wrongAnswers,
                totalQuestions: gameState.questionsAnswered,
                difficulty: gameState.difficulty,
                operation: gameState.operation,
                stars,
            }));

            // Navigate to results after a short delay
            setTimeout(() => {
                router.push('/results');
            }, 1000);
        }
    }, [gameState?.isGameOver, gameState, playerName, router]);

    if (!gameState || !gameState.currentProblem) {
        return (
            <main className={styles.main}>
                <div className={styles.loading}>Loading...</div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                {/* Top Bar */}
                <div className={styles.topBar}>
                    <div className="score-display">
                        ⭐ {gameState.score}
                    </div>
                    <div className={styles.info}>
                        <span>{getDifficultyLabel(gameState.difficulty)}</span>
                        <span>•</span>
                        <span>{getOperationLabel(gameState.operation)}</span>
                    </div>
                    <div className={`timer ${gameState.timeLeft <= 10 ? 'warning' : ''}`}>
                        ⏱️ {gameState.timeLeft}s
                    </div>
                </div>

                {/* Stats */}
                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>✓ {gameState.correctAnswers}</span>
                        <span className={styles.statLabel}>Correct</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>🔥 {gameState.streak}</span>
                        <span className={styles.statLabel}>Streak</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>✗ {gameState.wrongAnswers}</span>
                        <span className={styles.statLabel}>Wrong</span>
                    </div>
                </div>

                {/* Problem Card */}
                <div className={`card ${styles.problemCard} ${feedback === 'correct' ? 'success-glow' : ''} ${feedback === 'wrong' ? 'shake' : ''}`}>
                    <div className={styles.problemDisplay}>
                        {gameState.currentProblem.displayString} = ?
                    </div>
                </div>

                {/* Answer Input */}
                <div className={styles.answerSection}>
                    <input
                        type="number"
                        className="number-input"
                        placeholder="Your answer"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyPress={handleKeyPress}
                        autoFocus
                        disabled={gameState.isGameOver}
                    />
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={handleSubmit}
                        disabled={gameState.isGameOver || !userAnswer}
                    >
                        Check Answer
                    </button>
                </div>

                {/* Feedback */}
                {feedback && (
                    <div className={`${styles.feedback} ${styles[feedback]}`}>
                        {feedback === 'correct' ? '🎉 Correct!' : '❌ Try again!'}
                    </div>
                )}

                {/* Game Over Overlay */}
                {gameState.isGameOver && (
                    <div className={styles.gameOverOverlay}>
                        <div className={styles.gameOverContent}>
                            <h2>⏱️ Time&apos;s Up!</h2>
                            <p>Calculating your results...</p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

export default function GamePage() {
    return (
        <Suspense fallback={<div className={styles.loading}>Loading game...</div>}>
            <GameContent />
        </Suspense>
    );
}
