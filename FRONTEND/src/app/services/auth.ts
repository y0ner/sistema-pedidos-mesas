import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError, filter, take, switchMap } from 'rxjs'; // Añade filter, take
// --- INTERFACES ---
export interface LoginCredentials {
  username?: string;
  password?: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

// --- CLAVES PARA LOCALSTORAGE ---
const ACCESS_TOKEN_KEY = 'mesaFacilAccessToken';
const REFRESH_TOKEN_KEY = 'mesaFacilRefreshToken';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiTokenUrl = 'http://127.0.0.1:8000/api/token/';
  private apiTokenRefreshUrl = 'http://127.0.0.1:8000/api/token/refresh/';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();
  
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // ... (método login() sin cambios)
  login(credentials: LoginCredentials): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(this.apiTokenUrl, credentials).pipe(
      tap(response => {
        this.handleAuthentication(response);
      })
    );
  }

  // --- El método handleAuthentication se mantiene para el login ---
  private handleAuthentication(response: TokenResponse): void {
    if (response.access && response.refresh) {
      localStorage.setItem(ACCESS_TOKEN_KEY, response.access);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh);
      this.isAuthenticatedSubject.next(true);
      console.log('Tokens guardados (login) y estado de autenticación actualizado a true.');
    } else {
        console.error('La respuesta de login no contenía los tokens esperados.');
    }
  }

  // --- NUEVO MÉTODO para manejar solo la respuesta del refresh ---
  private handleRefresh(response: { access: string }): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, response.access);
    console.log('Nuevo token de acceso guardado correctamente después del refresh.');
    // No es necesario actualizar el refresh token, ya que no viene en la respuesta.
    // No es necesario actualizar isAuthenticatedSubject, ya que debería ser true.
  }

  // --- MÉTODO REFRESH TOKEN MODIFICADO ---
  refreshToken(): Observable<any> {
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter(result => result !== null),
        take(1)
      );
    }

    this.isRefreshing = true;
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.isRefreshing = false;
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    // El tipo de respuesta esperado aquí es solo { access: string }
    return this.http.post<{ access: string }>(this.apiTokenRefreshUrl, { refresh: refreshToken }).pipe(
      tap((tokens) => {
        this.isRefreshing = false;
        this.handleRefresh(tokens); // <-- USAR EL NUEVO MÉTODO
        this.refreshTokenSubject.next(tokens);
      }),
      catchError((error) => {
        this.isRefreshing = false;
        console.error('Falló el refresco del token, cerrando sesión.');
        this.logout();
        return throwError(() => error);
      })
    );
  }

  // ... (resto de los métodos: logout, hasToken, getAccessToken, etc., sin cambios)
  logout(): void {
    console.log('Cerrando sesión...');
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }
  private hasToken(): boolean {
    const token = this.getAccessToken();
    return !!token;
  }
  isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.getValue();
  }
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
}