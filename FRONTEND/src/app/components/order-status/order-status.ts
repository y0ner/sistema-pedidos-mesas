import { Component, OnInit, OnDestroy } from '@angular/core'; // Añadir OnDestroy
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription, interval, startWith, switchMap, takeWhile } from 'rxjs'; // Para polling y gestión de suscripciones
import { OrderContextService } from '../../services/order-context';
import { OrderService, OrderResponse, ApiError } from '../../services/order'; // Importar OrderService y OrderResponse
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner';

@Component({
  selector: 'app-order-status',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './order-status.html',
  styleUrls: ['./order-status.css']
})
export class OrderStatusComponent implements OnInit, OnDestroy {
  // Datos iniciales de queryParams para feedback inmediato
  initialOrderId: string | null = null;
  initialCustomerName: string | null = null;
  initialTableNumber: string | null = null;

  // Datos del pedido obtenidos del backend
  currentOrder: OrderResponse | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;
  lastUpdated: Date | null = null;

  private viewToken: string | null = null;
  private pollingSubscription?: Subscription;
  private componentActive: boolean = true; // Para detener el polling al destruir el componente

  // Intervalo de polling en milisegundos (ej. cada 15 segundos)
  private POLLING_INTERVAL_MS = 15000;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderContextService: OrderContextService,
    private orderService: OrderService // Inyectar OrderService
  ) {}

  ngOnInit(): void {
    // Obtener datos iniciales de queryParams para mostrar algo mientras se carga
    this.initialOrderId = this.route.snapshot.queryParamMap.get('orderId');
    this.initialCustomerName = this.route.snapshot.queryParamMap.get('name');
    this.initialTableNumber = this.route.snapshot.queryParamMap.get('table');

    this.viewToken = localStorage.getItem('orderViewToken');

    if (this.viewToken) {
      this.startPollingOrder(this.viewToken);
    } else {
      this.isLoading = false;
      this.errorMessage = 'No se encontró un token para ver el pedido. Por favor, realiza un pedido primero.';
      // Opcional: Redirigir si no hay token
      // setTimeout(() => this.navigateToHome(), 3000);
    }
  }

  startPollingOrder(token: string): void {
    this.componentActive = true; // Marcar como activo al iniciar
    this.pollingSubscription = interval(this.POLLING_INTERVAL_MS)
      .pipe(
        startWith(0), // Realizar la primera llamada inmediatamente
        takeWhile(() => this.componentActive), // Detener cuando el componente se destruya
        switchMap(() => {
          this.isLoading = true; // Podrías tener un indicador de "actualizando..." sutil
          return this.orderService.getOrderByToken(token);
        })
      )
      .subscribe({
        next: (orderData: OrderResponse) => {
          this.currentOrder = orderData;
          this.isLoading = false;
          this.errorMessage = null;
          this.lastUpdated = new Date();
          console.log('Estado del pedido actualizado:', this.currentOrder);

          // Opcional: Si el pedido llega a un estado final (ej. 'delivered', 'paid', 'cancelled'),
          // podrías detener el polling aquí.
          if (['delivered', 'paid', 'cancelled'].includes(orderData.status.toLowerCase())) {
            this.stopPolling();
            console.log(`Pedido en estado final (${orderData.status}), polling detenido.`);
          }
        },
        error: (err: Error) => {
          this.isLoading = false;
          this.errorMessage = err.message || 'Error al obtener el estado del pedido.';
          console.error('Error en polling:', err);
          // Si el error es 404 (token inválido) o 401/403, detener el polling
          if (err.message.includes('404') || err.message.includes('401') || err.message.includes('403')) {
            this.stopPolling();
            localStorage.removeItem('orderViewToken'); // Token inválido, limpiarlo
            this.errorMessage += ' El token de visualización podría ser inválido o haber expirado.';
          }
        }
      });
  }

  stopPolling(): void {
    this.componentActive = false; // Esto detendrá el takeWhile
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  navigateToHome(): void {
    this.stopPolling(); // Detener el polling antes de navegar
    localStorage.removeItem('orderViewToken'); // Limpiar el token al salir
    this.orderContextService.clearValidatedTable(); // Limpiar contexto de la mesa del servicio
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    this.stopPolling(); // Asegurarse de detener el polling al destruir el componente
  }
}