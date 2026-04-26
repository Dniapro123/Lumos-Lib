import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin, of, Observable } from 'rxjs';
import { UserService } from '../../services/user.service';
import { ShelfService } from '../../services/shelf.service';
import { BookCardComponent } from '../../shared/components/book-card/book-card.component';
import { Shelf } from '../../shared/components/shelf';

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, BookCardComponent],
  templateUrl: './public-profile.component.html',
  styleUrls: ['./public-profile.component.css']
})
export class PublicProfileComponent implements OnInit {
  profile: { username: string; shelves: Shelf[] } | null = null;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private shelfService: ShelfService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.userService.getPublicProfile(id).subscribe(p => {
      // Initialize profile with empty books arrays
      this.profile = {
        username: p.username,
        shelves: p.shelves.map((s: Shelf) => ({ ...s, books: [] }))
      };

      // Create requests to fetch shared shelf data
      const requests: Observable<Shelf>[] = p.shelves.map((s: Shelf) =>
        s.shareToken
          ? this.shelfService.getSharedShelf(s.shareToken)
          : of({ ...s, books: [] } as Shelf)
      );

      // Execute all requests and update the books
      forkJoin(requests).subscribe((res: Shelf[]) => {
        res.forEach((shelfData: Shelf, idx: number) => {
          this.profile!.shelves[idx].books = shelfData.books;
        });
      });
    });
  }
}
