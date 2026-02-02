// Game Engine - Math Problem Generator and Game Logic

export type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division';
export type Difficulty = 1 | 2 | 3 | 4 | 5 | 6;

export interface MathProblem {
    num1: number;
    num2: number;
    operation: Operation;
    answer: number;
    displayString: string;
}

export interface GameState {
    score: number;
    streak: number;
    questionsAnswered: number;
    correctAnswers: number;
    wrongAnswers: number;
    timeLeft: number;
    currentProblem: MathProblem | null;
    difficulty: Difficulty;
    operation: Operation;
    isGameOver: boolean;
    stars: number;
}

// Get number range based on difficulty (grade level)
function getNumberRange(difficulty: Difficulty): { min: number; max: number } {
    const ranges: Record<Difficulty, { min: number; max: number }> = {
        1: { min: 1, max: 10 },
        2: { min: 1, max: 20 },
        3: { min: 1, max: 50 },
        4: { min: 1, max: 100 },
        5: { min: 1, max: 500 },
        6: { min: 1, max: 1000 },
    };
    return ranges[difficulty];
}

// Generate random number within range
function getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get operation symbol
function getOperationSymbol(operation: Operation): string {
    const symbols: Record<Operation, string> = {
        addition: '+',
        subtraction: '−',
        multiplication: '×',
        division: '÷',
    };
    return symbols[operation];
}

// Generate a math problem based on difficulty and operation
export function generateProblem(difficulty: Difficulty, operation: Operation): MathProblem {
    const { min, max } = getNumberRange(difficulty);
    let num1: number, num2: number, answer: number;

    switch (operation) {
        case 'addition':
            num1 = getRandomNumber(min, max);
            num2 = getRandomNumber(min, max);
            answer = num1 + num2;
            break;

        case 'subtraction':
            // Ensure positive result
            num1 = getRandomNumber(min, max);
            num2 = getRandomNumber(min, Math.min(num1, max));
            answer = num1 - num2;
            break;

        case 'multiplication':
            // Use smaller numbers for multiplication
            const multMax = Math.min(12, Math.floor(max / 2));
            num1 = getRandomNumber(1, multMax);
            num2 = getRandomNumber(1, multMax);
            answer = num1 * num2;
            break;

        case 'division':
            // Ensure whole number result
            num2 = getRandomNumber(1, Math.min(12, max));
            answer = getRandomNumber(1, Math.min(12, max));
            num1 = num2 * answer;
            break;

        default:
            num1 = 1;
            num2 = 1;
            answer = 2;
    }

    const displayString = `${num1} ${getOperationSymbol(operation)} ${num2}`;

    return { num1, num2, operation, answer, displayString };
}

// Check if answer is correct
export function checkAnswer(problem: MathProblem, userAnswer: number): boolean {
    return problem.answer === userAnswer;
}

// Calculate stars based on performance
export function calculateStars(correctAnswers: number, totalQuestions: number): number {
    const percentage = (correctAnswers / totalQuestions) * 100;
    if (percentage >= 90) return 3;
    if (percentage >= 70) return 2;
    if (percentage >= 50) return 1;
    return 0;
}

// Calculate score for correct answer (with streak bonus)
export function calculateScore(streak: number, difficulty: Difficulty): number {
    const baseScore = difficulty * 10;
    const streakBonus = Math.min(streak, 5) * 5;
    return baseScore + streakBonus;
}

// Get difficulty label
export function getDifficultyLabel(difficulty: Difficulty): string {
    const labels: Record<Difficulty, string> = {
        1: 'Grade 1',
        2: 'Grade 2',
        3: 'Grade 3',
        4: 'Grade 4',
        5: 'Grade 5',
        6: 'Grade 6',
    };
    return labels[difficulty];
}

// Get operation label
export function getOperationLabel(operation: Operation): string {
    const labels: Record<Operation, string> = {
        addition: 'Addition',
        subtraction: 'Subtraction',
        multiplication: 'Multiplication',
        division: 'Division',
    };
    return labels[operation];
}

// Initial game state
export function createInitialGameState(difficulty: Difficulty, operation: Operation): GameState {
    return {
        score: 0,
        streak: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        timeLeft: 60, // 60 seconds per round
        currentProblem: generateProblem(difficulty, operation),
        difficulty,
        operation,
        isGameOver: false,
        stars: 0,
    };
}
