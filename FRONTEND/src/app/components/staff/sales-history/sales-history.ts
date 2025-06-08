import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, SaleRecord } from '../../../services/order';
import { NotificationService } from '../../../services/notification';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';

@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    LoadingSpinnerComponent
  ],
  templateUrl: './sales-history.html',
  styleUrls: ['./sales-history.css']
})
export class SalesHistoryComponent implements OnInit {

  sales: SaleRecord[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  totalSalesValue: number = 0;
  
  // Para los filtros de fecha
  dateFrom: string = '';
  dateTo: string = '';

  // Para expandir los detalles de una venta
  expandedSaleId: number | null = null;

  constructor(
    private orderService: OrderService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadSalesHistory();
  }

  loadSalesHistory(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.orderService.getSalesHistory(this.dateFrom, this.dateTo).subscribe({
      next: (data) => {
        this.sales = data; // La API ya debería devolverlos ordenados, si no, se puede ordenar aquí.
        this.calculateTotalSales();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'No se pudo cargar el historial de ventas.';
        if (this.errorMessage) {
            this.notificationService.showError(this.errorMessage);
        }
      }
    });
  }
  
  onFilterSubmit(): void {
    this.loadSalesHistory();
  }

  clearFilters(): void {
    this.dateFrom = '';
    this.dateTo = '';
    this.loadSalesHistory();
  }

  calculateTotalSales(): void {
    // Usamos 'total_amount' en lugar de 'total'
    this.totalSalesValue = this.sales.reduce((total, sale) => total + parseFloat(sale.total_amount), 0);
  }

  // Método para mostrar/ocultar los detalles de una venta
  toggleDetails(saleId: number): void {
    if (this.expandedSaleId === saleId) {
      this.expandedSaleId = null; // Si ya está expandido, lo colapsamos
    } else {
      this.expandedSaleId = saleId; // Si no, lo expandimos
    }
  }
}