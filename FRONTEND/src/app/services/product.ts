import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interfaz actualizada para manejar la imagen como archivo al crear/editar
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  image?: string | File; // Puede ser una URL (string) o un Archivo para la subida
  availability: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private apiUrl = 'http://localhost:8000/api/v1/products/';

  constructor(private http: HttpClient) { }

  // --- OBTENER PRODUCTOS (SIN CAMBIOS) ---
  getProducts(
    searchTerm?: string,
    availability?: boolean | null,
    minPrice?: number | null,
    maxPrice?: number | null
  ): Observable<Product[]> {
    let params = new HttpParams();
    if (searchTerm) params = params.set('search', searchTerm);
    if (availability === true) params = params.set('availability', 'true');
    else if (availability === false) params = params.set('availability', 'false');
    if (minPrice != null) params = params.set('price__gte', minPrice.toString());
    if (maxPrice != null) params = params.set('price__lte', maxPrice.toString());

    return this.http.get<Product[]>(this.apiUrl, { params }).pipe(catchError(this.handleError));
  }
  
  // --- OBTENER UN SOLO PRODUCTO (NUEVO Y ÚTIL) ---
  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}${id}/`).pipe(catchError(this.handleError));
  }

  // --- CREAR UN NUEVO PRODUCTO (NUEVO) ---
  createProduct(productData: FormData): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, productData).pipe(catchError(this.handleError));
  }

  // --- ACTUALIZAR UN PRODUCTO (NUEVO) ---
  updateProduct(id: number, productData: FormData): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}${id}/`, productData).pipe(catchError(this.handleError));
  }

  // --- ELIMINAR UN PRODUCTO (NUEVO) ---
  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}${id}/`).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del lado del cliente: ${error.error.message}`;
    } else {
      // El backend devolvió un código de error.
      // Podemos intentar extraer un mensaje de error más específico si el backend lo envía.
      errorMessage = `Error del servidor (código ${error.status}): ${error.error.detail || error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}