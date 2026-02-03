import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, onSnapshot, updateDoc, deleteDoc, serverTimestamp, orderBy, Timestamp } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if it hasn't been initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ==================== AUTHENTICATION ====================

// Sign in with Google
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Create/update teacher profile in Firestore
    await createOrUpdateTeacher(user);

    return user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

// Sign out
export async function signOutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

// Listen to auth state changes
export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Get current user
export function getCurrentUser() {
  return auth.currentUser;
}

// ==================== TEACHER PROFILE ====================

export interface TeacherProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}

// Create or update teacher profile
async function createOrUpdateTeacher(user: User) {
  const teacherRef = doc(db, 'teachers', user.uid);
  const teacherDoc = await getDoc(teacherRef);

  if (!teacherDoc.exists()) {
    // New teacher - create profile
    await setDoc(teacherRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'Teacher',
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  } else {
    // Existing teacher - update last login
    await updateDoc(teacherRef, {
      lastLoginAt: serverTimestamp(),
    });
  }
}

// Get teacher profile
export async function getTeacherProfile(uid: string): Promise<TeacherProfile | null> {
  const teacherRef = doc(db, 'teachers', uid);
  const teacherDoc = await getDoc(teacherRef);

  if (teacherDoc.exists()) {
    return teacherDoc.data() as TeacherProfile;
  }
  return null;
}

// ==================== ROOMS ====================

export interface Room {
  id: string;
  roomCode: string;
  roomName: string;
  teacherId: string;
  teacherName: string;
  gameMode: 'timeTrial' | 'assignment';
  difficulty: number;
  operation: 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed';
  status: 'waiting' | 'active' | 'completed';
  timeLimit: number; // seconds for time trial
  monstersToDefeat: number;
  dueDate?: Timestamp; // for assignment mode
  createdAt: Timestamp;
  participantCount: number;
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  monstersDefeated: number;
  joinedAt: Timestamp;
  completedAt: Timestamp | null;
}

// Generate random room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new room
export async function createRoom(
  teacherId: string,
  teacherName: string,
  roomData: {
    roomName: string;
    gameMode: 'timeTrial' | 'assignment';
    difficulty: number;
    operation: string;
    timeLimit?: number;
    monstersToDefeat?: number;
    dueDate?: Date;
  }
): Promise<Room> {
  const roomCode = generateRoomCode();

  const roomRef = await addDoc(collection(db, 'rooms'), {
    roomCode,
    roomName: roomData.roomName,
    teacherId,
    teacherName,
    gameMode: roomData.gameMode,
    difficulty: roomData.difficulty,
    operation: roomData.operation,
    status: 'waiting',
    timeLimit: roomData.timeLimit || 300,
    monstersToDefeat: roomData.monstersToDefeat || 5,
    dueDate: roomData.dueDate ? Timestamp.fromDate(roomData.dueDate) : null,
    createdAt: serverTimestamp(),
    participantCount: 0,
  });

  return {
    id: roomRef.id,
    roomCode,
    roomName: roomData.roomName,
    teacherId,
    teacherName,
    gameMode: roomData.gameMode,
    difficulty: roomData.difficulty,
    operation: roomData.operation as Room['operation'],
    status: 'waiting',
    timeLimit: roomData.timeLimit || 300,
    monstersToDefeat: roomData.monstersToDefeat || 5,
    createdAt: Timestamp.now(),
    participantCount: 0,
  };
}

// Get rooms by teacher
export async function getTeacherRooms(teacherId: string): Promise<Room[]> {
  const roomsQuery = query(
    collection(db, 'rooms'),
    where('teacherId', '==', teacherId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(roomsQuery);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Room));
}

// Get room by code
export async function getRoomByCode(roomCode: string): Promise<Room | null> {
  const roomsQuery = query(
    collection(db, 'rooms'),
    where('roomCode', '==', roomCode.toUpperCase())
  );

  const snapshot = await getDocs(roomsQuery);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  } as Room;
}

// Join room
export async function joinRoom(
  roomCode: string,
  playerName: string,
  playerAvatar: string
): Promise<{ room: Room; participantId: string } | null> {
  const room = await getRoomByCode(roomCode);
  if (!room) return null;

  // Add participant
  const participantRef = await addDoc(
    collection(db, 'rooms', room.id, 'participants'),
    {
      name: playerName,
      avatar: playerAvatar,
      score: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      monstersDefeated: 0,
      joinedAt: serverTimestamp(),
      completedAt: null,
    }
  );

  // Update participant count
  const roomRef = doc(db, 'rooms', room.id);
  await updateDoc(roomRef, {
    participantCount: room.participantCount + 1,
  });

  return {
    room,
    participantId: participantRef.id,
  };
}

// Listen to room updates
export function listenToRoom(roomId: string, callback: (room: Room | null) => void) {
  const roomRef = doc(db, 'rooms', roomId);
  return onSnapshot(roomRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as Room);
    } else {
      callback(null);
    }
  });
}

// Listen to participants
export function listenToParticipants(roomId: string, callback: (participants: Participant[]) => void) {
  const participantsQuery = query(
    collection(db, 'rooms', roomId, 'participants'),
    orderBy('score', 'desc')
  );

  return onSnapshot(participantsQuery, (snapshot) => {
    const participants = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Participant));
    callback(participants);
  });
}

// Update participant score
export async function updateParticipantScore(
  roomId: string,
  participantId: string,
  data: {
    score: number;
    correctAnswers: number;
    totalAnswers: number;
    monstersDefeated: number;
    completed?: boolean;
  }
) {
  const participantRef = doc(db, 'rooms', roomId, 'participants', participantId);
  await updateDoc(participantRef, {
    score: data.score,
    correctAnswers: data.correctAnswers,
    totalAnswers: data.totalAnswers,
    monstersDefeated: data.monstersDefeated,
    completedAt: data.completed ? serverTimestamp() : null,
  });
}

// Start room game (teacher only)
export async function startRoom(roomId: string) {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, {
    status: 'active',
    startedAt: serverTimestamp(),
  });
}

// End room game (teacher only)
export async function endRoom(roomId: string) {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, {
    status: 'completed',
    endedAt: serverTimestamp(),
  });
}

// Delete room
export async function deleteRoom(roomId: string) {
  const roomRef = doc(db, 'rooms', roomId);
  await deleteDoc(roomRef);
}

export { app, db, auth };
