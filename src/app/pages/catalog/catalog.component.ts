import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { BookCardComponent } from '../../shared/components/book-card/book-card.component';
import { Book } from '../../shared/components/book';

@Component({
  standalone: true,
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.css'],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    RouterModule,
    BookCardComponent,
  ],
})
export class CatalogComponent implements OnInit {
  books: Book[] = [];

  searchTitle = '';
  searchAuthor = '';
  selectedCategory = '';

  sortOption = 'titleAsc';
  startIndex = 0;
  maxResults = 20;
  loading = false;
  errorMessage = '';
  lastQuery = '';

  apiUrl = 'http://localhost:3000';

  readonly categories = [
    'Literatura',
    'Nauka',
    'Fantastyka',
    'Psychologia',
    'Historia',
    'Biznes',
    'Informatyka',
    'Biografia',
  ];

  private readonly categoryApiMap: Record<string, string> = {
    Literatura: 'fiction',
    Nauka: 'science',
    Fantastyka: 'fantasy',
    Psychologia: 'psychology',
    Historia: 'history',
    Biznes: 'business',
    Informatyka: 'computers',
    Biografia: 'biography',
  };

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const category = params.get('category') || '';

      this.selectedCategory = category;
      this.searchTitle = '';
      this.searchAuthor = '';

      if (category) {
        this.searchBooks();
      } else {
        this.loadFeatured();
      }
    });
  }

  searchBooks(): void {
    if (this.loading) return;

    const qParts: string[] = [];

    if (this.searchTitle.trim()) {
      qParts.push(`intitle:${this.searchTitle.trim()}`);
    }

    if (this.searchAuthor.trim()) {
      qParts.push(`inauthor:${this.searchAuthor.trim()}`);
    }

    if (this.selectedCategory) {
      const apiCategory =
        this.categoryApiMap[this.selectedCategory] || this.selectedCategory;

      qParts.push(`subject:${apiCategory}`);
    }

    const q = qParts.join('+');

    if (!q) {
      this.loadFeatured();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.startIndex = 0;
    this.lastQuery = q;

    const params = new HttpParams()
      .set('q', q)
      .set('startIndex', '0')
      .set('maxResults', String(this.maxResults));

    this.http.get<any>(`${this.apiUrl}/api/books/search`, { params }).subscribe({
      next: (res) => {
        const raw = Array.isArray(res) ? res : res.items || [];

        this.books = this.mapToBooks(raw);
        this.startIndex = this.maxResults;
        this.loading = false;
      },
      error: (error) => {
        console.error('Błąd podczas wyszukiwania książek:', error);

        this.books = [];
        this.errorMessage =
          error.error?.message ||
          'Nie udało się pobrać książek. Spróbuj ponownie za chwilę.';
        this.loading = false;
      },
    });
  }

  loadMore(): void {
    if (this.loading) return;

    this.loading = true;
    this.errorMessage = '';

    const currentStartIndex = this.startIndex;

    const params = new HttpParams()
      .set('startIndex', String(currentStartIndex))
      .set('maxResults', String(this.maxResults));

    const request$ = this.lastQuery
      ? this.http.get<any>(`${this.apiUrl}/api/books/search`, {
          params: params.set('q', this.lastQuery),
        })
      : this.http.get<any>(`${this.apiUrl}/api/books/featured`, { params });

    request$.subscribe({
      next: (res) => {
        const raw = Array.isArray(res) ? res : res.items || [];
        const newBooks = this.mapToBooks(raw);

        this.books = this.mergeUniqueBooks(this.books, newBooks);
        this.startIndex = currentStartIndex + this.maxResults;
        this.loading = false;
      },
      error: (error) => {
        console.error('Błąd podczas pobierania kolejnych książek:', error);

        this.errorMessage =
          error.error?.message ||
          'Nie udało się pobrać kolejnych książek. Spróbuj ponownie za chwilę.';
        this.loading = false;
      },
    });
  }

  loadFeatured(): void {
    if (this.loading) return;

    this.loading = true;
    this.errorMessage = '';
    this.startIndex = 0;
    this.lastQuery = '';

    const params = new HttpParams()
      .set('startIndex', '0')
      .set('maxResults', String(this.maxResults));

    this.http
      .get<any>(`${this.apiUrl}/api/books/featured`, { params })
      .subscribe({
        next: (res) => {
          const raw = Array.isArray(res) ? res : res.items || [];

          this.books = this.mapToBooks(raw);
          this.startIndex = this.maxResults;
          this.loading = false;
        },
        error: (error) => {
          console.error('Błąd podczas pobierania polecanych książek:', error);

          this.books = [];
          this.errorMessage =
            error.error?.message ||
            'Nie udało się pobrać polecanych książek. Spróbuj ponownie za chwilę.';
          this.loading = false;
        },
      });
  }

  sortedBooks(): Book[] {
    return this.books.slice().sort((a, b) => {
      switch (this.sortOption) {
        case 'titleAsc':
          return a.volumeInfo.title.localeCompare(b.volumeInfo.title);

        case 'titleDesc':
          return b.volumeInfo.title.localeCompare(a.volumeInfo.title);

        case 'authorAsc':
          return (a.volumeInfo.authors?.[0] || '').localeCompare(
            b.volumeInfo.authors?.[0] || ''
          );

        case 'authorDesc':
          return (b.volumeInfo.authors?.[0] || '').localeCompare(
            a.volumeInfo.authors?.[0] || ''
          );

        case 'newest':
          return (
            +new Date(b.volumeInfo.publishedDate || '') -
            +new Date(a.volumeInfo.publishedDate || '')
          );

        case 'oldest':
          return (
            +new Date(a.volumeInfo.publishedDate || '') -
            +new Date(b.volumeInfo.publishedDate || '')
          );

        case 'rating':
          return (
            (b.volumeInfo.averageRating ?? 0) -
            (a.volumeInfo.averageRating ?? 0)
          );

        case 'reviews':
          return (
            (b.volumeInfo.ratingsCount ?? 0) -
            (a.volumeInfo.ratingsCount ?? 0)
          );

        default:
          return 0;
      }
    });
  }

  setCategory(category: string): void {
    this.selectedCategory = category;
    this.searchBooks();
  }

  private mapToBooks(raw: any[]): Book[] {
    return raw
      .filter((item) => item.volumeInfo?.title)
      .map((item) => ({
        id: item.id,
        volumeInfo: {
          title: item.volumeInfo.title,
          subtitle: item.volumeInfo.subtitle,
          description: item.volumeInfo.description,
          publishedDate: item.volumeInfo.publishedDate,
          pageCount: item.volumeInfo.pageCount,
          language: item.volumeInfo.language,
          averageRating: item.volumeInfo.averageRating ?? 0,
          ratingsCount: item.volumeInfo.ratingsCount ?? 0,
          authors: item.volumeInfo.authors,
          categories: item.volumeInfo.categories,
          imageLinks: {
            thumbnail:
              item.volumeInfo.imageLinks?.thumbnail ||
              'https://via.placeholder.com/128x190?text=No+Cover',
          },
          infoLink: item.volumeInfo.infoLink,
        },
      }));
  }

  private mergeUniqueBooks(existingBooks: Book[], newBooks: Book[]): Book[] {
    const booksMap = new Map<string, Book>();

    [...existingBooks, ...newBooks].forEach((book) => {
      if (book.id) {
        booksMap.set(book.id, book);
      }
    });

    return Array.from(booksMap.values());
  }
}