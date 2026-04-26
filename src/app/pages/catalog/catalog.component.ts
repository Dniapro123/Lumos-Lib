import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule }       from '@angular/forms';

import { BookCardComponent } from '../../shared/components/book-card/book-card.component';
import { Book }              from '../../shared/components/book';

@Component({
  standalone: true,
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.css'],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    RouterModule,         // potrzebny do paramMap
    BookCardComponent,
  ],
})
export class CatalogComponent implements OnInit {
  /* dane */
  books: Book[] = [];

  /* pola wyszukiwania */
  searchTitle = '';
  searchAuthor = '';
  selectedCategory = '';

  /* sort / paginacja */
  sortOption = 'titleAsc';
  startIndex = 0;
  maxResults = 20;
  loading = false;
  lastQuery = '';

  /* API */
  apiUrl = 'http://localhost:3000';

  /* stała lista kategorii  (używana również w HomeComponent) */
  readonly categories = ['Literatura', 'Nauka', 'Fantastyka', 'Psychologia'];

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  /* ---------------------- INIT ---------------------- */
  ngOnInit(): void {
    /* reaguj na KAŻDĄ zmianę parametru :category */
    this.route.paramMap.subscribe(params => {
      const cat = params.get('category') || '';
      this.selectedCategory = cat;
      this.searchTitle = this.searchAuthor = '';
      cat ? this.searchBooks() : this.loadFeatured();
    });
  }

  /* ------------------- WYSZUKIWANIE ----------------- */
  searchBooks(): void {
    const qParts = [];
    if (this.searchTitle.trim())  qParts.push(`intitle:${this.searchTitle.trim()}`);
    if (this.searchAuthor.trim()) qParts.push(`inauthor:${this.searchAuthor.trim()}`);
    if (this.selectedCategory)    qParts.push(`subject:${this.selectedCategory}`);
    const q = qParts.join('+');

    if (!q) { this.loadFeatured(); return; }

    this.loading = true;
    this.startIndex = 0;
    this.lastQuery = q;

    this.http.get<any>(`${this.apiUrl}/api/books/search?q=${encodeURIComponent(q)}&startIndex=0&maxResults=${this.maxResults}`)
      .subscribe(res => {
        const raw = Array.isArray(res) ? res : res.items || [];
        this.books = this.mapToBooks(raw);
        this.startIndex = this.books.length;
        this.loading = false;
      });
  }

  /* --------------- POBIERZ KOLEJNE ------------------- */
  loadMore(): void {
    this.loading = true;
    const endpoint = this.lastQuery
      ? `${this.apiUrl}/api/books/search?q=${encodeURIComponent(this.lastQuery)}&startIndex=${this.startIndex}&maxResults=${this.maxResults}`
      : `${this.apiUrl}/api/books/featured?startIndex=${this.startIndex}&maxResults=${this.maxResults}`;

    this.http.get<any>(endpoint).subscribe(res => {
      const raw = Array.isArray(res) ? res : res.items || [];
      this.books = [...this.books, ...this.mapToBooks(raw)];
      this.startIndex += this.maxResults;
      this.loading = false;
    });
  }

  /* --------------- FEATURED ------------------------- */
  loadFeatured(): void {
    this.loading = true;
    this.startIndex = 0;
    this.http.get<any>(`${this.apiUrl}/api/books/featured?startIndex=0&maxResults=${this.maxResults}`)
      .subscribe(res => {
        const raw = Array.isArray(res) ? res : res.items || [];
        this.books = this.mapToBooks(raw);
        this.lastQuery = '';
        this.startIndex = this.books.length;
        this.loading = false;
      });
  }

  /* --------------- SORT ----------------------------- */
  sortedBooks(): Book[] {
    return this.books.slice().sort((a, b) => {
      switch (this.sortOption) {
        case 'titleAsc':   return a.volumeInfo.title.localeCompare(b.volumeInfo.title);
        case 'titleDesc':  return b.volumeInfo.title.localeCompare(a.volumeInfo.title);
        case 'authorAsc':  return (a.volumeInfo.authors?.[0] || '').localeCompare(b.volumeInfo.authors?.[0] || '');
        case 'authorDesc': return (b.volumeInfo.authors?.[0] || '').localeCompare(a.volumeInfo.authors?.[0] || '');
        case 'newest':     return +new Date(b.volumeInfo.publishedDate || '') - +new Date(a.volumeInfo.publishedDate || '');
        case 'oldest':     return +new Date(a.volumeInfo.publishedDate || '') - +new Date(b.volumeInfo.publishedDate || '');
        case 'rating':     return (b.volumeInfo.averageRating ?? 0) - (a.volumeInfo.averageRating ?? 0);
        case 'reviews':    return (b.volumeInfo.ratingsCount ?? 0)  - (a.volumeInfo.ratingsCount ?? 0);
        default: return 0;
      }
    });
  }

  /* --------------- POMOCNICZA MAPA ------------------- */
  private mapToBooks(raw: any[]): Book[] {
    return raw
      .filter(i => i.volumeInfo?.title && i.volumeInfo?.imageLinks?.thumbnail)
      .map(i => ({
        id: i.id,
        volumeInfo: {
          title: i.volumeInfo.title,
          subtitle: i.volumeInfo.subtitle,
          description: i.volumeInfo.description,
          publishedDate: i.volumeInfo.publishedDate,
          pageCount: i.volumeInfo.pageCount,
          language: i.volumeInfo.language,
          averageRating: i.volumeInfo.averageRating ?? 0,
          ratingsCount:  i.volumeInfo.ratingsCount ?? 0,
          authors:       i.volumeInfo.authors,
          categories:    i.volumeInfo.categories,
          imageLinks:    { thumbnail: i.volumeInfo.imageLinks?.thumbnail },
          infoLink:      i.volumeInfo.infoLink,
        },
      }));
  }

  /* --------------- UI: klik w filtr kategorii -------- */
  setCategory(cat: string): void {
    this.selectedCategory = cat;
    this.searchBooks();
  }
}
