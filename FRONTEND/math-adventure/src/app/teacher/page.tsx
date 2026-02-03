'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    signInWithGoogle,
    onAuthStateChange,
    signOutUser
} from '@/lib/firebase';
import styles from './page.module.css';

export default function TeacherLogin() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [signingIn, setSigningIn] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChange((user) => {
            if (user) {
                // User is signed in, redirect to dashboard
                router.push('/teacher/dashboard');
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleGoogleSignIn = async () => {
        setSigningIn(true);
        setError('');
        try {
            await signInWithGoogle();
            // Auth state change will handle redirect
        } catch (err) {
            console.error('Sign in error:', err);
            setError('Failed to sign in. Please try again.');
            setSigningIn(false);
        }
    };

    if (loading) {
        return (
            <main className={styles.main}>
                <div className={styles.loadingScreen}>
                    <div className={styles.spinner}></div>
                    <p>Loading...</p>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            <div className={styles.bgPattern}></div>

            <div className={styles.container}>
                {/* Logo */}
                <div className={styles.logoSection}>
                    <h1 className={styles.logo}>
                        <span className={styles.logoEmoji}>📚</span>
                        <span className={styles.logoText}>Teacher Portal</span>
                    </h1>
                    <p className={styles.logoSubtitle}>Math Adventure</p>
                </div>

                {/* Login Card */}
                <div className={styles.loginCard}>
                    <div className={styles.cardIcon}>👩‍🏫</div>
                    <h2 className={styles.cardTitle}>Welcome, Teacher!</h2>
                    <p className={styles.cardText}>
                        Sign in with your Google account to create rooms and track your students&apos; progress.
                    </p>

                    {error && <p className={styles.errorText}>{error}</p>}

                    <button
                        className={styles.googleBtn}
                        onClick={handleGoogleSignIn}
                        disabled={signingIn}
                    >
                        {signingIn ? (
                            <>
                                <div className={styles.btnSpinner}></div>
                                Signing in...
                            </>
                        ) : (
                            <>
                                <svg className={styles.googleIcon} viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Sign in with Google
                            </>
                        )}
                    </button>

                    <div className={styles.divider}>
                        <span>What you can do</span>
                    </div>

                    <div className={styles.features}>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>🏠</span>
                            <span>Create game rooms</span>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>👨‍👩‍👧‍👦</span>
                            <span>Invite students</span>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>📊</span>
                            <span>Track scores</span>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>🏆</span>
                            <span>View leaderboards</span>
                        </div>
                    </div>
                </div>

                {/* Back Link */}
                <a href="/" className={styles.backLink}>
                    ← Back to Student Portal
                </a>
            </div>
        </main>
    );
}
