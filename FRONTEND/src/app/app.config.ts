import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
// --- AÑADIR/MODIFICAR ESTAS IMPORTACIONES ---
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth-interceptor'; // Importar nuestro interceptor
// --- FIN IMPORTACIONES ---

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // --- MODIFICAR ESTA LÍNEA ---
    provideHttpClient(withInterceptors([authInterceptor])) // Registrar el interceptor
  ]
};