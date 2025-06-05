import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { OrderContextService } from '../services/order-context'; // Ajusta la ruta si es necesario

export const tableNotValidatedGuard: CanActivateFn = (route, state) => {
  const orderContextService = inject(OrderContextService);
  const router = inject(Router);

  if (orderContextService.getCurrentValidatedTableId() !== null) {
    // Ya hay una mesa validada, redirigir al catálogo de productos
    console.log('Ya hay una mesa validada, redirigiendo a /products desde TableNotValidatedGuard.');
    router.navigate(['/products']);
    return false; // Prevenir el acceso a la página de validación
  } else {
    // No hay mesa validada, permitir el acceso a la página de validación
    return true;
  }
};