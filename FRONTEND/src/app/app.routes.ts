import { Routes } from '@angular/router';

// Componentes del Cliente
import { ProductListComponent } from './components/product-list/product-list';
import { TableCodeValidationComponent } from './components/table-code-validation/table-code-validation';
import { TableStatusDashboardComponent } from './components/table-status-dashboard/table-status-dashboard';
import { ShoppingCartComponent } from './components/shopping-cart/shopping-cart';
import { OrderStatusComponent } from './components/order-status/order-status';
import { LoginComponent } from './components/login/login';

// Componentes del Personal y Layout
import { StaffLayoutComponent } from './components/staff/staff-layout/staff-layout';
import { DashboardComponent } from './components/staff/dashboard/dashboard';
import { OrderManagementComponent } from './components/staff/order-management/order-management';

// Guardias
import { tableValidatedGuard } from './guards/table-validated-guard';
import { tableNotValidatedGuard } from './guards/table-not-validated-guard';
import { authGuard } from './guards/auth-guard';
export const routes: Routes = [
  // --- Rutas Públicas y del Cliente ---
  {
    path: '',
    component: TableCodeValidationComponent,
    canActivate: [tableNotValidatedGuard],
    title: 'Validar Mesa - MesaFácil'
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'Inicio de Sesión - Personal'
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
    path: 'order-status',
    component: OrderStatusComponent,
    title: 'Estado de tu Pedido - MesaFácil'
  },

  // --- NUEVA RUTA PADRE PARA EL PANEL DEL PERSONAL ---
  {
    path: 'staff',
    component: StaffLayoutComponent, // 1. Carga nuestro layout con el menú lateral
    canActivate: [authGuard],       // 2. Protege TODAS las rutas hijas con el authGuard
    children: [                     // 3. Define las rutas hijas que se mostrarán dentro del layout
      {
        path: 'dashboard', // Corresponde a /staff/dashboard
        component: DashboardComponent,
        title: 'Dashboard - Personal'
      },
      {
        path: 'orders', // Corresponde a /staff/orders
        component: OrderManagementComponent,
        title: 'Gestión de Pedidos'
      },
      {
        path: '', // Si alguien navega solo a /staff
        redirectTo: 'dashboard', // Lo redirigimos al dashboard por defecto
        pathMatch: 'full'
      }
    ]
  },
  // --- FIN DE LA RUTA PADRE ---

  // Considera añadir una ruta wildcard al final para páginas no encontradas
  // { path: '**', redirectTo: '' } 
];