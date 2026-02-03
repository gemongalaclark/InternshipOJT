'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from './page.module.css';

// Player avatars to choose from
const AVATARS = [
  { emoji: '🦸', color: '#FF6B6B' },
  { emoji: '🧙‍♂️', color: '#9B59B6' },
  { emoji: '🥷', color: '#2C3E50' },
  { emoji: '🧝‍♀️', color: '#27AE60' },
  { emoji: '🦹', color: '#E74C3C' },
  { emoji: '🤴', color: '#F39C12' },
  { emoji: '👸', color: '#E91E63' },
  { emoji: '🧑‍🚀', color: '#3498DB' },
  { emoji: '🦊', color: '#FF9800' },
  { emoji: '🐱', color: '#795548' },
  { emoji: '🐸', color: '#4CAF50' },
  { emoji: '🐼', color: '#607D8B' },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    setMounted(true);
    // Load saved player data
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('mathAdventurePlayerName');
      const savedAvatar = localStorage.getItem('mathAdventureAvatarIndex');
      if (savedName) setPlayerName(savedName);
      if (savedAvatar) setSelectedAvatar(parseInt(savedAvatar));
    }
  }, []);

  // Save player data when changed
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('mathAdventurePlayerName', playerName);
      localStorage.setItem('mathAdventureAvatarIndex', selectedAvatar.toString());
      localStorage.setItem('mathAdventureAvatar', AVATARS[selectedAvatar].emoji);
    }
  }, [playerName, selectedAvatar, mounted]);

  const handleJoinRoom = () => {
    if (!roomCode.trim()) {
      setJoinError('Please enter a room code');
      return;
    }
    if (!playerName.trim()) {
      setJoinError('Please enter your name first');
      return;
    }
    // Navigate to room
    window.location.href = `/room/${roomCode.toUpperCase()}`;
  };

  const cycleAvatar = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedAvatar((prev) => (prev === 0 ? AVATARS.length - 1 : prev - 1));
    } else {
      setSelectedAvatar((prev) => (prev === AVATARS.length - 1 ? 0 : prev + 1));
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <main className={styles.main}>
      {/* Background pattern */}
      <div className={styles.bgPattern}></div>

      <div className={styles.container}>
        {/* Logo/Title */}
        <div className={styles.logoSection}>
          <h1 className={styles.logo}>
            <span className={styles.logoMath}>Math</span>
            <span className={styles.logoAdventure}>Adventure!</span>
          </h1>
          <div className={styles.logoCharacters}>
            🦸🧙‍♂️👹🐉💀🧛👻🥷
          </div>
        </div>

        {/* Player Setup Card */}
        <div className={styles.playerCard}>
          {/* Name Input */}
          <div className={styles.nameSection}>
            <input
              type="text"
              className={styles.nameInput}
              placeholder="Enter your name..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={15}
            />
          </div>

          {/* Avatar Selector */}
          <div className={styles.avatarSection}>
            <button
              className={styles.avatarArrow}
              onClick={() => cycleAvatar('prev')}
              aria-label="Previous avatar"
            >
              ◀
            </button>

            <div
              className={styles.avatarDisplay}
              style={{ backgroundColor: AVATARS[selectedAvatar].color }}
            >
              <span className={styles.avatarEmoji}>
                {AVATARS[selectedAvatar].emoji}
              </span>
            </div>

            <button
              className={styles.avatarArrow}
              onClick={() => cycleAvatar('next')}
              aria-label="Next avatar"
            >
              ▶
            </button>

            {/* Randomize button */}
            <button
              className={styles.randomBtn}
              onClick={() => setSelectedAvatar(Math.floor(Math.random() * AVATARS.length))}
              aria-label="Random avatar"
            >
              🎲
            </button>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <Link
              href={playerName.trim() ? '/adventure' : '#'}
              className={`${styles.playBtn} ${!playerName.trim() ? styles.disabled : ''}`}
              onClick={(e) => {
                if (!playerName.trim()) {
                  e.preventDefault();
                  alert('Please enter your name first!');
                }
              }}
            >
              🎮 Solo Adventure
            </Link>

            <button
              className={styles.joinBtn}
              onClick={() => {
                if (!playerName.trim()) {
                  alert('Please enter your name first!');
                  return;
                }
                setShowJoinModal(true);
              }}
            >
              🏠 Join Room
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div className={styles.infoCards}>
          <div className={styles.infoCard}>
            <span className={styles.infoIcon}>🎮</span>
            <h3>Solo Adventure</h3>
            <p>Battle monsters and save the Math Kingdom on your own!</p>
          </div>
          <div className={styles.infoCard}>
            <span className={styles.infoIcon}>🏠</span>
            <h3>Join Room</h3>
            <p>Enter a room code from your teacher to play with classmates!</p>
          </div>
          <div className={styles.infoCard}>
            <span className={styles.infoIcon}>🏆</span>
            <h3>Win Prizes</h3>
            <p>Compete for the top spot on the leaderboard!</p>
          </div>
        </div>

        {/* Teacher Link */}
        <div className={styles.teacherSection}>
          <p>Are you a teacher?</p>
          <Link href="/teacher" className={styles.teacherLink}>
            📚 Teacher Portal →
          </Link>
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <p>Made with ❤️ for young learners</p>
        </footer>
      </div>

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className={styles.modalOverlay} onClick={() => setShowJoinModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.modalClose}
              onClick={() => setShowJoinModal(false)}
            >
              ✕
            </button>

            <div className={styles.modalIcon}>🏠</div>
            <h2 className={styles.modalTitle}>Join a Room</h2>
            <p className={styles.modalText}>
              Enter the room code your teacher gave you
            </p>

            <input
              type="text"
              className={styles.codeInput}
              placeholder="ROOM CODE"
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value.toUpperCase());
                setJoinError('');
              }}
              maxLength={6}
              autoFocus
            />

            {joinError && <p className={styles.errorText}>{joinError}</p>}

            <div className={styles.modalActions}>
              <button className={styles.joinConfirmBtn} onClick={handleJoinRoom}>
                🚀 Join Game!
              </button>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowJoinModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
