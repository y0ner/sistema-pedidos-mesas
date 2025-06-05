// src/app/components/staff/edit-order-modal/edit-order-modal.component.ts
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit } from '@angular/core'; // Añadir OnInit
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// --- Añadir los servicios que necesitamos ---
import { OrderService, OrderResponse, OrderDetailResponse, UpdateOrderPayload, OrderDetailWritePayload } from '../../../services/order';
import { ProductService, Product } from '../../../services/product';
import { NotificationService } from '../../../services/notification';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';

@Component({
  selector: 'app-edit-order-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent], // Añadir LoadingSpinnerComponent
  templateUrl: './edit-order-modal.html',
  styleUrls: ['./edit-order-modal.css']
})
export class EditOrderModalComponent implements OnChanges, OnInit {
  @Input() order: OrderResponse | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() orderUpdated = new EventEmitter<OrderResponse>();

  editableDetails: OrderDetailResponse[] = [];
  customerName: string = '';
  isLoading: boolean = false;
  
  // Para el selector de "Añadir Producto"
  allProducts: Product[] = [];
  selectedProductIdToAdd: number | null = null;

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Cargar la lista de todos los productos cuando el componente se inicia
    this.productService.getProducts().subscribe(products => {
      this.allProducts = products.filter(p => p.availability); // Solo mostrar productos disponibles para añadir
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['order'] && this.order) {
      this.editableDetails = JSON.parse(JSON.stringify(this.order.details));
      this.customerName = this.order.customer_name || '';
      this.selectedProductIdToAdd = null; // Resetear el selector
    }
  }

  saveChanges(): void {
    if (!this.order) return;

    this.isLoading = true;
    
    // Transformar los detalles editables al formato que el backend espera (details_write)
    const details_write: OrderDetailWritePayload[] = this.editableDetails.map(detail => ({
      product_id: detail.product.id,
      quantity: detail.quantity,
    }));

    const payload: UpdateOrderPayload = {
      table: this.order.table, // El ID de la tabla
      customer_name: this.customerName,
      details_write: details_write
    };

    this.orderService.updateOrder(this.order.id, payload).subscribe({
      next: (updatedOrder) => {
        this.isLoading = false;
        this.orderUpdated.emit(updatedOrder); // Emitir el evento con el pedido actualizado
      },
      error: (err) => {
        this.isLoading = false;
        this.notificationService.showError(err.message || 'Error al actualizar el pedido.');
      }
    });
  }

  // DENTRO DE LA CLASE EditOrderModalComponent

  incrementQuantity(item: OrderDetailResponse): void {
    item.quantity++;
    // Forzar la actualización creando una nueva referencia del arreglo
    this.editableDetails = [...this.editableDetails];
  }

  decrementQuantity(item: OrderDetailResponse): void {
    if (item.quantity > 1) {
      item.quantity--;
      // Forzar la actualización creando una nueva referencia del arreglo
      this.editableDetails = [...this.editableDetails];
    }
  }

  removeItem(productId: number): void {
    // .filter() ya devuelve un nuevo arreglo, por lo que aquí no se necesitan cambios.
    this.editableDetails = this.editableDetails.filter(detail => detail.product.id !== productId);
  }

  // Reemplaza tu método addProduct con este:

  addProduct(): void {
    console.clear(); // Limpia la consola para ver solo los logs de esta ejecución
    console.log('--- 1. Inicia addProduct() ---');
    console.log('Valor de selectedProductIdToAdd:', this.selectedProductIdToAdd, '| Tipo:', typeof this.selectedProductIdToAdd);

    if (!this.selectedProductIdToAdd) {
      console.error('Error en Paso 1: Saliendo porque selectedProductIdToAdd está vacío.');
      return;
    }

    // **POSIBLE SOLUCIÓN AÑADIDA:** Usamos Number() para evitar problemas si el ID del select viene como string.
    const productToAdd = this.allProducts.find(p => p.id === Number(this.selectedProductIdToAdd));
    
    console.log('--- 2. Buscando producto en la lista "allProducts" ---');
    console.log('Producto encontrado:', productToAdd);

    if (!productToAdd) {
      console.error('Error en Paso 2: No se encontró el producto en la lista `allProducts`. La función termina aquí.');
      return;
    }

    let items = [...this.editableDetails];
    const existingItem = items.find(detail => detail.product.id === productToAdd.id);
    console.log('--- 3. Verificando si el producto ya existe en el pedido ---');
    console.log('Ítem existente encontrado:', existingItem);
    
    if (existingItem) {
      existingItem.quantity++;
      console.log('--- 4. El producto ya existía. Cantidad incrementada a:', existingItem.quantity);
    } else {
      const newItem: OrderDetailResponse = {
        id: -1,
        product: productToAdd,
        quantity: 1,
        subtotal: productToAdd.price.toString()
      };
      items.push(newItem);
      console.log('--- 4. El producto es nuevo. Nuevo ítem añadido a la lista:', newItem);
    }
    
    this.editableDetails = items;
    console.log('--- 5. Lista `editableDetails` actualizada ---');
    console.log('Nuevo contenido de la lista:', this.editableDetails);
    
    this.selectedProductIdToAdd = null; 
    console.log('--- 6. Fin de addProduct() ---');
  }

// ... (resto de la clase)
 
  calculateTotal(): number {
    return this.editableDetails.reduce((total, item) => {
        return total + (Number(item.product.price) * item.quantity);
    }, 0);
  }

  closeModal(): void {
    this.close.emit();
  }
}