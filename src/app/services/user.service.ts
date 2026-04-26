import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  private api = 'http://localhost:3000/api';
  constructor(private http: HttpClient) {}

  getPublicProfile(id: number): Observable<any> {
    return this.http.get<any>(`${this.api}/${id}/public`);
  }
}
