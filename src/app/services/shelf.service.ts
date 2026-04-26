import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Shelf } from '../shared/components/shelf';

@Injectable({ providedIn: 'root' })
export class ShelfService {
  private api = 'http://localhost:3000/api/user/shelves';

  constructor(private http: HttpClient) {}

  getShelves(): Observable<Shelf[]> {
    return this.http.get<Shelf[]>(this.api);
  }

  createShelf(name: string): Observable<Shelf> {
    return this.http.post<Shelf>(this.api, { name });
  }

  addBookToShelf(shelfId: number, payload: any): Observable<any> {
    return this.http.post(`${this.api}/${shelfId}/books`, payload);
  }

  generateShareToken(shelfId: number): Observable<{ shareToken: string }> {
    return this.http.post<{ shareToken: string }>(`${this.api}/${shelfId}/share`, {});
  }

  updateShelf(id: number, data: { name?: string; isPublic?: boolean }): Observable<Shelf> {
    return this.http.put<Shelf>(`${this.api}/${id}`, data);
  }

  deleteShelf(id: number): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }

  removeBookFromShelf(shelfId: number, bookId: string): Observable<any> {
    return this.http.delete(`${this.api}/${shelfId}/books/${bookId}`);
  }

  removeBookFromAllShelves(bookId: string): Observable<any> {
    return this.http.delete(`${this.api}/books/${bookId}`);
  }

  getSharedShelf(token: string): Observable<Shelf> {
    return this.http.get<Shelf>(`http://localhost:3000/api/shared/${token}`);
  }

  getShelf(id: number): Observable<Shelf | null> {
    return this.getShelves().pipe(map(arr => arr.find(s => s.id === id) || null));
  }
}
