import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// --- INTERFACES BASADAS EN LA RESPUESTA DEL BACKEND ---

export interface TopSellingProduct {
  product_name: string;
  total_sold: number;
}

export interface DashboardStats {
  sales_today: string;
  orders_today_count: number;
  top_selling_products: TopSellingProduct[];
  pending_orders_count: number;
}

// --- FIN INTERFACES ---

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private apiUrl = 'http://Darcia2.pythonanywhere.com/api/v1/dashboard-stats/';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene las estadísticas del dashboard desde el backend.
   * La autenticación es manejada automáticamente por nuestro AuthInterceptor.
   * @returns Un Observable con las estadísticas del dashboard.
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(this.apiUrl);
  }
}