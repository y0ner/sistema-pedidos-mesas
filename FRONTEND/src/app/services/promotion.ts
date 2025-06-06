import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interfaz que representa una Promoción
export interface Promotion {
  id: number;
  title: string;
  description: string;
  start_date: string; // Se manejarán como string en formato ISO
  end_date: string;   // Se manejarán como string en formato ISO
  is_active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PromotionService {

  private apiUrl = 'http://127.0.0.1:8000/api/v1/promotions/';

  constructor(private http: HttpClient) { }

  // Obtener todas las promociones
  getPromotions(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  // Crear una nueva promoción
  createPromotion(promotionData: Omit<Promotion, 'id'>): Observable<Promotion> {
    return this.http.post<Promotion>(this.apiUrl, promotionData).pipe(
      catchError(this.handleError)
    );
  }

  // Actualizar una promoción existente
  updatePromotion(id: number, promotionData: Partial<Promotion>): Observable<Promotion> {
    return this.http.put<Promotion>(`${this.apiUrl}${id}/`, promotionData).pipe(
      catchError(this.handleError)
    );
  }

  // Eliminar una promoción
  deletePromotion(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}${id}/`).pipe(
      catchError(this.handleError)
    );
  }
  
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del lado del cliente: ${error.error.message}`;
    } else {
      errorMessage = `Error del servidor (código ${error.status}): ${error.error.detail || JSON.stringify(error.error)}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}