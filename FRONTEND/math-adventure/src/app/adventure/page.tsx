'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    LEVELS,
    STORY_INTRO,
    loadProgress,
    isLevelUnlocked,
    getLevelStars,
    PlayerProgress,
    resetProgress
} from '@/lib/adventureMode';
import styles from './page.module.css';

export default function AdventurePage() {
    const router = useRouter();
    const [progress, setProgress] = useState<PlayerProgress | null>(null);
    const [showStory, setShowStory] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedProgress = loadProgress();
        setProgress(savedProgress);

        // Show story intro for first-time players
        if (savedProgress.totalStars === 0 && !savedProgress.levels[1]?.completed) {
            setShowStory(true);
        }
    }, []);

    const handleStartLevel = (levelId: number) => {
        if (!progress || !isLevelUnlocked(progress, levelId)) return;
        router.push(`/adventure/battle?level=${levelId}`);
    };

    const handleResetProgress = () => {
        if (confirm('Are you sure you want to reset all progress? This cannot be undone!')) {
            const newProgress = resetProgress();
            setProgress(newProgress);
        }
    };

    if (!mounted || !progress) {
        return (
            <main className={styles.main}>
                <div className={styles.loading}>Loading adventure...</div>
            </main>
        );
    }

    // Story intro modal
    if (showStory) {
        return (
            <main className={styles.main}>
                <div className={styles.storyModal}>
                    <div className={styles.storyContent}>
                        <div className={styles.storyIcon}>🏰</div>
                        <h1 className={styles.storyTitle}>{STORY_INTRO.title}</h1>
                        {STORY_INTRO.paragraphs.map((p, i) => (
                            <p key={i} className={styles.storyText}>{p}</p>
                        ))}
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={() => setShowStory(false)}
                        >
                            🦸‍♂️ I&apos;m Ready!
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <Link href="/" className={styles.backButton}>
                        ← Home
                    </Link>
                    <h1 className={styles.title}>🗺️ Adventure Map</h1>
                    <div className={styles.totalStars}>
                        ⭐ {progress.totalStars} / {LEVELS.length * 3}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className={styles.progressSection}>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${(Object.values(progress.levels).filter(l => l.completed).length / LEVELS.length) * 100}%` }}
                        />
                    </div>
                    <p className={styles.progressText}>
                        {Object.values(progress.levels).filter(l => l.completed).length} / {LEVELS.length} levels completed
                    </p>
                </div>

                {/* Level Grid */}
                <div className={styles.levelGrid}>
                    {LEVELS.map((level) => {
                        const unlocked = isLevelUnlocked(progress, level.id);
                        const stars = getLevelStars(progress, level.id);
                        const completed = progress.levels[level.id]?.completed;

                        return (
                            <button
                                key={level.id}
                                className={`${styles.levelCard} ${unlocked ? styles.unlocked : styles.locked} ${completed ? styles.completed : ''}`}
                                onClick={() => handleStartLevel(level.id)}
                                disabled={!unlocked}
                            >
                                <div className={styles.levelNumber}>{level.id}</div>
                                <div className={styles.monsterEmoji}>{unlocked ? level.monster.emoji : '🔒'}</div>
                                <div className={styles.levelName}>{level.name}</div>
                                {unlocked && (
                                    <div className={styles.levelStars}>
                                        {[1, 2, 3].map((s) => (
                                            <span key={s} className={s <= stars ? styles.starFilled : styles.starEmpty}>
                                                ⭐
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {!unlocked && (
                                    <div className={styles.lockedText}>Complete previous level</div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <Link href="/play" className="btn btn-outline">
                        ⏱️ Quick Play Mode
                    </Link>
                    <button
                        className={styles.resetButton}
                        onClick={handleResetProgress}
                    >
                        🔄 Reset Progress
                    </button>
                </div>
            </div>
        </main>
    );
}
