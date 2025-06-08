// FRONTEND/src/app/services/user.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interfaz para un usuario existente
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean; // Campo clave para saber el rol
}

// Interfaz para crear un nuevo usuario (incluye la contraseña)
export type UserCreatePayload = Omit<User, 'id'> & { password?: string };

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://darcia2.pythonanywhere.com/api/v1/users/';

  constructor(private http: HttpClient) { }

  // Obtener datos del usuario logueado
  getMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}me/`).pipe(catchError(this.handleError));
  }

  // Obtener todos los usuarios
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl).pipe(catchError(this.handleError));
  }

  // Crear un nuevo usuario
  createUser(payload: UserCreatePayload): Observable<User> {
    return this.http.post<User>(this.apiUrl, payload).pipe(catchError(this.handleError));
  }

  // Actualizar un usuario
  updateUser(id: number, payload: Partial<UserCreatePayload>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}${id}/`, payload).pipe(catchError(this.handleError));
  }

  // Eliminar un usuario
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}${id}/`).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    // Aquí puedes personalizar más el manejo de errores si lo deseas
    return throwError(() => new Error('Algo salió mal; por favor, inténtalo de nuevo más tarde.'));
  }
}