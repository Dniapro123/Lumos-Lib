import { Component }          from '@angular/core';
import { CommonModule }       from '@angular/common';
import { RouterModule }       from '@angular/router';
import { FormsModule }        from '@angular/forms';   // dla FAQ open/close (niekonieczne, ale bywa przydatne)

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [CommonModule, RouterModule, FormsModule],
})
export class HomeComponent {
  /* kategorie */
  categories = [
    { name: 'Literatura',  icon: '🌍' },
    { name: 'Nauka',       icon: '🔬' },
    { name: 'Fantastyka',  icon: '🚀' },
    { name: 'Psychologia', icon: '🧠' },
  ];

  /* popularne książki (demo) */
  books = [
    { title: 'SICP',                author: 'Abelson & Sussman',  cover: 'https://covers.openlibrary.org/b/isbn/9780262510875-L.jpg' },
    { title: 'FP in Scala',         author: 'Chiusano & Bjarnason', cover: 'https://covers.openlibrary.org/b/isbn/9781617290657-L.jpg' },
    { title: 'Learn You a Haskell', author: 'Miran Lipovača',       cover: 'https://covers.openlibrary.org/b/isbn/9781593272838-L.jpg' },
    { title: 'Programming Elixir',  author: 'Dave Thomas',          cover: 'https://covers.openlibrary.org/b/isbn/9781680502992-L.jpg' },
  ];

  /* FAQ z polem open */
  faq = [
    { q: 'Czy korzystanie z serwisu jest płatne?', a: 'Podstawowe funkcje są darmowe, opcja premium rozszerza bibliotekę.', open: false },
    { q: 'Jak dodać książkę do półki?',            a: 'Kliknij „Dodaj” przy wybranej książce w katalogu.',                 open: false },
    { q: 'Czy mogę udostępniać recenzje?',         a: 'Tak, zachęcamy do dzielenia się opiniami z innymi czytelnikami.',    open: false },
  ];
}
