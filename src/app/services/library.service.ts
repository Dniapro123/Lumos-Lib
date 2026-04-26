import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Book } from '../shared/components/book';

@Injectable({ providedIn: 'root' })
export class LibraryService {
  private api = 'http://localhost:3000/api/user/books';

  constructor(private http: HttpClient) {}

  getMyBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(this.api);
  }

  addBook(payload: any): Observable<any> {
    return this.http.post(this.api, payload);
  }
}
