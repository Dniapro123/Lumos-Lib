import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-password-reset',
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.css']
})
export class PasswordResetComponent {
  email = '';
  token = '';
  newPassword = '';
  stage: 'request' | 'reset' = 'request';
  message = '';

  constructor(private http: HttpClient, private auth: AuthService) {}

  request() {
    this.http.post<any>('http://localhost:3000/api/auth/request-reset', { email: this.email }).subscribe({
      next: res => { this.stage = 'reset'; this.token = res.token; this.message = 'Check your email for token'; },
      error: () => this.message = 'Failed to request reset'
    });
  }

  reset() {
    this.http.post<any>('http://localhost:3000/api/auth/reset', { token: this.token, password: this.newPassword }).subscribe({
      next: () => { this.message = 'Password updated'; this.stage = 'request'; },
      error: () => this.message = 'Failed to reset'
    });
  }
}
