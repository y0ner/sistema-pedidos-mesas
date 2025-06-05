import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { OrderContextService } from '../services/order-context'; // Ajusta la ruta si es necesario

// src/app/guards/table-validated.guard.ts
export const tableValidatedGuard: CanActivateFn = (route, state) => {
  const orderContextService = inject(OrderContextService);
  const router = inject(Router);
  const path = state.url;

  const tableId = orderContextService.getCurrentValidatedTableId();
  console.log(`TableValidatedGuard (intentando acceder a ${path}) - currentTableId recuperado del servicio:`, tableId);

  if (tableId !== null) {
    console.log(`TableValidatedGuard (${path}) - Acceso PERMITIDO.`);
    return true;
  } else {
    console.warn(`TableValidatedGuard (${path}) - NO hay tableId, redirigiendo a /`);
    router.navigate(['/']);
    return false;
  }
};