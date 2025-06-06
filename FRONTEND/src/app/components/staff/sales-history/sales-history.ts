import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; // <-- 1. IMPORTAR RouterModule
import { OrderService, SaleRecord } from '../../../services/order';
import { NotificationService } from '../../../services/notification';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';
import { AuthService } from '../../../services/auth'; // <-- 2. IMPORTAR AuthService

@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    DecimalPipe,
    LoadingSpinnerComponent,
    RouterModule // <-- 3. AÑADIR RouterModule A LOS IMPORTS
  ],
  templateUrl: './sales-history.html',
  styleUrls: ['./sales-history.css']
})
export class SalesHistoryComponent implements OnInit {

  sales: SaleRecord[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  totalSalesValue: number = 0;
  dateFrom: string = '';
  dateTo: string = '';

  constructor(
    private orderService: OrderService,
    private notificationService: NotificationService,
    private authService: AuthService // <-- 4. INYECTAR AuthService
  ) {}

  ngOnInit(): void {
    this.loadSalesHistory();
  }

  loadSalesHistory(): void {
    // ... (este método no cambia)
    this.isLoading = true;
    this.errorMessage = null;
    this.orderService.getSalesHistory(this.dateFrom, this.dateTo).subscribe({
      next: (data) => {
        this.sales = data.sort((a, b) => new Date(b.sale_timestamp).getTime() - new Date(a.sale_timestamp).getTime());
        this.calculateTotalSales();
        this.isLoading = false;
        console.log('Historial de ventas cargado:', this.sales);
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
    console.log('Filtrando ventas desde', this.dateFrom, 'hasta', this.dateTo);
    this.loadSalesHistory();
  }

  clearFilters(): void {
    this.dateFrom = '';
    this.dateTo = '';
    this.loadSalesHistory();
  }

  calculateTotalSales(): void {
    this.totalSalesValue = this.sales.reduce((total, sale) => total + parseFloat(sale.total), 0);
  }

  // --- 5. AÑADIR ESTE NUEVO MÉTODO ---
  logout(): void {
    this.authService.logout();
  }
}