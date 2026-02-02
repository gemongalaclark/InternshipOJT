// Sound Manager - Audio handling for game effects

import { Howl, Howler } from 'howler';

type SoundKey = 'correct' | 'wrong' | 'click' | 'levelup' | 'bgmusic';

interface SoundConfig {
    src: string[];
    volume?: number;
    loop?: boolean;
}

class SoundManager {
    private sounds: Map<SoundKey, Howl> = new Map();
    private isMuted: boolean = false;
    private bgMusicPlaying: boolean = false;

    constructor() {
        // Initialize sounds with their configurations
        const soundConfigs: Record<SoundKey, SoundConfig> = {
            correct: {
                src: ['/sounds/correct.mp3'],
                volume: 0.7,
            },
            wrong: {
                src: ['/sounds/wrong.mp3'],
                volume: 0.6,
            },
            click: {
                src: ['/sounds/click.mp3'],
                volume: 0.5,
            },
            levelup: {
                src: ['/sounds/levelup.mp3'],
                volume: 0.8,
            },
            bgmusic: {
                src: ['/sounds/bgmusic.mp3'],
                volume: 0.3,
                loop: true,
            },
        };

        // Create Howl instances for each sound
        Object.entries(soundConfigs).forEach(([key, config]) => {
            this.sounds.set(key as SoundKey, new Howl(config));
        });
    }

    // Play a sound effect
    play(sound: SoundKey): void {
        if (this.isMuted) return;
        const howl = this.sounds.get(sound);
        if (howl) {
            howl.play();
        }
    }

    // Start background music
    startBgMusic(): void {
        if (this.isMuted || this.bgMusicPlaying) return;
        const bgMusic = this.sounds.get('bgmusic');
        if (bgMusic) {
            bgMusic.play();
            this.bgMusicPlaying = true;
        }
    }

    // Stop background music
    stopBgMusic(): void {
        const bgMusic = this.sounds.get('bgmusic');
        if (bgMusic) {
            bgMusic.stop();
            this.bgMusicPlaying = false;
        }
    }

    // Toggle mute
    toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        Howler.mute(this.isMuted);
        return this.isMuted;
    }

    // Set mute state
    setMute(muted: boolean): void {
        this.isMuted = muted;
        Howler.mute(muted);
    }

    // Check if muted
    getMuted(): boolean {
        return this.isMuted;
    }

    // Set volume for all sounds (0.0 to 1.0)
    setMasterVolume(volume: number): void {
        Howler.volume(Math.max(0, Math.min(1, volume)));
    }
}

// Singleton instance
let soundManagerInstance: SoundManager | null = null;

export function getSoundManager(): SoundManager {
    if (typeof window !== 'undefined' && !soundManagerInstance) {
        soundManagerInstance = new SoundManager();
    }
    return soundManagerInstance as SoundManager;
}

export default SoundManager;
