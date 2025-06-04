import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router'; // Añadir RouterModule
import { CommonModule } from '@angular/common'; // Añadir CommonModule para async pipe
import { Observable } from 'rxjs';
import { OrderContextService } from './services/order-context'; // Importar servicio

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,    // Para usar *ngIf y la pipe async
    RouterOutlet,
    RouterModule     // Para usar routerLink
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'MesaFácil';
  public cartItemCount$: Observable<number>; // Observable para el contador del carrito

  constructor(private orderContextService: OrderContextService) {
    this.cartItemCount$ = this.orderContextService.getCartItemCount();
  }
}