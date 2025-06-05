import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from './product'; // Asegúrate que la ruta a Product sea correcta

export interface CartItem {
  product: Product;
  quantity: number;
}

// --- CLAVES PARA LOCALSTORAGE ---
const VALIDATED_TABLE_ID_KEY = 'mesaFacilValidatedTableId';
const VALIDATED_TABLE_NUMBER_KEY = 'mesaFacilValidatedTableNumber';
const CART_ITEMS_KEY = 'mesaFacilCartItems';
// --- FIN CLAVES ---

@Injectable({
  providedIn: 'root'
})
export class OrderContextService {

  private validatedTableIdSubject: BehaviorSubject<number | null>;
  public validatedTableId$: Observable<number | null>;

  private validatedTableNumberSubject: BehaviorSubject<number | null>;
  public validatedTableNumber$: Observable<number | null>;

  private cartItemsSubject: BehaviorSubject<CartItem[]>;
  public cartItems$: Observable<CartItem[]>;

  constructor() {
    // --- CARGAR DESDE LOCALSTORAGE AL INICIAR CON LOGS PARA DEPURACIÓN ---
    let initialTableId: number | null = null;
    let initialTableNumber: number | null = null;
    let initialCartItems: CartItem[] = [];

    try {
      const storedTableId = localStorage.getItem(VALIDATED_TABLE_ID_KEY);
      if (storedTableId) {
        initialTableId = JSON.parse(storedTableId);
        console.log('Constructor OrderContext: TableId cargado de localStorage:', initialTableId);
      } else {
        console.log('Constructor OrderContext: No se encontró TableId en localStorage.');
      }

      const storedTableNumber = localStorage.getItem(VALIDATED_TABLE_NUMBER_KEY);
      if (storedTableNumber) {
        initialTableNumber = JSON.parse(storedTableNumber);
        console.log('Constructor OrderContext: TableNumber cargado de localStorage:', initialTableNumber);
      } else {
        console.log('Constructor OrderContext: No se encontró TableNumber en localStorage.');
      }

      const storedCartItems = localStorage.getItem(CART_ITEMS_KEY);
      if (storedCartItems) {
        initialCartItems = JSON.parse(storedCartItems);
        console.log('Constructor OrderContext: CartItems cargados de localStorage:', initialCartItems.length, 'items.');
      } else {
        console.log('Constructor OrderContext: No se encontraron CartItems en localStorage.');
      }

    } catch (e) {
      console.error('Constructor OrderContext - Error parseando localStorage:', e);
      // Si hay error, limpiar las claves para evitar problemas recurrentes
      localStorage.removeItem(VALIDATED_TABLE_ID_KEY);
      localStorage.removeItem(VALIDATED_TABLE_NUMBER_KEY);
      localStorage.removeItem(CART_ITEMS_KEY);
    }

    this.validatedTableIdSubject = new BehaviorSubject<number | null>(initialTableId);
    this.validatedTableNumberSubject = new BehaviorSubject<number | null>(initialTableNumber);
    this.cartItemsSubject = new BehaviorSubject<CartItem[]>(initialCartItems);
    // --- FIN CARGAR DESDE LOCALSTORAGE ---

    this.validatedTableId$ = this.validatedTableIdSubject.asObservable();
    this.validatedTableNumber$ = this.validatedTableNumberSubject.asObservable();
    this.cartItems$ = this.cartItemsSubject.asObservable();

    // Log para ver el estado inicial de los BehaviorSubjects después de la carga
    console.log('Constructor OrderContext - Estado inicial BehaviorSubjects:', {
      tableId: this.validatedTableIdSubject.getValue(),
      tableNumber: this.validatedTableNumberSubject.getValue(),
      cartLength: this.cartItemsSubject.getValue().length
    });
  }

  setValidatedTable(tableId: number, tableNumber: number): void {
    this.validatedTableIdSubject.next(tableId);
    this.validatedTableNumberSubject.next(tableNumber);
    // --- GUARDAR EN LOCALSTORAGE ---
    try {
      localStorage.setItem(VALIDATED_TABLE_ID_KEY, JSON.stringify(tableId));
      localStorage.setItem(VALIDATED_TABLE_NUMBER_KEY, JSON.stringify(tableNumber));
      console.log('setValidatedTable: Guardado en localStorage:', { tableId, tableNumber });
    } catch (e) {
      console.error('setValidatedTable: Error guardando en localStorage:', e);
    }
    // --- FIN GUARDAR ---
  }

  getCurrentValidatedTableId(): number | null {
    return this.validatedTableIdSubject.getValue();
  }

  clearValidatedTable(): void {
    console.log('clearValidatedTable: Limpiando contexto de mesa.');
    this.validatedTableIdSubject.next(null);
    this.validatedTableNumberSubject.next(null);
    // --- LIMPIAR DE LOCALSTORAGE ---
    localStorage.removeItem(VALIDATED_TABLE_ID_KEY);
    localStorage.removeItem(VALIDATED_TABLE_NUMBER_KEY);
    console.log('clearValidatedTable: Datos de mesa eliminados de localStorage.');
    // --- FIN LIMPIAR ---
    this.clearCart(); // El carrito se limpia si se limpia la mesa
  }

  // --- MÉTODOS DEL CARRITO ACTUALIZADOS PARA LOCALSTORAGE ---
  private saveCartToLocalStorage(items: CartItem[]): void {
    try {
      localStorage.setItem(CART_ITEMS_KEY, JSON.stringify(items));
      console.log('saveCartToLocalStorage: Carrito guardado en localStorage, items:', items.length);
    } catch (e) {
      console.error('saveCartToLocalStorage: Error guardando carrito en localStorage:', e);
    }
  }

  addToCart(product: Product, quantityToAdd: number = 1): void {
    if (quantityToAdd <= 0) return;
    const currentItems = [...this.cartItemsSubject.getValue()];
    const existingItemIndex = currentItems.findIndex(item => item.product.id === product.id);

    if (existingItemIndex > -1) {
      currentItems[existingItemIndex].quantity += quantityToAdd;
    } else {
      currentItems.push({ product, quantity: quantityToAdd });
    }
    this.cartItemsSubject.next(currentItems);
    this.saveCartToLocalStorage(currentItems);
  }

  updateItemQuantity(productId: number, newQuantity: number): void {
    let currentItems = [...this.cartItemsSubject.getValue()];
    const itemIndex = currentItems.findIndex(item => item.product.id === productId);

    if (itemIndex > -1) {
      if (newQuantity > 0) {
        currentItems[itemIndex].quantity = newQuantity;
      } else {
        currentItems.splice(itemIndex, 1);
      }
      this.cartItemsSubject.next(currentItems);
      this.saveCartToLocalStorage(currentItems);
    }
  }

  removeFromCart(productId: number): void {
    const currentItems = this.cartItemsSubject.getValue().filter(item => item.product.id !== productId);
    this.cartItemsSubject.next(currentItems);
    this.saveCartToLocalStorage(currentItems);
  }

  clearCart(): void {
    console.log('clearCart: Limpiando carrito.');
    this.cartItemsSubject.next([]);
    this.saveCartToLocalStorage([]); // Guardar array vacío
    console.log('clearCart: Carrito eliminado de localStorage.');
  }
  // --- FIN MÉTODOS DEL CARRITO ACTUALIZADOS ---

  getCartItemCount(): Observable<number> {
    return this.cartItems$.pipe(
      map(items => items.reduce((count, item) => count + item.quantity, 0))
    );
  }

  getCartTotalAmount(): Observable<number> {
    return this.cartItems$.pipe(
      map(items => items.reduce((total, item) => total + (item.product.price * item.quantity), 0))
    );
  }

  getCurrentCartItems(): CartItem[] {
    return this.cartItemsSubject.getValue();
  }
}