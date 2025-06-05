import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { NotificationService } from '../services/notification';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  // El método isLoggedIn() debería verificar si hay un token válido.
  // Por ahora, verifica si el BehaviorSubject es true.
  if (authService.isLoggedIn()) {
    return true; // El usuario está autenticado, permitir el acceso.
  } else {
    // El usuario no está autenticado.
    console.warn('AuthGuard: Acceso denegado. Se requiere iniciar sesión.');
    notificationService.showError('Debes iniciar sesión para acceder a esta página.');
    
    // Redirigir a la página de login
    router.navigate(['/login']);
    return false; // Bloquear el acceso.
  }
};