import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  fullName: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  onRegister(): void {
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Hasła nie są takie same.';
      return;
    }

    const registrationData = {
      username: this.fullName,
      email: this.email,
      password: this.password
    };

    this.http.post<any>('http://localhost:3000/api/auth/register', registrationData).subscribe({
      next: () => {
        this.successMessage = 'Rejestracja zakończona sukcesem!';
        this.errorMessage = '';
        setTimeout(() => this.router.navigate(['/login']), 1000); // Redirect after 1s
      },
      error: (err) => {
        this.successMessage = '';
        this.errorMessage = err.error?.error || 'Wystąpił błąd przy rejestracji.';
        console.error(err);
      }
    });
  }
}
