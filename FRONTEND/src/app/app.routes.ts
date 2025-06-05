import { Routes } from '@angular/router';
import { ProductListComponent } from './components/product-list/product-list';
import { TableCodeValidationComponent } from './components/table-code-validation/table-code-validation';
import { tableValidatedGuard } from './guards/table-validated-guard';
import { TableStatusDashboardComponent } from './components/table-status-dashboard/table-status-dashboard';
import { ShoppingCartComponent } from './components/shopping-cart/shopping-cart';
// --- NUEVA IMPORTACIÓN DEL GUARDIA ---
import { OrderStatusComponent } from './components/order-status/order-status'; // <-- NUEVA IMPORTACIÓN
import { tableNotValidatedGuard } from './guards/table-not-validated-guard';

export const routes: Routes = [
  {
    path: '',
    component: TableCodeValidationComponent,
    canActivate: [tableNotValidatedGuard], // <-- APLICAR EL NUEVO GUARDIA AQUÍ
    title: 'Validar Mesa - MesaFácil'
  },
  {
    path: 'products',
    component: ProductListComponent,
    canActivate: [tableValidatedGuard],
    title: 'Catálogo de Productos - MesaFácil'
  },
  {
    path: 'tables-status',
    component: TableStatusDashboardComponent,
    title: 'Estado de Mesas - MesaFácil'
  },
  {
    path: 'cart',
    component: ShoppingCartComponent,
    canActivate: [tableValidatedGuard],
    title: 'Carrito de Compras - MesaFácil'
  },
  {
    path: 'order-status', // <-- CAMBIO: Quitar el /:id
    component: OrderStatusComponent,
    title: 'Estado de tu Pedido - MesaFácil'
  },
];