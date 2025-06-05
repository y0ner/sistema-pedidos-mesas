import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http'; // Importar HttpParams
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Product } from './product';

// --- INTERFACES PARA LA CREACIÓN DEL PEDIDO ---
export interface OrderDetailWritePayload {
  product_id: number;
  quantity: number;
}
export interface CreateOrderPayload {
  table: number;
  customer_name?: string | null;
  details_write: OrderDetailWritePayload[];
}

// --- INTERFACES PARA LA RESPUESTA DEL PEDIDO ---
export interface OrderDetailResponse {
  id: number;
  product: Product;
  quantity: number;
  subtotal: string;
}
export interface OrderResponse {
  id: number;
  table: number; // ID de la mesa
  table_number: number; // Número de la mesa
  status: string;
  total: string;
  created_at: string;
  updated_at: string;
  customer_name: string | null;
  details: OrderDetailResponse[];
  view_token: string; // <-- ¡NUEVO CAMPO IMPORTANTE!
}
export interface ApiError {
  error?: string;
  detail?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private baseApiUrl = 'http://127.0.0.1:8000/api/v1/orders/';

  constructor(private http: HttpClient) { }

  /**
   * Crea un nuevo pedido en el backend.
   * @param orderPayload El objeto con los datos del pedido.
   * @returns Un Observable con los datos del pedido creado, incluyendo el view_token.
   */
  createOrder(orderPayload: CreateOrderPayload): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.baseApiUrl, orderPayload).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene los detalles de un pedido específico usando su view_token.
   * @param token El view_token del pedido.
   * @returns Un Observable con los datos del pedido.
   */
  getOrderByToken(token: string): Observable<OrderResponse> {
    const url = `${this.baseApiUrl}by-token/`;
    const params = new HttpParams().set('token', token);
    return this.http.get<OrderResponse>(url, { params }).pipe(
      catchError(this.handleError)
    );
  }

  // El método getOrderById(orderId: number) ya no es necesario para el flujo del cliente anónimo
  // Podríamos comentarlo o eliminarlo si no se prevé su uso por parte del personal en el frontend.
  /*
  getOrderById(orderId: number): Observable<OrderResponse> {
    const url = `${this.baseApiUrl}${orderId}/`;
    return this.http.get<OrderResponse>(url).pipe(
      catchError(this.handleError)
    );
  }
  */

  private handleError(error: HttpErrorResponse) {
    let errorMessage: string;
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      console.error(
        `Backend devolvió el código ${error.status}, ` +
        `cuerpo del error: ${JSON.stringify(error.error)}`);
      const apiError = error.error as ApiError;
      if (apiError && typeof apiError === 'object') {
        if (apiError.detail) {
          errorMessage = apiError.detail;
        } else if (apiError.error) {
          errorMessage = apiError.error;
        } else {
          errorMessage = Object.values(apiError).flat().join(' ');
          if (!errorMessage) {
            errorMessage = `Error ${error.status}: Ocurrió un problema al procesar la solicitud.`;
          }
        }
      } else if (typeof error.error === 'string') {
         errorMessage = error.error;
      }
      else {
        errorMessage = `Error ${error.status}: Ocurrió un problema al procesar la solicitud. Por favor, intenta de nuevo.`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}