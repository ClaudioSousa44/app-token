import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginPayload, RegisterPayload, User } from './auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private accessToken: string | null = null;
  private readonly userSubject = new BehaviorSubject<User | null>(null);
  private refreshRequest$?: Observable<boolean>;

  readonly user$ = this.userSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  getAccessToken(): string | null {
    return this.accessToken;
  }

  login(payload: LoginPayload): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, payload, { withCredentials: true }).pipe(
      tap((response) => this.storeSession(response)),
      map((response) => response.user)
    );
  }

  register(payload: RegisterPayload): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, payload, { withCredentials: true }).pipe(
      tap((response) => this.storeSession(response)),
      map((response) => response.user)
    );
  }

  ensureSession(): Observable<boolean> {
    if (this.accessToken && this.userSubject.value) {
      return of(true);
    }

    return this.refreshAccessToken();
  }

  refreshAccessToken(): Observable<boolean> {
    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    this.refreshRequest$ = this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh`, {}, { withCredentials: true }).pipe(
      tap((response) => this.storeSession(response)),
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      }),
      finalize(() => {
        this.refreshRequest$ = undefined;
      }),
      shareReplay(1)
    );

    return this.refreshRequest$;
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true }).pipe(
      finalize(() => this.clearSession())
    );
  }

  clearSession(): void {
    this.accessToken = null;
    this.userSubject.next(null);
  }

  private storeSession(response: AuthResponse): void {
    this.accessToken = response.accessToken;
    this.userSubject.next(response.user);
  }
}

