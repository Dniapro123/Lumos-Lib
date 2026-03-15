import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';


@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [CommonModule, RouterModule, HttpClientModule,FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  username: string | null = null;
  newUsername = '';
  categories = '';
  favouriteBook = '';
  addedPreferences: {categories: string[]; favouriteBook: string}[] = [];

  constructor(private auth: AuthService, private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.username = this.auth.getUsername();
    this.http.get<any>('http://localhost:3000/api/me').subscribe(user => {
      this.categories = (user.preferences?.categories || []).join(', ');
      this.favouriteBook = user.preferences?.favouriteBook || '';
    });
  }

  addPreferences(): void {
    const cats = this.categories
      .split(',')
      .map(c => c.trim())
      .filter(c => c);
    this.addedPreferences.push({
      categories: cats,
      favouriteBook: this.favouriteBook
    });
    this.categories = '';
    this.favouriteBook = '';
  }

  save(): void {
    const payload: any = {};
    if (this.newUsername) payload.username = this.newUsername;
    payload.preferences = {
      categories: this.categories.split(',').map((c: string) => c.trim()).filter((c: string) => c),
      favouriteBook: this.favouriteBook
    };
    this.http.put<any>('http://localhost:3000/api/me', payload).subscribe({
      next: user => {
        this.username = user.username;
        localStorage.setItem('username', user.username);
        this.newUsername = '';
        alert('Profile updated');
      },
      error: err => alert('Failed to update profile')
    });
  }

  deleteAccount(): void {
    if (!confirm('Are you sure you want to delete your account?')) return;
    this.auth.deleteAccount().subscribe({
      next: () => {
        this.auth.logout();
        this.router.navigate(['/']);
      },
      error: () => alert('Failed to delete account')
    });
  }

}
