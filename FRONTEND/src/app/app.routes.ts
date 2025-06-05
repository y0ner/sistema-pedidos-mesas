import { Routes } from '@angular/router';
import { ProductListComponent } from './components/product-list/product-list';
import { TableCodeValidationComponent } from './components/table-code-validation/table-code-validation';
import { tableValidatedGuard } from './guards/table-validated-guard';
import { TableStatusDashboardComponent } from './components/table-status-dashboard/table-status-dashboard';
import { ShoppingCartComponent } from './components/shopping-cart/shopping-cart';
import { OrderStatusComponent } from './components/order-status/order-status';
import { tableNotValidatedGuard } from './guards/table-not-validated-guard';
import { authGuard } from './guards/auth-guard'; // Importar el nuevo AuthGuard
import { DashboardComponent } from './components/staff/dashboard/dashboard'; // Importar el nuevo Dashboard
// --- NUEVA IMPORTACIÓN ---
import { LoginComponent } from './components/login/login';

export const routes: Routes = [

// --- NUEVA RUTA PROTEGIDA PARA EL PERSONAL ---
  {
    path: 'staff/dashboard',
    component: DashboardComponent,
    canActivate: [authGuard], // <-- ¡AQUÍ SE APLICA EL GUARDIA!
    title: 'Dashboard - Personal'
  },

  {
    path: '',
    component: TableCodeValidationComponent,
    canActivate: [tableNotValidatedGuard],
    title: 'Validar Mesa - MesaFácil'
  },
  // --- NUEVA RUTA PARA EL LOGIN ---
  {
    path: 'login',
    component: LoginComponent,
    title: 'Inicio de Sesión - Personal'
  },
  // --- FIN NUEVA RUTA ---
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
    path: 'order-status',
    component: OrderStatusComponent,
    title: 'Estado de tu Pedido - MesaFácil'
  },
];