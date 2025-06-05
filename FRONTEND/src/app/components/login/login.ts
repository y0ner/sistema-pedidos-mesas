import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Para [(ngModel)]
import { Router } from '@angular/router';
import { AuthService, LoginCredentials } from '../../services/auth';
import { NotificationService } from '../../services/notification';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner'; // Importar el spinner

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSpinnerComponent // <-- Añadir aquí
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  credentials: LoginCredentials = {
    username: '',
    password: ''
  };
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  onLogin(): void {
    if (!this.credentials.username || !this.credentials.password) {
      this.notificationService.showError('Por favor, ingresa tu usuario y contraseña.');
      return;
    }

    this.isLoading = true;

    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.isLoading = false;
        this.notificationService.showSuccess('¡Inicio de sesión exitoso!');
        // Redirigir al dashboard del personal (crearemos esta ruta más adelante)
        // Por ahora, redirigimos a una ruta placeholder '/staff'.
        this.router.navigate(['/staff/orders']);
      },
      error: (err) => {
        this.isLoading = false;
        // Asumimos que el backend devuelve un error con un campo 'detail' o 'error'
        const errorMessage = err.detail || err.error?.detail || err.message || 'Error de autenticación. Verifica tus credenciales.';
        this.notificationService.showError(errorMessage);
        console.error('Error en el login:', err);
      }
    });
  }
}