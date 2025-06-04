import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  image?: string;
  availability: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private apiUrl = 'http://127.0.0.1:8000/api/v1/products/';

  constructor(private http: HttpClient) { }

  getProducts(
    searchTerm?: string,
    availability?: boolean | null,
    minPrice?: number | null, // <--- NUEVO
    maxPrice?: number | null  // <--- NUEVO
  ): Observable<Product[]> {
    let params = new HttpParams();

    if (searchTerm) {
      params = params.set('search', searchTerm);
    }

    if (availability === true) {
      params = params.set('availability', 'true');
    } else if (availability === false) {
      params = params.set('availability', 'false');
    }

    // NUEVO: Añadir filtros de precio si se proporcionan
    if (minPrice != null) { // Usamos != null para cubrir undefined y null, pero no 0
      params = params.set('price__gte', minPrice.toString());
    }
    if (maxPrice != null) {
      params = params.set('price__lte', maxPrice.toString());
    }

    return this.http.get<Product[]>(this.apiUrl, { params });
  }
}