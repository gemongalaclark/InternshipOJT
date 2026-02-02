'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Operation, Difficulty, getDifficultyLabel, getOperationLabel } from '@/lib/gameEngine';
import styles from './page.module.css';

const difficulties: Difficulty[] = [1, 2, 3, 4, 5, 6];
const operations: { key: Operation; icon: string }[] = [
    { key: 'addition', icon: '➕' },
    { key: 'subtraction', icon: '➖' },
    { key: 'multiplication', icon: '✖️' },
    { key: 'division', icon: '➗' },
];

export default function PlayPage() {
    const router = useRouter();
    const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
    const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
    const [playerName, setPlayerName] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Load saved player name from localStorage
        const savedName = localStorage.getItem('mathAdventurePlayerName');
        if (savedName) {
            setPlayerName(savedName);
        }
    }, []);

    const handleStartGame = () => {
        if (!selectedDifficulty || !selectedOperation || !playerName.trim()) {
            return;
        }

        // Save player name
        localStorage.setItem('mathAdventurePlayerName', playerName.trim());

        // Navigate to game with params
        const params = new URLSearchParams({
            difficulty: selectedDifficulty.toString(),
            operation: selectedOperation,
            name: playerName.trim(),
        });
        router.push(`/game?${params.toString()}`);
    };

    const canStart = selectedDifficulty && selectedOperation && playerName.trim();

    if (!mounted) {
        return null;
    }

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <Link href="/" className={styles.backButton}>
                        ← Back
                    </Link>
                    <h1 className={styles.title}>Choose Your Challenge!</h1>
                </div>

                {/* Player Name */}
                <div className={`card ${styles.section}`}>
                    <h2 className={styles.sectionTitle}>👤 Your Name</h2>
                    <input
                        type="text"
                        className={styles.nameInput}
                        placeholder="Enter your name..."
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        maxLength={20}
                    />
                </div>

                {/* Difficulty Selection */}
                <div className={`card ${styles.section}`}>
                    <h2 className={styles.sectionTitle}>📚 Select Your Grade Level</h2>
                    <div className={styles.difficultyGrid}>
                        {difficulties.map((diff) => (
                            <button
                                key={diff}
                                className={`${styles.difficultyCard} ${selectedDifficulty === diff ? styles.selected : ''}`}
                                onClick={() => setSelectedDifficulty(diff)}
                            >
                                <span className={styles.gradeNumber}>{diff}</span>
                                <span className={styles.gradeLabel}>{getDifficultyLabel(diff)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Operation Selection */}
                <div className={`card ${styles.section}`}>
                    <h2 className={styles.sectionTitle}>🔢 Select Operation</h2>
                    <div className={styles.operationGrid}>
                        {operations.map((op) => (
                            <button
                                key={op.key}
                                className={`${styles.operationCard} ${selectedOperation === op.key ? styles.selected : ''}`}
                                onClick={() => setSelectedOperation(op.key)}
                            >
                                <span className={styles.operationIcon}>{op.icon}</span>
                                <span className={styles.operationLabel}>{getOperationLabel(op.key)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Start Button */}
                <div className={styles.startSection}>
                    <button
                        className={`btn btn-success btn-lg ${canStart ? 'pulse' : ''}`}
                        onClick={handleStartGame}
                        disabled={!canStart}
                        style={{ opacity: canStart ? 1 : 0.5 }}
                    >
                        🚀 Start Adventure!
                    </button>
                    {!canStart && (
                        <p className={styles.hint}>
                            {!playerName.trim() && 'Enter your name • '}
                            {!selectedDifficulty && 'Select a grade • '}
                            {!selectedOperation && 'Select an operation'}
                        </p>
                    )}
                </div>
            </div>
        </main>
    );
}
