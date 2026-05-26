import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../services/audio.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-audio-control',
  templateUrl: './audio-control.component.html',
  styleUrls: ['./audio-control.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class AudioControlComponent implements OnInit {
  masterVolume: number = 100;
  isMuted: boolean = false;

  constructor(private audioService: AudioService) {}

  ngOnInit(): void {
    this.masterVolume = this.audioService.getMasterVolume() * 75;
    this.isMuted = this.audioService.isMuted();
  }

  onVolumeChange(newVolume: number): void {
    this.masterVolume = newVolume;
    this.audioService.setVolume('master', newVolume / 100);
  }

  toggleMute(): void {
    if (this.isMuted) {
      this.audioService.unmute();
      this.isMuted = false;
    } else {
      this.audioService.mute();
      this.isMuted = true;
    }
  }

  getMuteIcon(): string {
    return this.isMuted ? '🔇' : '🔊';
  }

  getVolumeIcon(): string {
    if (this.isMuted || this.masterVolume === 0) {
      return '🔇';
    } else if (this.masterVolume < 33) {
      return '🔈';
    } else if (this.masterVolume < 66) {
      return '🔉';
    } else {
      return '🔊';
    }
  }
}
