// contact.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {
  name: string = '';
  email: string = '';
  message: string = '';

  onSubmit(): void {
    console.log('Contact form submitted:', {
      name: this.name,
      email: this.email,
      message: this.message
    });
    alert('Thank you for your message!');
    this.name = '';
    this.email = '';
    this.message = '';
  }
}
