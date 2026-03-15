import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';


@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule,RouterModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  errorMsg: any;

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {}

  onLogin(): void {
    const loginData = {
      email: this.email,
      password: this.password
    };

    this.authService.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/library']),
      error: (err: { error: { message: any; }; }) => this.errorMsg = err.error.message
    });
    
  }
}
