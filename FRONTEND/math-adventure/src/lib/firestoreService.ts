// Firestore Service - Database operations for scores and leaderboard

import { db } from './firebase';
import {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    getDocs,
    Timestamp,
    where
} from 'firebase/firestore';
import type { Operation, Difficulty } from './gameEngine';

export interface GameScore {
    id?: string;
    playerName: string;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    difficulty: Difficulty;
    operation: Operation;
    stars: number;
    createdAt: Timestamp;
}

const SCORES_COLLECTION = 'mathAdventureScores';

// Save a game score to Firestore
export async function saveScore(score: Omit<GameScore, 'id' | 'createdAt'>): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, SCORES_COLLECTION), {
            ...score,
            createdAt: Timestamp.now(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving score:', error);
        throw error;
    }
}

// Get top scores (leaderboard)
export async function getTopScores(limitCount: number = 10): Promise<GameScore[]> {
    try {
        const q = query(
            collection(db, SCORES_COLLECTION),
            orderBy('score', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        const scores: GameScore[] = [];

        querySnapshot.forEach((doc) => {
            scores.push({
                id: doc.id,
                ...doc.data() as Omit<GameScore, 'id'>,
            });
        });

        return scores;
    } catch (error) {
        console.error('Error getting top scores:', error);
        return [];
    }
}

// Get top scores by difficulty
export async function getTopScoresByDifficulty(
    difficulty: Difficulty,
    limitCount: number = 10
): Promise<GameScore[]> {
    try {
        const q = query(
            collection(db, SCORES_COLLECTION),
            where('difficulty', '==', difficulty),
            orderBy('score', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        const scores: GameScore[] = [];

        querySnapshot.forEach((doc) => {
            scores.push({
                id: doc.id,
                ...doc.data() as Omit<GameScore, 'id'>,
            });
        });

        return scores;
    } catch (error) {
        console.error('Error getting scores by difficulty:', error);
        return [];
    }
}

// Get top scores by operation
export async function getTopScoresByOperation(
    operation: Operation,
    limitCount: number = 10
): Promise<GameScore[]> {
    try {
        const q = query(
            collection(db, SCORES_COLLECTION),
            where('operation', '==', operation),
            orderBy('score', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        const scores: GameScore[] = [];

        querySnapshot.forEach((doc) => {
            scores.push({
                id: doc.id,
                ...doc.data() as Omit<GameScore, 'id'>,
            });
        });

        return scores;
    } catch (error) {
        console.error('Error getting scores by operation:', error);
        return [];
    }
}
