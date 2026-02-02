'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Hero Section */}
        <div className={styles.hero}>
          <div className={styles.mascot}>🧮</div>
          <h1 className={styles.title}>
            Math <span className={styles.highlight}>Adventure</span>
          </h1>
          <p className={styles.subtitle}>
            Learn math the fun way! Solve problems, earn stars, and become a math champion!
          </p>
        </div>

        {/* Play Buttons */}
        <div className={styles.actions}>
          <Link href="/adventure" className="btn btn-success btn-lg pulse">
            🐉 Adventure Mode
          </Link>
          <Link href="/play" className="btn btn-primary btn-lg">
            ⏱️ Quick Play
          </Link>
          <Link href="/leaderboard" className="btn btn-outline">
            🏆 Leaderboard
          </Link>
        </div>

        {/* Adventure Mode Highlight */}
        <div className={styles.adventurePromo}>
          <h2>🏰 New! Adventure Mode</h2>
          <p>Defeat 10 monsters, unlock levels, and save the Math Kingdom!</p>
          <div className={styles.monsters}>
            <span>🟢</span>
            <span>👺</span>
            <span>💀</span>
            <span>👻</span>
            <span>🧛</span>
            <span>🧙</span>
            <span>🐲</span>
            <span>👹</span>
            <span>😈</span>
            <span>🐉</span>
          </div>
        </div>

        {/* Features */}
        <div className={styles.features}>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>📚</span>
            <h3>Grade 1-6</h3>
            <p>Problems for all levels</p>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>⭐</span>
            <h3>Earn Stars</h3>
            <p>Collect rewards</p>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🎵</span>
            <h3>Fun Sounds</h3>
            <p>Exciting effects</p>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>📊</span>
            <h3>Track Progress</h3>
            <p>See your growth</p>
          </div>
        </div>

        {/* Operations Preview */}
        <div className={styles.operationsPreview}>
          <h2>Master All Operations!</h2>
          <div className={styles.operations}>
            <div className={styles.operationCard}>
              <span className={styles.operationIcon}>➕</span>
              <span>Addition</span>
            </div>
            <div className={styles.operationCard}>
              <span className={styles.operationIcon}>➖</span>
              <span>Subtraction</span>
            </div>
            <div className={styles.operationCard}>
              <span className={styles.operationIcon}>✖️</span>
              <span>Multiplication</span>
            </div>
            <div className={styles.operationCard}>
              <span className={styles.operationIcon}>➗</span>
              <span>Division</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <p>Made with ❤️ for young learners</p>
        </footer>
      </div>
    </main>
  );
}
