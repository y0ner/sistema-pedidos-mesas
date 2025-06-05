import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { OrderContextService, CartItem } from '../../services/order-context';
import { FormsModule } from '@angular/forms';
import { OrderService, CreateOrderPayload, OrderDetailWritePayload, OrderResponse } from '../../services/order';

@Component({
  selector: 'app-shopping-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DecimalPipe
  ],
  templateUrl: './shopping-cart.html',
  styleUrls: ['./shopping-cart.css']
})
export class ShoppingCartComponent implements OnInit {
  cartItems$: Observable<CartItem[]>;
  cartItemCount$: Observable<number>;
  cartTotalAmount$: Observable<number>;
  validatedTableNumber$: Observable<number | null>;

  // --- NUEVAS PROPIEDADES ---
  customerName: string = '';
  isSubmittingOrder: boolean = false;
  orderSubmissionError: string | null = null;
  orderSubmissionSuccess: string | null = null;
  formSubmittedAttempt: boolean = false;

   constructor(
    private orderContextService: OrderContextService,
    private orderService: OrderService,
    private router: Router
  ) {
    this.cartItems$ = this.orderContextService.cartItems$;
    this.cartItemCount$ = this.orderContextService.getCartItemCount();
    this.cartTotalAmount$ = this.orderContextService.getCartTotalAmount();
    this.validatedTableNumber$ = this.orderContextService.validatedTableNumber$;
  }

  ngOnInit(): void {}

  updateQuantity(productId: number, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    let newQuantity = parseInt(inputElement.value, 10);
    if (isNaN(newQuantity)) { return; }
    if (newQuantity < 0) { newQuantity = 0; }
    this.orderContextService.updateItemQuantity(productId, newQuantity);
  }

  incrementQuantity(item: CartItem): void {
    this.orderContextService.updateItemQuantity(item.product.id, item.quantity + 1);
  }

  decrementQuantity(item: CartItem): void {
    if (item.quantity > 0) {
      this.orderContextService.updateItemQuantity(item.product.id, item.quantity - 1);
    }
  }

  removeItem(productId: number): void {
    this.orderContextService.removeFromCart(productId);
  }

  clearCart(): void {
    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      this.orderContextService.clearCart();
    }
  }


  // --- MÉTODO proceedToOrder ACTUALIZADO ---
  proceedToOrder(): void {
    this.formSubmittedAttempt = true;
    this.isSubmittingOrder = true;
    this.orderSubmissionError = null;
    this.orderSubmissionSuccess = null;

    const tableId = this.orderContextService.getCurrentValidatedTableId();
    const currentCartItems = this.orderContextService.getCurrentCartItems();

    // --- NUEVA VALIDACIÓN PARA EL NOMBRE ---
    if (!this.customerName || this.customerName.trim() === '') {
      this.orderSubmissionError = 'Por favor, ingresa tu nombre para realizar el pedido.';
      this.isSubmittingOrder = false;
      this.formSubmittedAttempt = true; // Asegurar que se muestre el error del input si está vacío
      return;
    }
    // --- FIN NUEVA VALIDACIÓN ---

    if (!tableId) {
      this.orderSubmissionError = 'Error: No hay una mesa validada. Por favor, valida una mesa primero.';
      this.isSubmittingOrder = false;
      return;
    }

    if (currentCartItems.length === 0) {
      this.orderSubmissionError = 'Tu carrito está vacío. Añade productos antes de realizar un pedido.';
      this.isSubmittingOrder = false;
      return;
    }

    const details_write: OrderDetailWritePayload[] = currentCartItems.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity
    }));

    const orderPayload: CreateOrderPayload = {
      table: tableId,
      customer_name: this.customerName.trim(), // Ahora es obligatorio, así que lo enviamos directamente
      details_write: details_write
    };

     this.orderService.createOrder(orderPayload).subscribe({
      next: (orderResponse: OrderResponse) => {
        this.isSubmittingOrder = false;
        
        // --- MANEJO DEL view_token Y DATOS PARA LA PÁGINA DE ESTADO ---
        if (orderResponse.view_token) {
          localStorage.setItem('orderViewToken', orderResponse.view_token); // Guardar el token
          this.orderSubmissionSuccess = `¡Pedido realizado con éxito! ID: ${orderResponse.id}. Estado: ${orderResponse.status}. Un mesero se acercará para confirmar.`;

          // Limpiar contexto actual del frontend
          this.orderContextService.clearCart();
          this.orderContextService.clearValidatedTable(); // Limpia tableId y tableNumber del servicio de contexto

          // Navegar a la página de estado del pedido
          // Pasamos orderId, name, y table como queryParams para que OrderStatusComponent los pueda mostrar fácilmente.
          this.router.navigate(
            ['/order-status'], // Ruta sin :id
            {
              queryParams: {
                orderId: orderResponse.id,
                name: orderResponse.customer_name,
                table: orderResponse.table_number
              }
            }
          );

        } else {
          // Esto no debería suceder si el backend siempre devuelve un view_token
          this.orderSubmissionError = 'Pedido creado, pero no se recibió el token de visualización. Contacta a soporte.';
          console.error('No se recibió view_token en la respuesta del pedido:', orderResponse);
           // Aunque hubo un error con el token, el pedido pudo haberse creado.
           // Decidir si limpiar carrito y mesa aquí o no. Por precaución, los limpiamos.
          this.orderContextService.clearCart();
          this.orderContextService.clearValidatedTable();
        }
        // --- FIN MANEJO DEL view_token ---
      },
      error: (err: Error) => {
        this.isSubmittingOrder = false;
        this.orderSubmissionError = err.message || 'Ocurrió un error desconocido al enviar el pedido.';
        console.error('Error al crear el pedido:', err);
      }
    });
  }
  // --- FIN MÉTODO proceedToOrder ACTUALIZADO ---
}