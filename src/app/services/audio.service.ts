import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface SoundEntry {
  elements: HTMLAudioElement[];
  currentIndex: number;
  volume: number;
  isMuted: boolean;
}

interface SoundProps {
  cooldown: number;
  loop: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private soundsMap = new Map<string, SoundEntry>();
  private masterVolume = 1;
  private masterMuted = false;
  private readonly POOL_SIZE = 5;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.initSounds();
    }
  }

  private lastPlayTime = new Map<string, number>();
  private readonly soundConfig: Record<string, SoundProps> = {
    'background-music': { cooldown: 0, loop: true },
    'stadium-ambience': { cooldown: 0, loop: true },
    'ball-kick': { cooldown: 300, loop: false },
    'goal': { cooldown: 0, loop: false },
    'error': { cooldown: 300, loop: false },
    'game-start': { cooldown: 0, loop: false },
    'game-over': { cooldown: 0, loop: false }
  };

  private initSounds(): void {
    const soundIds = Object.keys(this.soundConfig);

    for (const soundId of soundIds) {
      const elements: HTMLAudioElement[] = [];

      for (let i = 0; i < this.POOL_SIZE; i++) {
        const audio = new Audio(`/assets/audio/${soundId}.mp3`);

        audio.volume = 1;

        const config = this.soundConfig[soundId];

        if (config?.loop) {
          audio.loop = true;
        }

        elements.push(audio);
      }

      this.soundsMap.set(soundId, {
        elements,
        currentIndex: 0,
        volume: 1,
        isMuted: false
      });
    }
  }

  public play(soundId: string): void {
    const soundEntry = this.soundsMap.get(soundId);
    if (!soundEntry) return;

    const config = this.soundConfig[soundId] ?? {};

    if (config.loop) {
      const audio = soundEntry.elements[0];

      this.updateAudioVolume(audio, soundEntry);

      if (audio.paused) {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      }

      return;
    }

    const now = Date.now();
    const last = this.lastPlayTime.get(soundId) ?? 0;
    const cooldown = config.cooldown ?? 0;

    if (now - last < cooldown) return;
    this.lastPlayTime.set(soundId, now);

    const audio = soundEntry.elements[soundEntry.currentIndex];

    soundEntry.currentIndex = (soundEntry.currentIndex + 1) % soundEntry.elements.length;
    audio.currentTime = 0;

    this.updateAudioVolume(audio, soundEntry);

    audio.play().catch(console.error);
  }

  public stop(soundId?: string): void {
    if (soundId) {
      const soundEntry = this.soundsMap.get(soundId);
      if (soundEntry) {
        soundEntry.elements.forEach((audio) => {
          audio.pause();
          audio.currentTime = 0;
        });
      }
    } else {
      // Stop all sounds
      this.soundsMap.forEach((entry) => {
        entry.elements.forEach((audio) => {
          audio.pause();
          audio.currentTime = 0;
        });
      });
    }
  }

  public setVolume(target: string | 'master', volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));

    if (target === 'master') {
      this.masterVolume = clampedVolume;
      this.soundsMap.forEach((entry) => {
        entry.elements.forEach((audio) => {
          if (!audio.paused) {
            this.updateAudioVolume(audio, entry);
          }
        });
      });
    } else {
      const soundEntry = this.soundsMap.get(target);
      if (soundEntry) {
        soundEntry.volume = clampedVolume;
        soundEntry.elements.forEach((audio) => {
          this.updateAudioVolume(audio, soundEntry);
        });
      }
    }
  }

  public mute(soundId?: string): void {
    if (soundId) {
      const soundEntry = this.soundsMap.get(soundId);
      if (soundEntry) {
        soundEntry.isMuted = true;
        soundEntry.elements.forEach((audio) => {
          audio.volume = 0;
        });
      }
    } else {
      // Mute all sounds
      this.masterMuted = true;
      this.soundsMap.forEach((entry) => {
        entry.elements.forEach((audio) => {
          audio.volume = 0;
        });
      });
    }
  }
  
  public unmute(soundId?: string): void {
    if (soundId) {
      const soundEntry = this.soundsMap.get(soundId);
      if (soundEntry) {
        soundEntry.isMuted = false;
        soundEntry.elements.forEach((audio) => {
          this.updateAudioVolume(audio, soundEntry);
        });
      }
    } else {
      // Unmute all sounds
      this.masterMuted = false;
      this.soundsMap.forEach((entry) => {
        entry.elements.forEach((audio) => {
          this.updateAudioVolume(audio, entry);
        });
      });
    }
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public isMuted(): boolean {
    return this.masterMuted;
  }

  private updateAudioVolume(audio: HTMLAudioElement, soundEntry: SoundEntry): void {
    if (this.masterMuted || soundEntry.isMuted) {
      audio.volume = 0;
    } else {
      audio.volume = soundEntry.volume * this.masterVolume;
    }
  }
}
