import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Product } from './product';

// --- INTERFACES PARA EL HISTORIAL DE VENTAS ---

export interface SaleDetailItem {
  product_name: string;
  quantity: number;
  product_price_at_sale: string; // Corregido de 'price' a 'product_price_at_sale'
  subtotal: string;
}

export interface SaleRecord {
  id: number;
  order: number; // <-- AÑADIDO: El ID del pedido original
  total_amount: string; // <-- CORREGIDO: de 'total' a 'total_amount'
  sale_timestamp: string;
  processed_by_username: string; // <-- CORREGIDO: de 'user' a 'processed_by_username'
  items_sold: SaleDetailItem[];
}


// --- INTERFACES DE PAYLOAD (Lo que enviamos al backend) ---
export interface OrderDetailWritePayload {
  product_id: number;
  quantity: number;
}
export interface CreateOrderPayload { // Para que el cliente cree un pedido
  table: number;
  customer_name?: string | null;
  details_write: OrderDetailWritePayload[];
}
export interface UpdateOrderPayload { // Para que el personal edite un pedido
  table: number;
  customer_name: string | null;
  details_write: OrderDetailWritePayload[];
}

// --- INTERFACES DE RESPUESTA (Lo que recibimos del backend) ---
export interface OrderDetailResponse {
  id: number;
  product: Product;
  quantity: number;
  subtotal: string;
}
export interface OrderResponse {
  id: number;
  table: number;
  table_number: number;
  status: string;
  total: string;
  created_at: string;
  updated_at: string;
  customer_name: string | null;
  details: OrderDetailResponse[];
  view_token?: string; // Es opcional porque no vendrá en todos los casos
}
export interface ApiError {
  error?: string;
  detail?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private baseApiUrl = 'http://Darcia2.pythonanywhere.com/api/v1/orders/';

  constructor(private http: HttpClient) { }

  // --- MÉTODOS EXISTENTES (Para el cliente) ---
  createOrder(orderPayload: CreateOrderPayload): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.baseApiUrl, orderPayload).pipe(catchError(this.handleError));
  }

  getOrderByToken(token: string): Observable<OrderResponse> {
    const url = `${this.baseApiUrl}by-token/`;
    const params = new HttpParams().set('token', token);
    return this.http.get<OrderResponse>(url, { params }).pipe(catchError(this.handleError));
  }

  // --- NUEVOS MÉTODOS (Para el Personal) ---

  /**
   * Obtiene una lista de todos los pedidos.
   * El interceptor se encargará de la autenticación.
   * Podríamos añadir filtros aquí en el futuro (ej. ?status=pending)
   */
  getOrders(): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(this.baseApiUrl).pipe(catchError(this.handleError));
  }

  /**
   * Edita los artículos de un pedido pendiente.
   * @param orderId ID del pedido a modificar.
   * @param payload El cuerpo completo del pedido con los nuevos artículos.
   */
  updateOrder(orderId: number, payload: UpdateOrderPayload): Observable<OrderResponse> {
    const url = `${this.baseApiUrl}${orderId}/`;
    return this.http.put<OrderResponse>(url, payload).pipe(catchError(this.handleError));
  }
  
  // --- Métodos para cambiar el estado de un pedido ---

  private postAction(orderId: number, action: string): Observable<OrderResponse> {
    const url = `${this.baseApiUrl}${orderId}/${action}/`;
    return this.http.post<OrderResponse>(url, {}).pipe(catchError(this.handleError));
  }

  confirmOrder(orderId: number): Observable<OrderResponse> {
    return this.postAction(orderId, 'confirm');
  }

  prepareOrder(orderId: number): Observable<OrderResponse> {
    return this.postAction(orderId, 'prepare');
  }

  readyOrder(orderId: number): Observable<OrderResponse> {
    return this.postAction(orderId, 'ready');
  }

  deliverOrder(orderId: number): Observable<OrderResponse> {
    return this.postAction(orderId, 'deliver');
  }

  payOrder(orderId: number): Observable<OrderResponse> {
    return this.postAction(orderId, 'pay');
  }

  annulOrder(orderId: number): Observable<OrderResponse> {
    return this.postAction(orderId, 'annul');
  }
  // --- NUEVO MÉTODO PARA HISTORIAL DE VENTAS ---
  /**
   * Obtiene el historial de ventas, opcionalmente filtrado por fecha.
   * @param dateFrom Fecha de inicio en formato YYYY-MM-DD
   * @param dateTo Fecha de fin en formato YYYY-MM-DD
   */
  getSalesHistory(dateFrom?: string, dateTo?: string): Observable<SaleRecord[]> {
    const url = `http://127.0.0.1:8000/api/v1/sales/`;
    let params = new HttpParams();

    if (dateFrom) {
      // El backend espera sale_timestamp__date, o gte/lte para rangos más específicos
      params = params.set('sale_timestamp__gte', `${dateFrom}T00:00:00Z`);
    }
    if (dateTo) {
      params = params.set('sale_timestamp__lte', `${dateTo}T23:59:59Z`);
    }

    // El interceptor se encargará de añadir el token de autenticación
    return this.http.get<SaleRecord[]>(url, { params }).pipe(
      catchError(this.handleError)
    );
  }

  // ... (método handleError sin cambios)
  // ... (handleError sin cambios) ...
  private handleError(error: HttpErrorResponse) {
    let errorMessage: string;
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      console.error(`Backend devolvió el código ${error.status}, cuerpo del error: ${JSON.stringify(error.error)}`);
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