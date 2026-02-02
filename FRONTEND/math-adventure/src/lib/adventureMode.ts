// Adventure Mode - Level Progression and Monster Battle System

export interface Monster {
    id: string;
    name: string;
    emoji: string;
    maxHealth: number;
    description: string;
}

export interface Level {
    id: number;
    name: string;
    monster: Monster;
    operation: 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed';
    difficulty: 1 | 2 | 3 | 4 | 5 | 6;
    questionsToWin: number;
    timePerQuestion: number; // seconds
    isUnlocked: boolean;
    starsEarned: number;
}

export interface PlayerProgress {
    currentLevel: number;
    totalStars: number;
    levels: { [key: number]: { completed: boolean; stars: number } };
    hearts: number;
    maxHearts: number;
}

// Monster definitions
export const MONSTERS: Monster[] = [
    { id: 'slime', name: 'Slimy', emoji: '🟢', maxHealth: 3, description: 'A friendly slime learning to count!' },
    { id: 'goblin', name: 'Gobby', emoji: '👺', maxHealth: 4, description: 'A tricky goblin who loves subtraction!' },
    { id: 'skeleton', name: 'Bones', emoji: '💀', maxHealth: 5, description: 'A rattling skeleton of numbers!' },
    { id: 'ghost', name: 'Spooky', emoji: '👻', maxHealth: 5, description: 'A ghost who multiplies in the dark!' },
    { id: 'vampire', name: 'Count Mathula', emoji: '🧛', maxHealth: 6, description: 'He counts everything... especially wrong answers!' },
    { id: 'wizard', name: 'Dividus', emoji: '🧙', maxHealth: 6, description: 'A wizard who divides and conquers!' },
    { id: 'dragon_baby', name: 'Sparky', emoji: '🐲', maxHealth: 7, description: 'A baby dragon with fiery math skills!' },
    { id: 'ogre', name: 'Grumble', emoji: '👹', maxHealth: 8, description: 'A grumpy ogre who hates wrong answers!' },
    { id: 'demon', name: 'Blazehorn', emoji: '😈', maxHealth: 9, description: 'A demon from the depths of division!' },
    { id: 'dragon_king', name: 'Math Dragon King', emoji: '🐉', maxHealth: 10, description: 'The ultimate math challenge! Defeat him to become a Math Champion!' },
];

// Level definitions
export const LEVELS: Level[] = [
    { id: 1, name: 'Slime Forest', monster: MONSTERS[0], operation: 'addition', difficulty: 1, questionsToWin: 5, timePerQuestion: 15, isUnlocked: true, starsEarned: 0 },
    { id: 2, name: 'Goblin Cave', monster: MONSTERS[1], operation: 'subtraction', difficulty: 1, questionsToWin: 5, timePerQuestion: 15, isUnlocked: false, starsEarned: 0 },
    { id: 3, name: 'Skeleton Dungeon', monster: MONSTERS[2], operation: 'addition', difficulty: 2, questionsToWin: 6, timePerQuestion: 12, isUnlocked: false, starsEarned: 0 },
    { id: 4, name: 'Haunted Mansion', monster: MONSTERS[3], operation: 'multiplication', difficulty: 2, questionsToWin: 6, timePerQuestion: 12, isUnlocked: false, starsEarned: 0 },
    { id: 5, name: 'Vampire Castle', monster: MONSTERS[4], operation: 'mixed', difficulty: 3, questionsToWin: 7, timePerQuestion: 10, isUnlocked: false, starsEarned: 0 },
    { id: 6, name: 'Wizard Tower', monster: MONSTERS[5], operation: 'division', difficulty: 3, questionsToWin: 7, timePerQuestion: 10, isUnlocked: false, starsEarned: 0 },
    { id: 7, name: 'Dragon Nest', monster: MONSTERS[6], operation: 'mixed', difficulty: 4, questionsToWin: 8, timePerQuestion: 8, isUnlocked: false, starsEarned: 0 },
    { id: 8, name: 'Ogre Swamp', monster: MONSTERS[7], operation: 'mixed', difficulty: 5, questionsToWin: 8, timePerQuestion: 8, isUnlocked: false, starsEarned: 0 },
    { id: 9, name: 'Demon Realm', monster: MONSTERS[8], operation: 'mixed', difficulty: 5, questionsToWin: 9, timePerQuestion: 7, isUnlocked: false, starsEarned: 0 },
    { id: 10, name: 'Dragon King Lair', monster: MONSTERS[9], operation: 'mixed', difficulty: 6, questionsToWin: 10, timePerQuestion: 6, isUnlocked: false, starsEarned: 0 },
];

// Story dialogues
export const STORY_INTRO = {
    title: "The Math Kingdom is in Danger!",
    paragraphs: [
        "The evil Math Monsters have invaded the kingdom! 🏰",
        "They've stolen all the numbers and hidden them in their lairs!",
        "Only a brave Math Hero can defeat them by solving math problems!",
        "Are YOU ready to become the Math Champion? 🦸‍♂️"
    ]
};

export const LEVEL_INTROS: { [key: number]: string } = {
    1: "A slimy creature blocks your path! Show it your addition skills!",
    2: "A sneaky goblin appears! Can you subtract your way to victory?",
    3: "Bones rattle in the dungeon! Add faster to defeat the skeleton!",
    4: "A ghost haunts the mansion! Multiply your courage!",
    5: "Count Mathula awaits! Mix your math moves!",
    6: "The wizard challenges you with division spells!",
    7: "A baby dragon guards the path! Show all your skills!",
    8: "The ogre is grumpy! Answer quickly before he stomps!",
    9: "A demon rises from the shadows! This is getting serious!",
    10: "The Math Dragon King! Defeat him to save the kingdom!"
};

export const VICTORY_MESSAGES = [
    "Amazing! You defeated the monster! 🎉",
    "Incredible math skills! The monster is vanquished! ⭐",
    "You're a true Math Hero! 🦸‍♂️",
    "The kingdom celebrates your victory! 🏰",
];

export const DEFEAT_MESSAGES = [
    "Don't give up! Try again! 💪",
    "Practice makes perfect! One more try! 🔄",
    "You can do it! Believe in yourself! ⭐",
];

// Progress management
const PROGRESS_KEY = 'mathAdventureProgress';

export function getDefaultProgress(): PlayerProgress {
    return {
        currentLevel: 1,
        totalStars: 0,
        levels: { 1: { completed: false, stars: 0 } },
        hearts: 3,
        maxHearts: 3,
    };
}

export function loadProgress(): PlayerProgress {
    if (typeof window === 'undefined') return getDefaultProgress();

    const saved = localStorage.getItem(PROGRESS_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch {
            return getDefaultProgress();
        }
    }
    return getDefaultProgress();
}

export function saveProgress(progress: PlayerProgress): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function unlockNextLevel(progress: PlayerProgress, currentLevelId: number, starsEarned: number): PlayerProgress {
    const updated = { ...progress };

    // Mark current level as completed
    updated.levels[currentLevelId] = { completed: true, stars: starsEarned };

    // Unlock next level if exists
    if (currentLevelId < LEVELS.length) {
        updated.levels[currentLevelId + 1] = updated.levels[currentLevelId + 1] || { completed: false, stars: 0 };
        updated.currentLevel = Math.max(updated.currentLevel, currentLevelId + 1);
    }

    // Update total stars
    updated.totalStars = Object.values(updated.levels).reduce((sum, l) => sum + (l.stars || 0), 0);

    saveProgress(updated);
    return updated;
}

export function resetProgress(): PlayerProgress {
    const defaultProgress = getDefaultProgress();
    saveProgress(defaultProgress);
    return defaultProgress;
}

export function isLevelUnlocked(progress: PlayerProgress, levelId: number): boolean {
    if (levelId === 1) return true;
    return progress.levels[levelId - 1]?.completed || false;
}

export function getLevelStars(progress: PlayerProgress, levelId: number): number {
    return progress.levels[levelId]?.stars || 0;
}
