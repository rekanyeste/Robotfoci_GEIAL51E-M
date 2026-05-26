import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AudioControlComponent } from '../components/audio-control.component/audio-control.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AudioControlComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  standalone: true,
})
export class App {
  protected readonly title = signal('Robotfoci');
}
