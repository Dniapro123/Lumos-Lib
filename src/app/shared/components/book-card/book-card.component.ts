import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Book } from '../book';

@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './book-card.component.html',
  styleUrls: ['./book-card.component.css']
})
export class BookCardComponent {
  @Input() book!: Book;

  get title(): string {
    return this.book.volumeInfo.title;
  }
  get author(): string {
    return this.book.volumeInfo.authors?.[0] || 'Unknown';
  }
  get cover(): string {
    return this.book.volumeInfo.imageLinks?.thumbnail || '';
  }
  get link(): string {
    return `/books/${this.book.id}`;
  }
  
}
