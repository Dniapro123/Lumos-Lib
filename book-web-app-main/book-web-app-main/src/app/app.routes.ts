import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CatalogComponent } from './pages/catalog/catalog.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { LibraryComponent } from './pages/library/library.component';
import { AuthGuard } from './services/auth.guard';
import { AboutUsComponent } from './pages/about-us/about-us.component';
import { BestsellersComponent } from './pages/bestsellers/bestsellers.component';
import { ContactComponent } from './pages/contact/contact.component';
import { BookDetailComponent } from './pages/book-detail/book-detail.component';
import { PasswordResetComponent } from './pages/password-reset/password-reset.component';
import { ShelfComponent } from './pages/shelf/shelf.component';
import { PublicProfileComponent } from './pages/public-profile/public-profile.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'book/:id', component: BookDetailComponent },
  { path: 'catalogue', component: CatalogComponent },
  { path: 'catalogue/:category', component: CatalogComponent }, 
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'library', component: LibraryComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'bestsellers', component: BestsellersComponent },
  { path: 'about-us', component: AboutUsComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'password-reset', component: PasswordResetComponent },
  { path: 'shelf/:id', component: ShelfComponent, canActivate: [AuthGuard] },
  { path: 'public-profile/:id', component: PublicProfileComponent },
];
