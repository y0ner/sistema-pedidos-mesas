// FRONTEND/src/app/guards/admin-guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { NotificationService } from '../services/notification';
import { UserService, User } from '../services/user';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const userService = inject(UserService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  if (!authService.isLoggedIn()) {
    notificationService.showError('Debes iniciar sesión para continuar.');
    router.navigate(['/login']);
    return false;
  }

  // Usamos el endpoint /me/ que ya funciona para obtener los datos del usuario
  return userService.getMe().pipe(
    map((user: User) => {
      if (user.is_superuser) {
        return true; // Si es superusuario, permitir acceso
      } else {
        // Si no es superusuario, mostrar error y redirigir
        notificationService.showError('No tienes permisos de administrador para acceder aquí.');
        router.navigate(['/staff/dashboard']); // O a cualquier otra ruta segura
        return false;
      }
    }),
    catchError(() => {
      // Si hay un error obteniendo los datos del usuario, denegar acceso por seguridad
      notificationService.showError('No se pudieron verificar tus permisos. Inténtalo de nuevo.');
      router.navigate(['/staff/dashboard']);
      return of(false);
    })
  );
};