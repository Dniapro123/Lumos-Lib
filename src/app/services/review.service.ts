import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private api = 'http://localhost:3000/api/books';
  constructor(private http: HttpClient) {}

  getReviews(googleId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/${googleId}/reviews`);
  }

  addReview(googleId: string, rating: number, content: string, bookData?: any): Observable<any> {
    return this.http.post(`${this.api}/${googleId}/reviews`, { rating, content, bookData });
  }
}
