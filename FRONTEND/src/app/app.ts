import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { OrderContextService } from './services/order-context';
import { NotificationComponent } from './components/notification/notification';
// --- NUEVAS IMPORTACIONES ---
import { AuthService } from './services/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    NotificationComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'MesaFácil';
  public cartItemCount$: Observable<number>;
  // --- NUEVA PROPIEDAD ---
  public isStaffLoggedIn$: Observable<boolean>;

  constructor(
    private orderContextService: OrderContextService,
    private authService: AuthService // <-- Inyectar AuthService
  ) {
    this.cartItemCount$ = this.orderContextService.getCartItemCount();
    // --- Asignar el observable de autenticación ---
    this.isStaffLoggedIn$ = this.authService.isAuthenticated$;
  }
}