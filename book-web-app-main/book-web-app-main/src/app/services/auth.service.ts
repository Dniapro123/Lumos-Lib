import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<string | null>(null);
  user$ = this.userSubject.asObservable();
  private readonly API = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) {
    const token = this.getToken();
    const storedUser = localStorage.getItem('username');
    if (token) {
      if (storedUser) {
        this.userSubject.next(storedUser);
      }
      this.verifySession();
    }
  }

  login(email: string, password: string) {
  return this.http.post<{ token: string; user: { username: string; email: string; id: number } }>(
    `${this.API}/login`,
    { email, password }
  ).pipe(
    tap(res => {
      localStorage.setItem('token', res.token);
      localStorage.setItem('username', res.user.username);  // ✅ FIXED
      localStorage.setItem('user', JSON.stringify(res.user)); // optional: store whole user
      this.userSubject.next(res.user.username);
    })
  );
}
  register(username: string, email: string, password: string) {
    return this.http.post(`${this.API}/register`, { username, email, password });
  }

  requestPasswordReset(email: string) {
    return this.http.post<{ token: string }>(`${this.API}/request-reset`, { email });
  }

  resetPassword(token: string, password: string) {
    return this.http.post(`${this.API}/reset`, { token, password });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    this.userSubject.next(null);
  }

  verifySession(): void {
    const token = this.getToken();
    if (!token) return;
    this.http.get<{ username: string }>('http://localhost:3000/api/me').subscribe({
      next: user => {
        localStorage.setItem('username', user.username);
        this.userSubject.next(user.username);
      },
      error: () => this.logout()
    });
  }

  deleteAccount() {
    return this.http.delete('http://localhost:3000/api/me');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
