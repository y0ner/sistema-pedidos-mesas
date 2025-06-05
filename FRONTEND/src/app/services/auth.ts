import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

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

  // BehaviorSubject para mantener el estado de autenticación en toda la app
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Realiza el login del usuario.
   * @param credentials Objeto con username y password.
   * @returns Observable con la respuesta de los tokens.
   */
  login(credentials: LoginCredentials): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(this.apiTokenUrl, credentials).pipe(
      tap(response => {
        // Al recibir la respuesta, la procesamos
        this.handleAuthentication(response);
      })
    );
  }

  /**
   * Cierra la sesión del usuario.
   */
  logout(): void {
    console.log('Cerrando sesión...');
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.isAuthenticatedSubject.next(false);
    // Redirigir a la página de login (que crearemos)
    this.router.navigate(['/login']);
  }


  /**
   * Verifica de forma síncrona si el usuario está autenticado.
   * Útil para los guardias de ruta.
   * @returns `true` si el BehaviorSubject de autenticación es true.
   */
  isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.getValue();
  }

  /**
   * Procesa la respuesta de autenticación, guarda tokens y actualiza el estado.
   * @param response La respuesta del endpoint /api/token/
   */
  private handleAuthentication(response: TokenResponse): void {
    if (response.access && response.refresh) {
      localStorage.setItem(ACCESS_TOKEN_KEY, response.access);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh);
      this.isAuthenticatedSubject.next(true);
      console.log('Tokens guardados y estado de autenticación actualizado a true.');
    } else {
        console.error('La respuesta de autenticación no contenía los tokens esperados.');
    }
  }

  /**
   * Verifica si existe un token de acceso en localStorage.
   * @returns `true` si existe, `false` si no.
   */
  private hasToken(): boolean {
    const token = this.getAccessToken();
    // Podríamos añadir una validación de expiración del token aquí en el futuro
    return !!token;
  }

  /**
   * Obtiene el token de acceso desde localStorage.
   * @returns El token de acceso o `null` si no existe.
   */
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  /**
   * Obtiene el token de refresco desde localStorage.
   * @returns El token de refresco o `null` si no existe.
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  // Futura implementación para refrescar el token
  // refreshToken(): Observable<any> {
  //   const refreshToken = this.getRefreshToken();
  //   if (!refreshToken) {
  //     // Manejar el caso donde no hay refresh token para renovar la sesión
  //     this.logout();
  //     return throwError(() => new Error('No refresh token available'));
  //   }
  //   return this.http.post<any>(this.apiTokenRefreshUrl, { refresh: refreshToken }).pipe(
  //     tap(response => {
  //       localStorage.setItem(ACCESS_TOKEN_KEY, response.access);
  //       console.log('Token de acceso refrescado.');
  //     })
  //   );
  // }
}