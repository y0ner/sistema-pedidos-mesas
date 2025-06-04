import { Routes } from '@angular/router';
import { ProductListComponent } from './components/product-list/product-list';
import { TableCodeValidationComponent } from './components/table-code-validation/table-code-validation';
import { tableValidatedGuard } from './guards/table-validated-guard';
import { TableStatusDashboardComponent } from './components/table-status-dashboard/table-status-dashboard';
// --- NUEVA IMPORTACIÓN ---
import { ShoppingCartComponent } from './components/shopping-cart/shopping-cart';

export const routes: Routes = [
  {
    path: '', // Ruta raíz sigue siendo la validación de código
    component: TableCodeValidationComponent,
    title: 'Validar Mesa - MesaFácil'
  },
  {
    path: 'products', // Ruta para el catálogo de productos
    component: ProductListComponent,
    canActivate: [tableValidatedGuard], // Protegida
    title: 'Catálogo de Productos - MesaFácil'
  },
  {
    path: 'tables-status', // Ruta para el dashboard de estado de mesas
    component: TableStatusDashboardComponent,
    title: 'Estado de Mesas - MesaFácil'
    // Esta es pública
  },
  // --- NUEVA RUTA ---
  {
    path: 'cart', // Ruta para el carrito de compras
    component: ShoppingCartComponent,
    canActivate: [tableValidatedGuard], // También protegida, necesitas mesa validada
    title: 'Carrito de Compras - MesaFácil'
  },
  // --- FIN NUEVA RUTA ---
  // Considera añadir una redirección para rutas no encontradas al final:
  // { path: '**', redirectTo: '', pathMatch: 'full' } // O a una página 404 si la creas
];