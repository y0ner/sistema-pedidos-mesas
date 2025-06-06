import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interfaces para el payload y respuestas
export interface ValidateCodePayload {
  code: string;
}

export interface ValidatedTableResponse {
  id: number;
  number: number;
  status: string;
  current_code: string | null;
}

export interface Table {
  id: number;
  number: number;
  status: 'available' | 'occupied' | 'reserved' | 'unavailable' | string;
  current_code?: string | null;
  last_code_update?: string | null;
}

export interface ApiError {
  error: string;
}

@Injectable({
  providedIn: 'root'
})
export class TableService {

  private apiUrl = 'http://darcia2.pythonanywhere.com/api/v1/tables/';

  constructor(private http: HttpClient) { }

  // --- MÉTODOS EXISTENTES ---
  validateTableCode(code: string): Observable<ValidatedTableResponse> {
    const endpoint = `${this.apiUrl}validate-code/`;
    const payload: ValidateCodePayload = { code: code };
    return this.http.post<ValidatedTableResponse>(endpoint, payload).pipe(
      catchError(this.handleError)
    );
  }

  getAllTables(): Observable<Table[]> {
    return this.http.get<Table[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  // --- NUEVOS MÉTODOS CRUD ---
  createTable(tableData: { number: number; status: string }): Observable<Table> {
    return this.http.post<Table>(this.apiUrl, tableData).pipe(
      catchError(this.handleError)
    );
  }

  updateTable(id: number, tableData: { number: number; status: string }): Observable<Table> {
    return this.http.put<Table>(`${this.apiUrl}${id}/`, tableData).pipe(
      catchError(this.handleError)
    );
  }

  deleteTable(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}${id}/`).pipe(
      catchError(this.handleError)
    );
  }

  // --- NUEVO MÉTODO PARA GENERAR CÓDIGO ---
  generateCodeForTable(id: number): Observable<Table> {
    const endpoint = `${this.apiUrl}${id}/generate-code/`;
    return this.http.post<Table>(endpoint, {}).pipe(
      catchError(this.handleError)
    );
  }
  // --- FIN NUEVOS MÉTODOS ---

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