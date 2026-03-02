import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PointsService } from '../../services/points-service';
import { ServerInterface } from '../../models/points-interface';

@Component({
  selector: 'app-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './field.html',
  styleUrls: ['./field.scss'],
})
export class Field implements OnInit {
  points: ServerInterface[] = [];
  selected: ServerInterface | null = null;

  constructor(private pointsService: PointsService) {}

  ngOnInit() {
    this.points = [
      { id: 1, type: 'playerBlue', x: 100, y: 200, updatedAt: new Date().toISOString() },
      { id: 2, type: 'playerRed', x: 200, y: 200, updatedAt: new Date().toISOString() },
      { id: 3, type: 'ball', x: 150, y: 180, updatedAt: new Date().toISOString() },
    ];
    // this.load(); -> ha van backend vissza lehet kapcsolni, this.points-ot meg törölni!!
  }

  load() {
    this.pointsService.getAll().subscribe((data) => (this.points = data));
  }

  select(point: ServerInterface) {
    this.selected = { ...point };
  }

  save() {
    if (!this.selected) return;
    const localCopy = { ...this.selected };
    const idx = this.points.findIndex((p) => p.id === localCopy.id);
    if (idx >= 0) this.points[idx] = localCopy;

    this.pointsService.update(localCopy).subscribe({
      next: (updated) => {
        if (idx >= 0) this.points[idx] = updated;
        this.selected = null;
      },
      error: (err) => {
        if (idx >= 0) this.points[idx] = this.points[idx];
        console.error('Update failed', err);
      },
    });
  }

  onFieldClick(event: MouseEvent) {
    if (!this.selected) return;
    const rect = (event.currentTarget as Element).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.selected.x = Math.round(x);
    this.selected.y = Math.round(y);
  }
}
