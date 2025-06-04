import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common'; // Importa DecimalPipe
import { RouterModule } from '@angular/router'; // Para enlaces, si es necesario
import { Observable } from 'rxjs';
import { OrderContextService, CartItem } from '../../services/order-context'; // Importamos el servicio y la interfaz
import { FormsModule } from '@angular/forms'; // Para ngModel en el input de cantidad

@Component({
  selector: 'app-shopping-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, // Añade RouterModule si vas a usar routerLink
    FormsModule,  // Añade FormsModule
    DecimalPipe   // Añade DecimalPipe
  ],
  templateUrl: './shopping-cart.html',
  styleUrls: ['./shopping-cart.css']
})
export class ShoppingCartComponent implements OnInit {
  cartItems$: Observable<CartItem[]>;
  cartItemCount$: Observable<number>;
  cartTotalAmount$: Observable<number>;
  validatedTableNumber$: Observable<number | null>;


  constructor(private orderContextService: OrderContextService) {
    this.cartItems$ = this.orderContextService.cartItems$;
    this.cartItemCount$ = this.orderContextService.getCartItemCount();
    this.cartTotalAmount$ = this.orderContextService.getCartTotalAmount();
    this.validatedTableNumber$ = this.orderContextService.validatedTableNumber$;
  }

  ngOnInit(): void {
    // No se necesita lógica adicional aquí por ahora,
    // los observables se manejarán en la plantilla con la pipe async.
  }

  updateQuantity(productId: number, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    let newQuantity = parseInt(inputElement.value, 10);

    if (isNaN(newQuantity)) { // Si no es un número, no hacer nada o resetear
      // Opcional: podrías recargar los items para resetear el input a su valor previo
      // this.cartItems$ = this.orderContextService.cartItems$; // Esto forzaría una recarga del valor
      return;
    }
    if (newQuantity < 0) {
      newQuantity = 0; // No permitir cantidades negativas, se tratará como 0 (eliminar)
    }
    this.orderContextService.updateItemQuantity(productId, newQuantity);
  }

  incrementQuantity(item: CartItem): void {
    this.orderContextService.updateItemQuantity(item.product.id, item.quantity + 1);
  }

  decrementQuantity(item: CartItem): void {
    if (item.quantity > 0) { // Prevenir que baje de 0 aquí, updateItemQuantity lo eliminará si es 0
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

  // Placeholder para la función de realizar pedido
  proceedToOrder(): void {
    // Aquí obtendremos los datos del OrderContextService:
    const tableId = this.orderContextService.getCurrentValidatedTableId();
    const cartItems = this.orderContextService.getCurrentCartItems();
    // const customerName = ... (necesitaremos un input para esto)

    if (!tableId) {
      alert('Error: No hay una mesa validada. Por favor, valida una mesa primero.');
      // Idealmente, redirigir a la página de validación de mesa
      // this.router.navigate(['/']);
      return;
    }

    if (cartItems.length === 0) {
      alert('Tu carrito está vacío.');
      return;
    }

    alert(`Simulación: Procediendo a realizar pedido para la mesa ${tableId} con ${cartItems.length} tipo(s) de producto(s).`);
    // Lógica para enviar el pedido al backend (próximo paso)
  }
}