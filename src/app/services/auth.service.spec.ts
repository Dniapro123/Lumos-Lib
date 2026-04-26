import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('should login and store token and username', () => {
    service.login('a@b.com', 'pass').subscribe();
    const req = http.expectOne('http://localhost:3000/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ token: 'tok', user: { username: 'John', email: 'a@b.com', id: 1 } });

    expect(localStorage.getItem('token')).toBe('tok');
    expect(localStorage.getItem('username')).toBe('John');
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('should logout and clear storage', () => {
    localStorage.setItem('token', 'abc');
    localStorage.setItem('username', 'John');
    service.logout();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('username')).toBeNull();
    service.user$.subscribe(value => expect(value).toBeNull());
  });

  it('should verify session and update username', () => {
    localStorage.setItem('token', 'tok');
    service.verifySession();
    const req = http.expectOne('http://localhost:3000/api/me');
    expect(req.request.method).toBe('GET');
    req.flush({ username: 'Jane' });
    expect(localStorage.getItem('username')).toBe('Jane');
  });
});
