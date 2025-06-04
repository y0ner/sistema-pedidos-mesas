import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { OrderContextService } from '../services/order-context'; // Ajusta la ruta si es necesario

export const tableValidatedGuard: CanActivateFn = (route, state) => {
  const orderContextService = inject(OrderContextService);
  const router = inject(Router);

  if (orderContextService.getCurrentValidatedTableId() !== null) {
    return true; // Hay un ID de mesa validado, permitir el acceso
  } else {
    // No hay ID de mesa validado, redirigir a la página de validación de código
    console.warn('Acceso denegado a la ruta. Se requiere validación de mesa.');
    router.navigate(['/']); // Redirige a la ruta raíz (donde está TableCodeValidationComponent)
    return false; // Denegar el acceso
  }
};