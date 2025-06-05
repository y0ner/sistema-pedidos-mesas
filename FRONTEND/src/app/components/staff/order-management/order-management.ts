import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval, startWith, switchMap, takeWhile } from 'rxjs';
import { OrderService, OrderResponse } from '../../../services/order';
import { NotificationService } from '../../../services/notification';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  templateUrl: './order-management.html',
  styleUrls: ['./order-management.css']
})
export class OrderManagementComponent implements OnInit, OnDestroy {
  
  // Arreglos para agrupar los pedidos por estado
  pendingOrders: OrderResponse[] = [];
  confirmedOrders: OrderResponse[] = [];
  preparingOrders: OrderResponse[] = [];
  readyToDeliverOrders: OrderResponse[] = [];
  
  isLoading: boolean = true;
  errorMessage: string | null = null;
  
  private pollingSubscription?: Subscription;
  private componentActive: boolean = true;
  private POLLING_INTERVAL_MS = 10000; // Refrescar cada 10 segundos

  constructor(
    private orderService: OrderService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.startPollingOrders();
  }

  startPollingOrders(): void {
    this.componentActive = true;
    this.pollingSubscription = interval(this.POLLING_INTERVAL_MS)
      .pipe(
        startWith(0),
        takeWhile(() => this.componentActive),
        switchMap(() => {
          this.isLoading = true;
          return this.orderService.getOrders();
        })
      )
      
      .subscribe({
        next: (orders) => this.processOrders(orders),
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.message || 'Error al cargar los pedidos.';
          
          // --- AÑADE ESTA CONDICIÓN 'if' ---
          if (this.errorMessage) {
            this.notificationService.showError(this.errorMessage);
          }
          // --- FIN DE LA CONDICIÓN ---

          this.stopPolling();
        }
      });
  }

  processOrders(orders: OrderResponse[]): void {
    console.log('Pedidos recibidos:', orders);
    
    // Filtrar pedidos que no están en un estado final
    const activeOrders = orders.filter(o => !['paid', 'annulled', 'delivered'].includes(o.status.toLowerCase()));

    // Agrupar los pedidos en sus respectivos arreglos
    this.pendingOrders = activeOrders.filter(o => o.status.toLowerCase() === 'pending').sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    this.confirmedOrders = activeOrders.filter(o => o.status.toLowerCase() === 'confirmed').sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
    this.preparingOrders = activeOrders.filter(o => o.status.toLowerCase() === 'preparing').sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
    this.readyToDeliverOrders = activeOrders.filter(o => o.status.toLowerCase() === 'ready_to_deliver').sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());

    this.isLoading = false;
    this.errorMessage = null;
  }

  stopPolling(): void {
    this.componentActive = false;
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  // --- MÉTODOS DE ACCIÓN PARA LOS BOTONES ---

  onConfirmOrder(orderId: number): void {
    this.orderService.confirmOrder(orderId).subscribe({
      next: (updatedOrder) => {
        this.notificationService.showSuccess(`Pedido #${orderId} confirmado.`);
        this.refreshOrderInList(updatedOrder);
      },
      error: (err) => this.notificationService.showError(err.message)
    });
  }

  onPrepareOrder(orderId: number): void {
    this.orderService.prepareOrder(orderId).subscribe({
      next: (updatedOrder) => {
        this.notificationService.showSuccess(`Pedido #${orderId} ahora está en preparación.`);
        this.refreshOrderInList(updatedOrder);
      },
      error: (err) => this.notificationService.showError(err.message)
    });
  }
  
  onReadyOrder(orderId: number): void {
    this.orderService.readyOrder(orderId).subscribe({
      next: (updatedOrder) => {
        this.notificationService.showSuccess(`Pedido #${orderId} está listo para entregar.`);
        this.refreshOrderInList(updatedOrder);
      },
      error: (err) => this.notificationService.showError(err.message)
    });
  }

  onDeliverOrder(orderId: number): void {
    this.orderService.deliverOrder(orderId).subscribe({
      next: (updatedOrder) => {
        this.notificationService.showSuccess(`Pedido #${orderId} ha sido entregado.`);
        this.refreshOrderInList(updatedOrder);
      },
      error: (err) => this.notificationService.showError(err.message)
    });
  }

  // Placeholder para la lógica de edición
  onEditOrder(orderId: number): void {
    this.notificationService.showInfo(`La funcionalidad para editar el pedido #${orderId} se implementará aquí.`);
    // Aquí iría la lógica para abrir un modal o navegar a una página de edición
  }
  
  /**
   * Actualiza un pedido individual en las listas locales sin tener que recargar todo.
   * @param updatedOrder El pedido actualizado devuelto por la API.
   */
  private refreshOrderInList(updatedOrder: OrderResponse): void {
    // Eliminar el pedido de todas las listas
    this.pendingOrders = this.pendingOrders.filter(o => o.id !== updatedOrder.id);
    this.confirmedOrders = this.confirmedOrders.filter(o => o.id !== updatedOrder.id);
    this.preparingOrders = this.preparingOrders.filter(o => o.id !== updatedOrder.id);
    this.readyToDeliverOrders = this.readyToDeliverOrders.filter(o => o.id !== updatedOrder.id);

    // Volver a procesar el pedido actualizado para colocarlo en la lista correcta
    this.processOrders([updatedOrder, ...this.pendingOrders, ...this.confirmedOrders, ...this.preparingOrders, ...this.readyToDeliverOrders]);
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}