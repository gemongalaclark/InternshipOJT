'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    onAuthStateChange,
    signOutUser,
    getTeacherRooms,
    createRoom,
    deleteRoom,
    getTeacherProfile,
    updateTeacherProfile,
    TeacherProfile,
    Room,
    CustomQuestion,
} from '@/lib/firebase';
import { User } from 'firebase/auth';
import styles from './page.module.css';

export default function TeacherDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);

    // Profile setup form state
    const [profileForm, setProfileForm] = useState({
        title: '' as 'Mr.' | 'Ms.' | 'Mrs.' | 'Dr.' | '',
        schoolName: '',
        gradeTeaching: '',
    });

    // Form state for new room
    const [newRoom, setNewRoom] = useState({
        roomName: '',
        gameMode: 'timeTrial' as 'timeTrial' | 'assignment',
        difficulty: 1,
        operation: 'addition',
        timeLimit: 300,
        monstersToDefeat: 5,
        useCustomQuestions: false,
        deadline: '',
    });

    // Custom questions state
    const [customQuestions, setCustomQuestions] = useState<{ question: string; answer: string }[]>([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (authUser) => {
            if (authUser) {
                setUser(authUser);

                // Check if profile is complete
                const profile = await getTeacherProfile(authUser.uid);
                setTeacherProfile(profile);

                // Show profile setup modal if not complete
                if (profile && !profile.profileComplete) {
                    setShowProfileModal(true);
                }

                // Load rooms
                const teacherRooms = await getTeacherRooms(authUser.uid);
                setRooms(teacherRooms);
            } else {
                router.push('/teacher');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const handleSaveProfile = async () => {
        if (!user || !profileForm.title || !profileForm.schoolName.trim() || !profileForm.gradeTeaching.trim()) {
            return;
        }

        setSavingProfile(true);
        try {
            await updateTeacherProfile(user.uid, {
                title: profileForm.title as 'Mr.' | 'Ms.' | 'Mrs.' | 'Dr.',
                schoolName: profileForm.schoolName,
                gradeTeaching: profileForm.gradeTeaching,
            });

            // Update local profile state
            setTeacherProfile(prev => prev ? {
                ...prev,
                title: profileForm.title as 'Mr.' | 'Ms.' | 'Mrs.' | 'Dr.',
                schoolName: profileForm.schoolName,
                gradeTeaching: profileForm.gradeTeaching,
                profileComplete: true,
            } : null);

            setShowProfileModal(false);
        } catch (error) {
            console.error('Error saving profile:', error);
        }
        setSavingProfile(false);
    };

    const handleSignOut = async () => {
        await signOutUser();
        router.push('/teacher');
    };

    const handleCreateRoom = async () => {
        if (!user || !newRoom.roomName.trim()) return;

        // Validate custom questions if enabled
        if (newRoom.useCustomQuestions && customQuestions.length === 0) {
            alert('Please add at least one question or disable custom questions.');
            return;
        }

        setCreating(true);
        try {
            const teacherDisplayName = teacherProfile?.title
                ? `${teacherProfile.title} ${user.displayName?.split(' ').pop() || 'Teacher'}`
                : user.displayName || 'Teacher';

            // Prepare custom questions with IDs
            const questionsWithIds: CustomQuestion[] = customQuestions
                .filter(q => q.question.trim() && q.answer.trim())
                .map((q, index) => ({
                    id: `q-${index}`,
                    question: q.question.trim(),
                    answer: parseFloat(q.answer),
                }));

            // Parse deadline
            const deadline = newRoom.deadline ? new Date(newRoom.deadline) : undefined;

            const room = await createRoom(user.uid, teacherDisplayName, {
                roomName: newRoom.roomName,
                gameMode: newRoom.gameMode,
                difficulty: newRoom.difficulty,
                operation: newRoom.operation,
                timeLimit: newRoom.timeLimit,
                monstersToDefeat: newRoom.useCustomQuestions ? questionsWithIds.length : newRoom.monstersToDefeat,
                useCustomQuestions: newRoom.useCustomQuestions,
                customQuestions: questionsWithIds,
                deadline,
            });

            setRooms([room, ...rooms]);
            setShowCreateModal(false);
            setNewRoom({
                roomName: '',
                gameMode: 'timeTrial',
                difficulty: 1,
                operation: 'addition',
                timeLimit: 300,
                monstersToDefeat: 5,
                useCustomQuestions: false,
                deadline: '',
            });
            setCustomQuestions([]);
        } catch (error) {
            console.error('Error creating room:', error);
        }
        setCreating(false);
    };

    const handleDeleteRoom = async (roomId: string) => {
        if (!confirm('Are you sure you want to delete this room?')) return;

        try {
            await deleteRoom(roomId);
            setRooms(rooms.filter(r => r.id !== roomId));
        } catch (error) {
            console.error('Error deleting room:', error);
        }
    };

    const copyRoomCode = (code: string) => {
        navigator.clipboard.writeText(code);
        alert(`Room code ${code} copied to clipboard!`);
    };

    // Get display name with title
    const getDisplayName = () => {
        if (teacherProfile?.title) {
            const lastName = user?.displayName?.split(' ').pop() || 'Teacher';
            return `${teacherProfile.title} ${lastName}`;
        }
        return user?.displayName?.split(' ')[0] || 'Teacher';
    };

    if (loading) {
        return (
            <main className={styles.main}>
                <div className={styles.loadingScreen}>
                    <div className={styles.spinner}></div>
                    <p>Loading dashboard...</p>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.userInfo}>
                        {user?.photoURL && (
                            <img src={user.photoURL} alt="" className={styles.avatar} />
                        )}
                        <div>
                            <h1 className={styles.greeting}>Hello, {getDisplayName()}!</h1>
                            <p className={styles.email}>
                                {teacherProfile?.schoolName
                                    ? `${teacherProfile.schoolName} • Grade ${teacherProfile.gradeTeaching}`
                                    : user?.email
                                }
                            </p>
                        </div>
                    </div>
                    <button className={styles.signOutBtn} onClick={handleSignOut}>
                        Sign Out
                    </button>
                </header>

                {/* Stats */}
                <div className={styles.stats}>
                    <div className={styles.statCard}>
                        <span className={styles.statIcon}>🏠</span>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{rooms.length}</span>
                            <span className={styles.statLabel}>Rooms</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statIcon}>👨‍👩‍👧‍👦</span>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>
                                {rooms.reduce((sum, r) => sum + (r.participantCount || 0), 0)}
                            </span>
                            <span className={styles.statLabel}>Total Students</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statIcon}>✅</span>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>
                                {rooms.filter(r => r.status === 'active').length}
                            </span>
                            <span className={styles.statLabel}>Active Games</span>
                        </div>
                    </div>
                </div>

                {/* Create Room Button */}
                <button
                    className={styles.createBtn}
                    onClick={() => setShowCreateModal(true)}
                >
                    ➕ Create New Room
                </button>

                {/* Rooms List */}
                <div className={styles.roomsSection}>
                    <h2 className={styles.sectionTitle}>Your Rooms</h2>

                    {rooms.length === 0 ? (
                        <div className={styles.emptyState}>
                            <span className={styles.emptyIcon}>📭</span>
                            <p>No rooms yet. Create your first room!</p>
                        </div>
                    ) : (
                        <div className={styles.roomsList}>
                            {rooms.map((room) => (
                                <div key={room.id} className={styles.roomCard}>
                                    <div className={styles.roomHeader}>
                                        <h3 className={styles.roomName}>{room.roomName}</h3>
                                        <span className={`${styles.status} ${styles[room.status]}`}>
                                            {room.status}
                                        </span>
                                    </div>

                                    <div className={styles.roomCode}>
                                        <span className={styles.codeLabel}>Room Code:</span>
                                        <span className={styles.codeValue}>{room.roomCode}</span>
                                        <button
                                            className={styles.copyBtn}
                                            onClick={() => copyRoomCode(room.roomCode)}
                                        >
                                            📋
                                        </button>
                                    </div>

                                    <div className={styles.roomDetails}>
                                        <span>🎮 {room.gameMode === 'timeTrial' ? 'Time Trial' : 'Assignment'}</span>
                                        <span>📊 Grade {room.difficulty}</span>
                                        <span>👥 {room.participantCount || 0} students</span>
                                    </div>

                                    <div className={styles.roomActions}>
                                        <button
                                            className={styles.viewBtn}
                                            onClick={() => router.push(`/teacher/room/${room.roomCode}`)}
                                        >
                                            👁️ View Room
                                        </button>
                                        <button
                                            className={styles.deleteBtn}
                                            onClick={() => handleDeleteRoom(room.id)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Profile Setup Modal - Shows for new teachers */}
            {showProfileModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2 className={styles.modalTitle}>👋 Welcome to Math Adventure!</h2>
                        <p className={styles.modalSubtitle}>Let&apos;s set up your teacher profile</p>

                        <div className={styles.formGroup}>
                            <label>How would you like to be called?</label>
                            <div className={styles.titleSelector}>
                                {(['Mr.', 'Ms.', 'Mrs.', 'Dr.'] as const).map((title) => (
                                    <button
                                        key={title}
                                        className={`${styles.titleBtn} ${profileForm.title === title ? styles.active : ''}`}
                                        onClick={() => setProfileForm({ ...profileForm, title })}
                                    >
                                        {title}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>School Name</label>
                            <input
                                type="text"
                                placeholder="e.g., Greenwood Elementary School"
                                value={profileForm.schoolName}
                                onChange={(e) => setProfileForm({ ...profileForm, schoolName: e.target.value })}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>What grade(s) do you teach?</label>
                            <input
                                type="text"
                                placeholder="e.g., 3rd Grade or Grades 2-4"
                                value={profileForm.gradeTeaching}
                                onChange={(e) => setProfileForm({ ...profileForm, gradeTeaching: e.target.value })}
                            />
                        </div>

                        <button
                            className={styles.submitBtn}
                            onClick={handleSaveProfile}
                            disabled={!profileForm.title || !profileForm.schoolName.trim() || !profileForm.gradeTeaching.trim() || savingProfile}
                        >
                            {savingProfile ? 'Saving...' : '✨ Complete Setup'}
                        </button>
                    </div>
                </div>
            )}

            {/* Create Room Modal */}
            {showCreateModal && (
                <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <button
                            className={styles.modalClose}
                            onClick={() => setShowCreateModal(false)}
                        >
                            ✕
                        </button>

                        <h2 className={styles.modalTitle}>🏠 Create New Room</h2>

                        <div className={styles.formGroup}>
                            <label>Room Name</label>
                            <input
                                type="text"
                                placeholder="e.g., Math Class 3A"
                                value={newRoom.roomName}
                                onChange={(e) => setNewRoom({ ...newRoom, roomName: e.target.value })}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Game Mode</label>
                            <div className={styles.modeSelector}>
                                <button
                                    className={`${styles.modeBtn} ${newRoom.gameMode === 'timeTrial' ? styles.active : ''}`}
                                    onClick={() => setNewRoom({ ...newRoom, gameMode: 'timeTrial' })}
                                >
                                    <span>⏱️</span>
                                    <span>Time Trial</span>
                                    <small>Best for classroom</small>
                                </button>
                                <button
                                    className={`${styles.modeBtn} ${newRoom.gameMode === 'assignment' ? styles.active : ''}`}
                                    onClick={() => setNewRoom({ ...newRoom, gameMode: 'assignment' })}
                                >
                                    <span>📝</span>
                                    <span>Assignment</span>
                                    <small>Best for homework</small>
                                </button>
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Difficulty (Grade)</label>
                                <select
                                    value={newRoom.difficulty}
                                    onChange={(e) => setNewRoom({ ...newRoom, difficulty: parseInt(e.target.value) })}
                                >
                                    <option value={1}>Grade 1</option>
                                    <option value={2}>Grade 2</option>
                                    <option value={3}>Grade 3</option>
                                    <option value={4}>Grade 4</option>
                                    <option value={5}>Grade 5</option>
                                    <option value={6}>Grade 6</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Operation</label>
                                <select
                                    value={newRoom.operation}
                                    onChange={(e) => setNewRoom({ ...newRoom, operation: e.target.value })}
                                >
                                    <option value="addition">➕ Addition</option>
                                    <option value="subtraction">➖ Subtraction</option>
                                    <option value="multiplication">✖️ Multiplication</option>
                                    <option value="division">➗ Division</option>
                                    <option value="mixed">🔀 Mixed</option>
                                </select>
                            </div>
                        </div>

                        {newRoom.gameMode === 'timeTrial' && (
                            <div className={styles.formGroup}>
                                <label>Time Limit</label>
                                <select
                                    value={newRoom.timeLimit}
                                    onChange={(e) => setNewRoom({ ...newRoom, timeLimit: parseInt(e.target.value) })}
                                >
                                    <option value={60}>1 minute</option>
                                    <option value={120}>2 minutes</option>
                                    <option value={180}>3 minutes</option>
                                    <option value={300}>5 minutes</option>
                                    <option value={600}>10 minutes</option>
                                </select>
                            </div>
                        )}

                        {/* Deadline for Assignment Mode */}
                        {newRoom.gameMode === 'assignment' && (
                            <div className={styles.formGroup}>
                                <label>📅 Deadline (Optional)</label>
                                <input
                                    type="datetime-local"
                                    value={newRoom.deadline}
                                    onChange={(e) => setNewRoom({ ...newRoom, deadline: e.target.value })}
                                    min={new Date().toISOString().slice(0, 16)}
                                />
                                <small className={styles.formHint}>Room will auto-close after deadline</small>
                            </div>
                        )}

                        {/* Custom Questions Toggle */}
                        <div className={styles.formGroup}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={newRoom.useCustomQuestions}
                                    onChange={(e) => setNewRoom({ ...newRoom, useCustomQuestions: e.target.checked })}
                                />
                                <span>📝 Use my own questions</span>
                            </label>
                        </div>

                        {/* Auto-Generated Questions Config */}
                        {!newRoom.useCustomQuestions && (
                            <div className={styles.formGroup}>
                                <label>Monsters to Defeat</label>
                                <select
                                    value={newRoom.monstersToDefeat}
                                    onChange={(e) => setNewRoom({ ...newRoom, monstersToDefeat: parseInt(e.target.value) })}
                                >
                                    <option value={3}>3 monsters</option>
                                    <option value={5}>5 monsters</option>
                                    <option value={10}>10 monsters</option>
                                    <option value={15}>15 monsters</option>
                                    <option value={20}>20 monsters</option>
                                </select>
                            </div>
                        )}

                        {/* Custom Questions Builder */}
                        {newRoom.useCustomQuestions && (
                            <div className={styles.questionsBuilder}>
                                <div className={styles.questionsHeader}>
                                    <span>Your Questions ({customQuestions.length}/20)</span>
                                    {customQuestions.length < 20 && (
                                        <button
                                            type="button"
                                            className={styles.addQuestionBtn}
                                            onClick={() => setCustomQuestions([...customQuestions, { question: '', answer: '' }])}
                                        >
                                            + Add Question
                                        </button>
                                    )}
                                </div>

                                {customQuestions.length === 0 && (
                                    <p className={styles.questionsEmpty}>
                                        No questions yet. Click &quot;Add Question&quot; to start!
                                    </p>
                                )}

                                <div className={styles.questionsList}>
                                    {customQuestions.map((q, index) => (
                                        <div key={index} className={styles.questionItem}>
                                            <span className={styles.questionNumber}>{index + 1}</span>
                                            <input
                                                type="text"
                                                placeholder="e.g., 5 + 3 = ?"
                                                value={q.question}
                                                onChange={(e) => {
                                                    const updated = [...customQuestions];
                                                    updated[index].question = e.target.value;
                                                    setCustomQuestions(updated);
                                                }}
                                                className={styles.questionInput}
                                            />
                                            <input
                                                type="number"
                                                placeholder="Answer"
                                                value={q.answer}
                                                onChange={(e) => {
                                                    const updated = [...customQuestions];
                                                    updated[index].answer = e.target.value;
                                                    setCustomQuestions(updated);
                                                }}
                                                className={styles.answerInput}
                                            />
                                            <button
                                                type="button"
                                                className={styles.removeQuestionBtn}
                                                onClick={() => {
                                                    const updated = customQuestions.filter((_, i) => i !== index);
                                                    setCustomQuestions(updated);
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            className={styles.submitBtn}
                            onClick={handleCreateRoom}
                            disabled={!newRoom.roomName.trim() || creating || (newRoom.useCustomQuestions && customQuestions.length === 0)}
                        >
                            {creating ? 'Creating...' : '🚀 Create Room'}
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
