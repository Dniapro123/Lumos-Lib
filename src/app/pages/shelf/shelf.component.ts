import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ShelfService } from '../../services/shelf.service';
import { BookCardComponent } from '../../shared/components/book-card/book-card.component';
import { Shelf } from '../../shared/components/shelf';
import { forkJoin } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-shelf',
  imports: [CommonModule, BookCardComponent],
  templateUrl: './shelf.component.html',
  styleUrls: ['./shelf.component.css']
})
export class ShelfComponent implements OnInit {
  shelf: Shelf | null = null;
  selectMode = false;
  selected = new Set<string>();

  constructor(private route: ActivatedRoute, private shelfService: ShelfService) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.shelfService.getShelf(id).subscribe(s => this.shelf = s);
  }

  shareShelf(): void {
    if (!this.shelf) return;
    this.shelfService.generateShareToken(this.shelf.id).subscribe({
      next: res => {
        if (this.shelf) {
          this.shelf.shareToken = res.shareToken;
          this.shelf.isPublic = true;
          alert(`Share link: ${window.location.origin}/shared/${res.shareToken}`);
        }
      },
      error: err => console.error('Failed to share shelf', err)
    });
  }

  toggleSelectMode(): void {
    this.selectMode = !this.selectMode;
    if (!this.selectMode) {
      this.selected.clear();
    }
  }

  toggleBook(id: string, checked: boolean|null): void {
    if (checked) this.selected.add(id); else this.selected.delete(id);
  }

  deleteSelected(): void {
    if (!this.shelf || !this.selected.size) return;
    const requests = Array.from(this.selected).map(id =>
      this.shelfService.removeBookFromShelf(this.shelf!.id, id)
    );
    forkJoin(requests).subscribe({
      next: () => {
        if (this.shelf) {
          this.shelf.books = this.shelf.books.filter(b => !this.selected.has(b.id));
        }
        this.toggleSelectMode();
      },
      error: err => console.error('Failed to delete books', err)
    });
  }
}
