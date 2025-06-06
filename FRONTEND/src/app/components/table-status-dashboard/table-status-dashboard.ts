import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, TableService } from '../../services/table'; // Importamos el servicio y la interfaz Table
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner';

@Component({
  selector: 'app-table-status-dashboard',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  templateUrl: './table-status-dashboard.html',
  styleUrls: ['./table-status-dashboard.css'],
  
})
export class TableStatusDashboardComponent implements OnInit, OnDestroy {
  tables: Table[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  lastUpdated: Date | null = null; // Para mostrar cuándo se actualizaron los datos por última vez
  private refreshInterval: any;


  constructor(private tableService: TableService) {}

  ngOnInit(): void {
    this.loadTableStatus();
    // Opcional: Refrescar el estado de las mesas cada X segundos
    // this.refreshInterval = setInterval(() => {
    //   this.loadTableStatus();
    // }, 30000); // Refrescar cada 30 segundos, por ejemplo
  }

  ngOnDestroy(): void {
    // Limpiar el intervalo cuando el componente se destruye para evitar fugas de memoria
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadTableStatus(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.tableService.getAllTables().subscribe({
      next: (data: Table[]) => {
        this.tables = data.sort((a, b) => a.number - b.number); // Ordenar por número de mesa
        this.isLoading = false;
        this.lastUpdated = new Date();
      },
      error: (err: Error) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Error desconocido al cargar el estado de las mesas.';
        console.error(err);
      }
    });
  }

  // Método para obtener una clase CSS basada en el estado de la mesa (¡CORREGIDO!)
  getTableStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'available':
        return 'status-available';
      case 'occupied':
        return 'status-occupied';
      case 'reserved':
        return 'status-reserved';
      case 'unavailable': // Añadido para el estado "No disponible"
      case 'blocked':     // Añadido para el estado "Bloqueada"
        return 'status-unavailable'; // Usaremos una clase genérica para no disponibles/bloqueadas
      default:
        return 'status-unknown';
    }
  }

  // Método para obtener la ruta de la imagen según el estado (¡AÑADIDO!)
  getImageSrc(status: string): string | null {
    switch (status.toLowerCase()) {
      case 'available':
        return 'assets/images/tables/table_available.png';
      case 'occupied':
        return 'assets/images/tables/table_occupied.png';
      case 'reserved':
        return 'assets/images/tables/table_reserved.png';
      case 'unavailable':
      case 'blocked':
        return 'assets/images/tables/table_unavailable.png';
      default:
        return null; // No hay imagen específica, se usará el fallback de Material Icon en HTML
    }
  }
}