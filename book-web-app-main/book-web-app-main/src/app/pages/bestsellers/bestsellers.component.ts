import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { Book } from '../../shared/components/book';
import { BookCardComponent } from '../../shared/components/book-card/book-card.component';

@Component({
  standalone: true,
  selector: 'app-bestsellers',
  imports: [CommonModule, HttpClientModule, BookCardComponent],
  templateUrl: './bestsellers.component.html',
  styleUrls: ['./bestsellers.component.css']
})
export class BestsellersComponent implements OnInit {
  books: Book[] = [];
  recommendations: Book[] = [];
  loading = false;
  startIndex = 0;
  maxResults = 20;
  apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit() {
    this.searchBooks();
    if (this.auth.isLoggedIn()) {
      this.loadRecommendations();
    }
  }

  // fetchBestsellers(): void {
  //   this.loading = true;
  //   this.http.get<any>(`${this.apiUrl}/api/books/featured`).subscribe(
  //     response => {
  //       this.books = (response || []).map((b: any): Book => ({
  //         id: b.id,
  //         title: b.volumeInfo.title,
  //         author: b.volumeInfo.authors?.[0] || 'Unknown Author',
  //         cover: b.volumeInfo.imageLinks?.thumbnail,
  //         link: b.volumeInfo.infoLink || '#'
  //       }));
  //       this.loading = false;
  //     },
  //     err => {
  //       console.error('Failed to load bestsellers:', err);
  //       this.loading = false;
  //     }
  //   );
  // }
searchBooks(): void {
    this.loading = true;
    this.http.get<any>(`${this.apiUrl}/api/books/featured?startIndex=${this.startIndex}&maxResults=${this.maxResults}`)
      .subscribe(response => {
        const rawItems = Array.isArray(response) ? response : response.items || [];
        const newBooks = this.mapToBooks(rawItems);
        if (this.startIndex === 0) {
          this.books = newBooks;
        } else {
          this.books = [...this.books, ...newBooks];
        }
        this.startIndex += this.maxResults;
        this.loading = false;
      });
  }

loadMore(): void {
    this.searchBooks();
}

loadRecommendations(): void {
    this.http.get<any>(`${this.apiUrl}/api/books/recommendations/personal`)
      .subscribe(res => {
        const raw = Array.isArray(res) ? res : res.items || [];
        this.recommendations = this.mapToBooks(raw);
      });
}
  
    mapToBooks(raw: any[]): Book[] {
      return raw
        .filter(item => item.volumeInfo?.title && item.volumeInfo?.imageLinks?.thumbnail)
        .map(item => ({
          id: item.id,
          volumeInfo: {
            title: item.volumeInfo.title,
            subtitle: item.volumeInfo.subtitle,
            description: item.volumeInfo.description,
            publishedDate: item.volumeInfo.publishedDate,
            pageCount: item.volumeInfo.pageCount,
            language: item.volumeInfo.language,
            averageRating: item.volumeInfo.averageRating,
            ratingsCount: item.volumeInfo.ratingsCount,
            authors: item.volumeInfo.authors,
            categories: item.volumeInfo.categories,
            imageLinks: {
              thumbnail: item.volumeInfo.imageLinks?.thumbnail
            },
            infoLink: item.volumeInfo.infoLink
          }
        }));
    }
  
  }

