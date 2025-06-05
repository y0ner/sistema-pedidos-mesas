import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common'; // Importar DecimalPipe
import { AuthService } from '../../../services/auth';
import { DashboardService, DashboardStats } from '../../../services/dashboard'; // Importar servicio y la interfaz
import { NotificationService } from '../../../services/notification';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';
import { RouterModule } from '@angular/router'; // Para futuros enlaces

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DecimalPipe, LoadingSpinnerComponent, RouterModule], // Añadir DecimalPipe y RouterModule
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  stats: DashboardStats | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;
  
  // Guardamos el nombre de usuario para personalizar el saludo
  username: string = 'Personal';

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    // Podemos intentar obtener el nombre de usuario del token si lo guardáramos decodificado
    // Por ahora, es un saludo genérico.
  }

  loadStats(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.dashboardService.getDashboardStats().subscribe({
    next: (data) => {
      this.stats = data;
      this.isLoading = false;
      console.log('Estadísticas del dashboard cargadas:', data);
    },
      error: (err) => {
      this.isLoading = false;
      this.errorMessage = err.message || 'No se pudieron cargar las estadísticas del dashboard.';

      // --- AÑADE ESTA CONDICIÓN 'if' ---
      if (this.errorMessage) {
        this.notificationService.showError(this.errorMessage);
      }
      // --- FIN DE LA CONDICIÓN ---
    }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}