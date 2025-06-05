import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, catchError, switchMap } from 'rxjs';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const authToken = authService.getAccessToken();

  // Función para añadir el token a la petición
  const addToken = (request: HttpRequest<any>, token: string | null) => {
    if (token) {
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    return request;
  };

  // Añadimos el token a la petición inicial
  let apiReq = addToken(req, authToken);

  return next(apiReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Capturamos el error
      if (error.status === 401) {
        // Si es 401, intentamos refrescar el token
        return authService.refreshToken().pipe(
          switchMap((tokenResponse) => {
            console.log('Reintentando la petición original con el nuevo token.');
            // Si el refresco fue exitoso, reintentamos la petición original con el nuevo token
            apiReq = addToken(req, tokenResponse.access);
            return next(apiReq);
          }),
          catchError((refreshError) => {
            // Si el refresco falla, el AuthService ya habrá hecho logout.
            // Propagamos el error para que la petición original falle definitivamente.
            return throwError(() => refreshError);
          })
        );
      }
      // Si el error no es 401, simplemente lo propagamos.
      return throwError(() => error);
    })
  );
};