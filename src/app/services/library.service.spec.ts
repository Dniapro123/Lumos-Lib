import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LibraryService } from './library.service';

describe('LibraryService', () => {
  let service: LibraryService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LibraryService]
    });
    service = TestBed.inject(LibraryService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should fetch user books', () => {
    const mock = [{ id: '1', volumeInfo: { title: 'Test' } }];
    service.getMyBooks().subscribe(data => {
      expect(data).toEqual(mock);
    });
    const req = http.expectOne('http://localhost:3000/api/user/books');
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('should add a book', () => {
    const payload = { id: '1' };
    service.addBook(payload).subscribe(res => {
      expect(res).toEqual({ success: true });
    });
    const req = http.expectOne('http://localhost:3000/api/user/books');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ success: true });
  });
});
