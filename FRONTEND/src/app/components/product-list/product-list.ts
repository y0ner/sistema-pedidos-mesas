import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product, ProductService } from '../../services/product'; // Ya tienes Product aquí
import { OrderContextService } from '../../services/order-context'; // Ya lo tenías para validatedTableNumber$
import { Observable } from 'rxjs';

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

  public validatedTableNumber$: Observable<number | null>;
  products: Product[] = [];
  isLoading: boolean = true;
  error: string | null = null;
  searchTerm: string = '';
  availabilityFilter: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;

  // El constructor ya debería estar inyectando OrderContextService por el paso anterior.
  // Solo nos aseguramos de que ProductService también esté.
  constructor(
    private productService: ProductService,
    private orderContextService: OrderContextService
  ) {
    this.validatedTableNumber$ = this.orderContextService.validatedTableNumber$;
  }

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
    const currentMinPrice = this.minPrice !== null && !isNaN(this.minPrice) ? this.minPrice : null;
    const currentMaxPrice = this.maxPrice !== null && !isNaN(this.maxPrice) ? this.maxPrice : null;

    this.productService.getProducts(
      this.searchTerm,
      availabilityValue,
      currentMinPrice,
      currentMaxPrice
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
    this.availabilityFilter = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.loadProducts();
  }

  onAvailabilityChange(): void {
    this.loadProducts();
  }

  onPriceChange(): void {
    this.loadProducts();
  }

  // --- NUEVO MÉTODO ---
  /**
   * Añade el producto especificado al carrito de compras.
   * @param product El producto a añadir.
   */
  addProductToCart(product: Product): void {
    if (product.availability) {
      this.orderContextService.addToCart(product, 1); // Añade 1 unidad por defecto
      // Opcional: Mostrar alguna notificación de que el producto fue añadido
      // Podríamos usar una librería de "toast" o "snackbar" aquí, o un simple alert/console.log por ahora.
      console.log(`${product.name} añadido al carrito.`);
      // Si quieres una confirmación más visual inmediata sin librerías complejas:
      // alert(`${product.name} ha sido añadido al carrito.`);
    } else {
      console.warn(`El producto ${product.name} no está disponible y no puede ser añadido.`);
      // alert(`El producto ${product.name} no está disponible.`);
    }
  }
  // --- FIN NUEVO MÉTODO ---
}