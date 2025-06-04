import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // Importamos el operador map
import { Product } from './product'; // Asegúrate de que la ruta a Product (o ProductService que la exporta) sea correcta

// --- NUEVA INTERFAZ ---
export interface CartItem {
  product: Product;
  quantity: number;
}
// --- FIN NUEVA INTERFAZ ---

@Injectable({
  providedIn: 'root'
})
export class OrderContextService {

  private validatedTableIdSubject = new BehaviorSubject<number | null>(null);
  public validatedTableId$: Observable<number | null> = this.validatedTableIdSubject.asObservable();

  private validatedTableNumberSubject = new BehaviorSubject<number | null>(null);
  public validatedTableNumber$: Observable<number | null> = this.validatedTableNumberSubject.asObservable();

  // --- NUEVO PARA EL CARRITO ---
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  public cartItems$: Observable<CartItem[]> = this.cartItemsSubject.asObservable();
  // --- FIN NUEVO PARA EL CARRITO ---

  constructor() {
    // Podríamos cargar el carrito desde localStorage si quisiéramos persistencia
    // const storedCart = localStorage.getItem('mesaFacilCart');
    // if (storedCart) {
    //   this.cartItemsSubject.next(JSON.parse(storedCart));
    // }
  }

  setValidatedTable(tableId: number, tableNumber: number): void {
    this.validatedTableIdSubject.next(tableId);
    this.validatedTableNumberSubject.next(tableNumber);
  }

  getCurrentValidatedTableId(): number | null {
    return this.validatedTableIdSubject.getValue();
  }

  clearValidatedTable(): void {
    this.validatedTableIdSubject.next(null);
    this.validatedTableNumberSubject.next(null);
    this.clearCart(); // También limpiamos el carrito si se limpia la mesa
  }

  // --- NUEVOS MÉTODOS PARA EL CARRITO ---

  /**
   * Añade un producto al carrito o actualiza su cantidad si ya existe.
   * @param product El producto a añadir.
   * @param quantityToAdd La cantidad a añadir (por defecto 1).
   */
  addToCart(product: Product, quantityToAdd: number = 1): void {
    if (quantityToAdd <= 0) return; // No añadir si la cantidad es cero o negativa

    const currentItems = [...this.cartItemsSubject.getValue()]; // Copia del array actual
    const existingItemIndex = currentItems.findIndex(item => item.product.id === product.id);

    if (existingItemIndex > -1) {
      // El producto ya está en el carrito, actualiza la cantidad
      currentItems[existingItemIndex].quantity += quantityToAdd;
    } else {
      // El producto no está en el carrito, añádelo
      currentItems.push({ product, quantity: quantityToAdd });
    }
    this.cartItemsSubject.next(currentItems);
    // this.saveCartToLocalStorage(currentItems); // Opcional: para persistencia
  }

  /**
   * Actualiza la cantidad de un ítem específico en el carrito.
   * Si la nueva cantidad es 0 o menor, el ítem se elimina.
   * @param productId El ID del producto a actualizar.
   * @param newQuantity La nueva cantidad.
   */
  updateItemQuantity(productId: number, newQuantity: number): void {
    let currentItems = [...this.cartItemsSubject.getValue()];
    const itemIndex = currentItems.findIndex(item => item.product.id === productId);

    if (itemIndex > -1) {
      if (newQuantity > 0) {
        currentItems[itemIndex].quantity = newQuantity;
      } else {
        // Si la nueva cantidad es 0 o negativa, elimina el ítem
        currentItems.splice(itemIndex, 1);
      }
      this.cartItemsSubject.next(currentItems);
      // this.saveCartToLocalStorage(currentItems); // Opcional
    }
  }

  /**
   * Elimina un producto completamente del carrito.
   * @param productId El ID del producto a eliminar.
   */
  removeFromCart(productId: number): void {
    const currentItems = this.cartItemsSubject.getValue().filter(item => item.product.id !== productId);
    this.cartItemsSubject.next(currentItems);
    // this.saveCartToLocalStorage(currentItems); // Opcional
  }

  /**
   * Limpia todos los ítems del carrito.
   */
  clearCart(): void {
    this.cartItemsSubject.next([]);
    // this.saveCartToLocalStorage([]); // Opcional
  }

  /**
   * Obtiene el número total de ítems individuales en el carrito (suma de cantidades).
   */
  getCartItemCount(): Observable<number> {
    return this.cartItems$.pipe(
      map(items => items.reduce((count, item) => count + item.quantity, 0))
    );
  }

  /**
   * Obtiene el monto total del carrito.
   */
  getCartTotalAmount(): Observable<number> {
    return this.cartItems$.pipe(
      map(items => items.reduce((total, item) => total + (item.product.price * item.quantity), 0))
    );
  }

  /**
   * Devuelve una instantánea de los ítems actuales del carrito.
   * Útil para cuando necesitas los datos del carrito para enviar al backend.
   */
  getCurrentCartItems(): CartItem[] {
    return this.cartItemsSubject.getValue();
  }

  // Opcional: Método para guardar en localStorage
  // private saveCartToLocalStorage(items: CartItem[]): void {
  //   localStorage.setItem('mesaFacilCart', JSON.stringify(items));
  // }

  // --- FIN NUEVOS MÉTODOS PARA EL CARRITO ---
}