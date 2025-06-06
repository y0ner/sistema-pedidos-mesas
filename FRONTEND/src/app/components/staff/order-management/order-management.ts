import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval, startWith, switchMap, takeWhile } from 'rxjs';
import { OrderService, OrderResponse } from '../../../services/order';
import { NotificationService } from '../../../services/notification';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';
import { EditOrderModalComponent } from '../edit-order-modal/edit-order-modal';

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, EditOrderModalComponent],
  templateUrl: './order-management.html',
  styleUrls: ['./order-management.css']
})
export class OrderManagementComponent implements OnInit, OnDestroy {
  
  preparingOrders: OrderResponse[] = [];
  readyToDeliverOrders: OrderResponse[] = [];
  deliveredOrders: OrderResponse[] = []; // <-- AÑADIR ESTA LÍNEA
  
  isLoading: boolean = true;

  pendingOrders: OrderResponse[] = [];
  confirmedOrders: OrderResponse[] = [];

  errorMessage: string | null = null;

  // --- Modal de detalles ---
  isDetailModalVisible: boolean = false;
  selectedOrderDetail: OrderResponse | null = null;

  // --- Modal de edición ---
  isEditModalVisible: boolean = false;
  selectedOrderToEdit: OrderResponse | null = null;

  private pollingSubscription?: Subscription;
  private componentActive: boolean = true;
  private POLLING_INTERVAL_MS = 10000;

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
          if (this.errorMessage) {
            this.notificationService.showError(this.errorMessage);
          }
          this.stopPolling();
        }
      });
  }

  // Reemplaza tu método processOrders() con este:

 processOrders(orders: OrderResponse[]): void {
    console.log('Pedidos recibidos:', orders);
    
    // Filtro más seguro: verifica que 'o' y 'o.status' existan antes de usarlos.
    const activeOrders = orders.filter(o => o && o.status && !['paid', 'annulled'].includes(o.status.toLowerCase()));

    // El resto del método no cambia...
    this.pendingOrders = activeOrders.filter(o => o.status.toLowerCase() === 'pending').sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    this.confirmedOrders = activeOrders.filter(o => o.status.toLowerCase() === 'confirmed').sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
    this.preparingOrders = activeOrders.filter(o => o.status.toLowerCase() === 'preparing').sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
    this.readyToDeliverOrders = activeOrders.filter(o => o.status.toLowerCase() === 'ready_to_deliver').sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
    this.deliveredOrders = activeOrders.filter(o => o.status.toLowerCase() === 'delivered').sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());

    this.isLoading = false;
    this.errorMessage = null;
  }
  stopPolling(): void {
    this.componentActive = false;
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  // --- Métodos para modal de detalles ---
  openDetailModal(order: OrderResponse): void {
    console.log('Abriendo modal para el siguiente pedido:', order); // <-- AÑADE ESTE LOG
    this.selectedOrderDetail = order;
    this.isDetailModalVisible = true;
  }

  closeDetailModal(): void {
    this.isDetailModalVisible = false;
    this.selectedOrderDetail = null;
  }

  // --- Métodos para modal de edición ---
  openEditModal(order: OrderResponse): void {
    this.selectedOrderToEdit = order;
    this.isEditModalVisible = true;
  }

  closeEditModal(): void {
    this.isEditModalVisible = false;
    this.selectedOrderToEdit = null;
  }

  onEditOrder(orderId: number): void {
    const orderToEdit = this.pendingOrders.find(o => o.id === orderId);
    if (orderToEdit) {
      this.closeDetailModal();
      this.openEditModal(orderToEdit);
    }
  }

  handleOrderUpdated(updatedOrder: OrderResponse): void {
    this.notificationService.showSuccess(`Pedido #${updatedOrder.id} ha sido actualizado.`);
    this.refreshOrderInList(updatedOrder);
    this.closeEditModal();
  }

  // --- Acciones de pedido ---
  onConfirmOrder(orderId: number): void {
    this.orderService.confirmOrder(orderId).subscribe({
      next: (updatedOrder) => {
        this.notificationService.showSuccess(`Pedido #${orderId} confirmado.`);
        this.refreshOrderInList(updatedOrder);
        this.closeDetailModal();
      },
      error: (err) => this.notificationService.showError(err.message)
    });
  }

  onPrepareOrder(orderId: number): void {
    this.orderService.prepareOrder(orderId).subscribe({
      next: (updatedOrder) => {
        this.notificationService.showSuccess(`Pedido #${orderId} ahora está en preparación.`);
        this.refreshOrderInList(updatedOrder);
        this.closeDetailModal();
      },
      error: (err) => this.notificationService.showError(err.message)
    });
  }

  onReadyOrder(orderId: number): void {
    this.orderService.readyOrder(orderId).subscribe({
      next: (updatedOrder) => {
        this.notificationService.showSuccess(`Pedido #${orderId} está listo para entregar.`);
        this.refreshOrderInList(updatedOrder);
        this.closeDetailModal();
      },
      error: (err) => this.notificationService.showError(err.message)
    });
  }

  onDeliverOrder(orderId: number): void {
    this.orderService.deliverOrder(orderId).subscribe({
      next: (updatedOrder) => {
        this.notificationService.showSuccess(`Pedido #${orderId} ha sido entregado.`);
        this.refreshOrderInList(updatedOrder);
        this.closeDetailModal();
      },
      error: (err) => this.notificationService.showError(err.message)
    });
  }

   // --- MÉTODO DE ACCIÓN AÑADIDO: ANULAR PEDIDO ---
  annulOrder(orderId: number): void {
    if (confirm(`¿Estás seguro de que quieres ANULAR el pedido #${orderId}? Esta acción es irreversible.`)) {
      this.orderService.annulOrder(orderId).subscribe({
        next: (updatedOrder) => {
          this.notificationService.showSuccess(`Pedido #${orderId} ha sido anulado.`);
          this.refreshOrderInList(updatedOrder); // El pedido desaparecerá de las listas activas
          this.closeDetailModal();
        },
        error: (err) => this.notificationService.showError(err.message || 'Error al anular el pedido.')
      });
    }
  }

   // --- NUEVO MÉTODO DE ACCIÓN ---
  onPayOrder(orderId: number): void {
    // Usamos el confirm de JavaScript para una doble verificación simple.
    if (confirm(`¿Estás seguro de que quieres marcar el pedido #${orderId} como pagado? Esta acción es final.`)) {
      this.orderService.payOrder(orderId).subscribe({
        next: (updatedOrder) => {
          this.notificationService.showSuccess(`Pedido #${orderId} marcado como pagado. Venta registrada.`);
          // El pedido desaparecerá de la vista porque su nuevo estado es 'paid'
          this.refreshOrderInList(updatedOrder); 
          this.closeDetailModal();
        },
        error: (err) => this.notificationService.showError(err.message)
      });
    }
  }

  private refreshOrderInList(updatedOrder: OrderResponse): void {
    this.pendingOrders = this.pendingOrders.filter(o => o.id !== updatedOrder.id);
    this.confirmedOrders = this.confirmedOrders.filter(o => o.id !== updatedOrder.id);
    this.preparingOrders = this.preparingOrders.filter(o => o.id !== updatedOrder.id);
    this.readyToDeliverOrders = this.readyToDeliverOrders.filter(o => o.id !== updatedOrder.id);
    this.deliveredOrders = this.deliveredOrders.filter(o => o.id !== updatedOrder.id); // También filtrar de Entregados

    this.processOrders([
      updatedOrder,
      ...this.pendingOrders,
      ...this.confirmedOrders,
      ...this.preparingOrders,
      ...this.readyToDeliverOrders,
      ...this.deliveredOrders // Incluir deliveredOrders para re-procesar correctamente
    ]);
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}