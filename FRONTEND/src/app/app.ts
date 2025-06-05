import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { OrderContextService } from './services/order-context';
// --- 1. VERIFICA ESTA LÍNEA DE IMPORTACIÓN ---
import { NotificationComponent } from './components/notification/notification';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    // --- 2. VERIFICA QUE NotificationComponent ESTÉ AQUÍ ---
    NotificationComponent 
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'MesaFácil';
  public cartItemCount$: Observable<number>;

  constructor(private orderContextService: OrderContextService) {
    this.cartItemCount$ = this.orderContextService.getCartItemCount();
  }
}