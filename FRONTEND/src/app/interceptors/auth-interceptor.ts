import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const authToken = authService.getAccessToken();

  // Clonar la petición para añadir la nueva cabecera.
  // Solo añadimos el token si existe.
  if (authToken) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${authToken}`
      }
    });
    // Pasar la petición clonada al siguiente manejador.
    return next(authReq);
  }

  // Si no hay token, pasar la petición original sin modificar.
  return next(req);
};