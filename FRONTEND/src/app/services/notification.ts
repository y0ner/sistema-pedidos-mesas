import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id?: number; // ID único para poder gestionar múltiples notificaciones o cerrarlas
  message: string;
  type: NotificationType;
  duration?: number; // Duración en ms. Si no se provee, no se auto-cierra o usa default.
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // Usamos un BehaviorSubject para que el NotificationComponent pueda suscribirse
  // y reaccionar a nuevas notificaciones. Emitirá la última notificación o null si no hay.
  private notificationSubject = new BehaviorSubject<Notification | null>(null);
  
  // Observable público para que los componentes (el NotificationComponent) se suscriban.
  public notification$: Observable<Notification | null> = this.notificationSubject.asObservable();

  private nextId = 0; // Para generar IDs únicos para las notificaciones

  constructor() { }

  private show(message: string, type: NotificationType, duration?: number): void {
    this.nextId++;
    this.notificationSubject.next({
      id: this.nextId,
      message,
      type,
      duration
    });
  }

  /**
   * Muestra una notificación de éxito.
   * @param message El mensaje a mostrar.
   * @param duration Duración opcional en milisegundos para que se oculte automáticamente.
   */
  showSuccess(message: string, duration: number = 3000): void {
    this.show(message, 'success', duration);
  }

  /**
   * Muestra una notificación de error.
   * @param message El mensaje a mostrar.
   * @param duration Duración opcional en milisegundos. Los errores podrían no auto-cerrarse.
   */
  showError(message: string, duration?: number): void {
    this.show(message, 'error', duration); // Por defecto, los errores podrían requerir cierre manual
  }

  /**
   * Muestra una notificación informativa.
   * @param message El mensaje a mostrar.
   * @param duration Duración opcional en milisegundos.
   */
  showInfo(message: string, duration: number = 3000): void {
    this.show(message, 'info', duration);
  }

  /**
   * Muestra una notificación de advertencia.
   * @param message El mensaje a mostrar.
   * @param duration Duración opcional en milisegundos.
   */
  showWarning(message: string, duration: number = 5000): void {
    this.show(message, 'warning', duration);
  }

  /**
   * Limpia la notificación actual.
   * El NotificationComponent podría llamar a esto, o manejar el cierre por su cuenta.
   * Si queremos manejar múltiples notificaciones, esto necesitaría más lógica (ej. clearById).
   */
  clearNotification(): void {
    this.notificationSubject.next(null);
  }
}