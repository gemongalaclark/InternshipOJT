'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDifficultyLabel, getOperationLabel, Difficulty, Operation } from '@/lib/gameEngine';
import { saveScore } from '@/lib/firestoreService';
import styles from './page.module.css';

interface GameResults {
    playerName: string;
    score: number;
    correctAnswers: number;
    wrongAnswers: number;
    totalQuestions: number;
    difficulty: Difficulty;
    operation: Operation;
    stars: number;
}

export default function ResultsPage() {
    const router = useRouter();
    const [results, setResults] = useState<GameResults | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        // Get results from sessionStorage
        const storedResults = sessionStorage.getItem('gameResults');
        if (!storedResults) {
            router.push('/play');
            return;
        }

        const parsedResults = JSON.parse(storedResults);
        setResults(parsedResults);

        // Show confetti if got stars
        if (parsedResults.stars > 0) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
        }

        // Play level up sound
        try {
            const audio = new Audio('/sounds/levelup.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => { });
        } catch { }
    }, [router]);

    const handleSaveScore = async () => {
        if (!results || isSaving || saved) return;

        setIsSaving(true);
        try {
            await saveScore({
                playerName: results.playerName,
                score: results.score,
                correctAnswers: results.correctAnswers,
                totalQuestions: results.totalQuestions,
                difficulty: results.difficulty,
                operation: results.operation,
                stars: results.stars,
            });
            setSaved(true);
        } catch (error) {
            console.error('Failed to save score:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePlayAgain = () => {
        sessionStorage.removeItem('gameResults');
        router.push('/play');
    };

    if (!results) {
        return (
            <main className={styles.main}>
                <div className={styles.loading}>Loading results...</div>
            </main>
        );
    }

    const accuracy = results.totalQuestions > 0
        ? Math.round((results.correctAnswers / results.totalQuestions) * 100)
        : 0;

    return (
        <main className={styles.main}>
            {/* Confetti */}
            {showConfetti && (
                <div className={styles.confettiContainer}>
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                backgroundColor: ['#FFD93D', '#FF6B9D', '#6C63FF', '#4ECDC4', '#FF8C42'][
                                    Math.floor(Math.random() * 5)
                                ],
                            }}
                        />
                    ))}
                </div>
            )}

            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        {results.stars >= 3 ? '🏆 Amazing!' : results.stars >= 2 ? '🎉 Great Job!' : results.stars >= 1 ? '👍 Good Try!' : '💪 Keep Practicing!'}
                    </h1>
                    <p className={styles.playerName}>Well done, {results.playerName}!</p>
                </div>

                {/* Stars */}
                <div className={styles.starsContainer}>
                    <div className="stars">
                        {[1, 2, 3].map((star) => (
                            <span
                                key={star}
                                className={`star ${star <= results.stars ? 'filled' : ''}`}
                                style={{ animationDelay: `${star * 0.2}s` }}
                            >
                                ⭐
                            </span>
                        ))}
                    </div>
                </div>

                {/* Score Card */}
                <div className={`card ${styles.scoreCard}`}>
                    <div className={styles.bigScore}>
                        <span className={styles.scoreLabel}>Final Score</span>
                        <span className={styles.scoreValue}>{results.score}</span>
                    </div>

                    <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>✓ {results.correctAnswers}</span>
                            <span className={styles.statLabel}>Correct</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>✗ {results.wrongAnswers}</span>
                            <span className={styles.statLabel}>Wrong</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{accuracy}%</span>
                            <span className={styles.statLabel}>Accuracy</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{results.totalQuestions}</span>
                            <span className={styles.statLabel}>Questions</span>
                        </div>
                    </div>

                    <div className={styles.gameInfo}>
                        <span>{getDifficultyLabel(results.difficulty)}</span>
                        <span>•</span>
                        <span>{getOperationLabel(results.operation)}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <button
                        className={`btn ${saved ? 'btn-success' : 'btn-secondary'}`}
                        onClick={handleSaveScore}
                        disabled={isSaving || saved}
                    >
                        {saved ? '✓ Score Saved!' : isSaving ? 'Saving...' : '💾 Save to Leaderboard'}
                    </button>
                    <button className="btn btn-primary btn-lg" onClick={handlePlayAgain}>
                        🔄 Play Again
                    </button>
                    <Link href="/" className="btn btn-outline">
                        🏠 Home
                    </Link>
                </div>
            </div>
        </main>
    );
}
