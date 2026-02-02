'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTopScores, GameScore } from '@/lib/firestoreService';
import { getDifficultyLabel, getOperationLabel } from '@/lib/gameEngine';
import styles from './page.module.css';

export default function LeaderboardPage() {
    const [scores, setScores] = useState<GameScore[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadScores() {
            try {
                const topScores = await getTopScores(20);
                setScores(topScores);
            } catch (err) {
                setError('Failed to load leaderboard. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        loadScores();
    }, []);

    const getRankClass = (index: number): string => {
        if (index === 0) return 'gold';
        if (index === 1) return 'silver';
        if (index === 2) return 'bronze';
        return '';
    };

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <Link href="/" className={styles.backButton}>
                        ← Back
                    </Link>
                    <h1 className={styles.title}>🏆 Leaderboard</h1>
                    <p className={styles.subtitle}>Top Math Champions</p>
                </div>

                {/* Leaderboard Card */}
                <div className={`card ${styles.leaderboardCard}`}>
                    {loading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            <p>Loading scores...</p>
                        </div>
                    ) : error ? (
                        <div className={styles.error}>
                            <p>😕 {error}</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => window.location.reload()}
                            >
                                Try Again
                            </button>
                        </div>
                    ) : scores.length === 0 ? (
                        <div className={styles.empty}>
                            <span className={styles.emptyIcon}>📊</span>
                            <h3>No scores yet!</h3>
                            <p>Be the first to make it to the leaderboard!</p>
                            <Link href="/play" className="btn btn-primary">
                                Play Now
                            </Link>
                        </div>
                    ) : (
                        <div className={styles.leaderboardList}>
                            {scores.map((score, index) => (
                                <div key={score.id || index} className="leaderboard-item">
                                    <div className={`leaderboard-rank ${getRankClass(index)}`}>
                                        {index + 1}
                                    </div>
                                    <div className={styles.playerInfo}>
                                        <span className={styles.playerName}>{score.playerName}</span>
                                        <span className={styles.playerDetails}>
                                            {getDifficultyLabel(score.difficulty)} • {getOperationLabel(score.operation)}
                                        </span>
                                    </div>
                                    <div className={styles.scoreInfo}>
                                        <span className={styles.scoreValue}>{score.score}</span>
                                        <span className={styles.starsSmall}>
                                            {'⭐'.repeat(score.stars)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <Link href="/play" className="btn btn-primary btn-lg">
                        🎮 Play Now
                    </Link>
                </div>
            </div>
        </main>
    );
}
