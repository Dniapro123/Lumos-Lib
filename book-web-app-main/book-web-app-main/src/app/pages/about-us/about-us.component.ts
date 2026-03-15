import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-about-us',
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.css'],
})
export class AboutUsComponent implements AfterViewInit {
  /* -- liczniki; w szablonie muszą być <span #years>0</span> itd. -- */
  @ViewChild('years'  , { static: false }) years!:   ElementRef<HTMLSpanElement>;
  @ViewChild('books'  , { static: false }) books!:   ElementRef<HTMLSpanElement>;
  @ViewChild('readers', { static: false }) readers!: ElementRef<HTMLSpanElement>;

  ngAfterViewInit(): void {
    /* zamień wartości na realne statystyki, jeśli masz */
    this.animate(this.years  ?.nativeElement,   1);   // lata na rynku
    this.animate(this.books  ?.nativeElement, 100);   // liczba książek
    this.animate(this.readers?.nativeElement, 1_000); // liczba czytelników
  }

  /* prosta animacja od 0 → end w ~1 s (60 klatek) */
  private animate(el: HTMLElement | undefined, end: number): void {
    if (!el) return;
    let cur = 0;
    const step = () => {
      cur += Math.ceil(end / 60);
      if (cur > end) cur = end;
      el.textContent = cur.toString();
      if (cur < end) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}
