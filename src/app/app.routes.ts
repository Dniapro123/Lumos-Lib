import { Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { CatalogComponent } from './pages/catalog/catalog.component';
import { AboutUsComponent } from './pages/about-us/about-us.component';
import { BestsellersComponent } from './pages/bestsellers/bestsellers.component';
import { ContactComponent } from './pages/contact/contact.component';
import { BookDetailComponent } from './pages/book-detail/book-detail.component';
import { PublicProfileComponent } from './pages/public-profile/public-profile.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'book/:id', component: BookDetailComponent },
  { path: 'catalogue', component: CatalogComponent },
  { path: 'catalogue/:category', component: CatalogComponent },
  { path: 'bestsellers', component: BestsellersComponent },
  { path: 'about-us', component: AboutUsComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'public-profile/:id', component: PublicProfileComponent },

  { path: 'login', redirectTo: 'catalogue', pathMatch: 'full' },
  { path: 'register', redirectTo: 'catalogue', pathMatch: 'full' },
  { path: 'password-reset', redirectTo: 'catalogue', pathMatch: 'full' },
  { path: 'library', redirectTo: 'catalogue', pathMatch: 'full' },
  { path: 'profile', redirectTo: 'catalogue', pathMatch: 'full' },
  { path: 'shelf/:id', redirectTo: 'catalogue', pathMatch: 'full' },

  { path: '**', redirectTo: '' },
];