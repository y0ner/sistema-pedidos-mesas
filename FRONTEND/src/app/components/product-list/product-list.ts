import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product, ProductService } from '../../services/product';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.css']
})
export class ProductListComponent implements OnInit {

  products: Product[] = [];
  isLoading: boolean = true;
  error: string | null = null;
  searchTerm: string = '';
  availabilityFilter: string = '';
  minPrice: number | null = null; // <--- NUEVO: Propiedad para el precio mínimo
  maxPrice: number | null = null; // <--- NUEVO: Propiedad para el precio máximo

  constructor(private productService: ProductService) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.error = null;

    let availabilityValue: boolean | null = null;
    if (this.availabilityFilter === 'true') {
      availabilityValue = true;
    } else if (this.availabilityFilter === 'false') {
      availabilityValue = false;
    }

    // Convertir los inputs de precio a números o null si están vacíos
    const currentMinPrice = this.minPrice !== null && !isNaN(this.minPrice) ? this.minPrice : null;
    const currentMaxPrice = this.maxPrice !== null && !isNaN(this.maxPrice) ? this.maxPrice : null;

    this.productService.getProducts(
      this.searchTerm,
      availabilityValue,
      currentMinPrice, // <--- PASAMOS minPrice AL SERVICIO
      currentMaxPrice  // <--- PASAMOS maxPrice AL SERVICIO
    ).subscribe({
      next: (data) => {
        this.products = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al obtener los productos:', err);
        this.error = 'Hubo un error al cargar los productos. Por favor, inténtalo de nuevo más tarde.';
        this.isLoading = false;
      }
    });
  }

  performSearch(): void {
    this.loadProducts();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.availabilityFilter = ''; // También podemos resetear la disponibilidad al limpiar todo
    this.minPrice = null;         // <--- NUEVO: Resetear precio mínimo
    this.maxPrice = null;         // <--- NUEVO: Resetear precio máximo
    this.loadProducts();
  }

  onAvailabilityChange(): void {
    this.loadProducts();
  }

  // NUEVO: Método para manejar el cambio en los inputs de precio
  onPriceChange(): void {
    // Podrías añadir validación aquí si quieres que los precios sean números válidos
    // Por ahora, simplemente recargamos los productos
    this.loadProducts();
  }
}