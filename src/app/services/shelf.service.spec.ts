import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ShelfService } from './shelf.service';

describe('ShelfService', () => {
  let service: ShelfService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ShelfService]
    });
    service = TestBed.inject(ShelfService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should create a shelf', () => {
    service.createShelf('New Shelf').subscribe((res: any) => {
      expect(res).toEqual({ id: 1, name: 'New Shelf', books: [] });
    });
    const req = http.expectOne('http://localhost:3000/api/user/shelves');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 1, name: 'New Shelf', books: [] });
  });

  it('should delete a shelf', () => {
    service.deleteShelf(1).subscribe(res => {
      expect(res).toEqual({ success: true });
    });
    const req = http.expectOne('http://localhost:3000/api/user/shelves/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });
});
