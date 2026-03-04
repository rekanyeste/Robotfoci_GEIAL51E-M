import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-home.component',
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {

  activeButton: string | null = 'single';

  constructor(private router: Router) {}

  setActive(button: string) {
    this.activeButton = button;
  }

  singleplayer(): void {
    this.setActive('single');
    this.router.navigate(['field']);
  }

  multiplayer(): void {
    this.setActive('multi');
  }

  joinGame(): void {
    this.setActive('join');
  }

  leaderboard(): void {
    this.setActive('leader');
  }

  quit(): void {
    this.setActive('quit');
  }
}
