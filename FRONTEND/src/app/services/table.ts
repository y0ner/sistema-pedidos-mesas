import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interfaz para el payload que enviaremos al backend
export interface ValidateCodePayload {
  code: string;
}

// Interfaz para la respuesta esperada del backend si la validación es exitosa
export interface ValidatedTableResponse {
  id: number;
  number: number;
  status: string;
  current_code: string | null;
  last_code_update: string | null;
}

// --- NUEVO: Interfaz para representar una Mesa (basado en TableSerializer y modelos) ---
export interface Table {
  id: number;
  number: number;
  status: 'available' | 'occupied' | 'reserved' | 'blocked' | string; // Hacemos status más específico si es posible
  current_code?: string | null; // Opcional, ya que puede no estar presente para todas las mesas
  last_code_update?: string | null; // Opcional
}
// --- FIN NUEVO ---


// Interfaz para el error esperado del backend
export interface ApiError {
  error: string;
}

@Injectable({
  providedIn: 'root'
})
export class TableService {

  private apiUrl = 'http://127.0.0.1:8000/api/v1/tables/';

  constructor(private http: HttpClient) { }

  validateTableCode(code: string): Observable<ValidatedTableResponse> {
    const endpoint = `${this.apiUrl}validate-code/`;
    const payload: ValidateCodePayload = { code: code };
    return this.http.post<ValidatedTableResponse>(endpoint, payload).pipe(
      catchError(this.handleError)
    );
  }

  // --- NUEVO MÉTODO ---
  /**
   * Obtiene una lista de todas las mesas y su estado.
   * Asume que el endpoint GET /api/v1/tables/ es público o accesible.
   */
  getAllTables(): Observable<Table[]> {
    // El endpoint es la URL base del servicio (this.apiUrl)
    return this.http.get<Table[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }
  // --- FIN NUEVO MÉTODO ---

  private handleError(error: HttpErrorResponse) {
    let errorMessage: string;
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      console.error(
        `Backend devolvió el código ${error.status}, ` +
        `cuerpo del error: ${JSON.stringify(error.error)}`);
      const apiError = error.error as ApiError;
      if (apiError && apiError.error) {
        errorMessage = apiError.error;
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else {
        errorMessage = `Error ${error.status}: Ocurrió un problema. Por favor, intenta de nuevo.`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}