// FRONTEND/src/app/components/notification/notification.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Notification, NotificationService, NotificationType } from '../../services/notification';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.html',
  styleUrls: ['./notification.css']
})
export class NotificationComponent implements OnInit, OnDestroy {
  currentNotification: Notification | null = null;
  isClosing: boolean = false; // Nuevo estado para controlar la animación de salida
  private notificationSubscription?: Subscription;
  private timeoutId: any;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationSubscription = this.notificationService.notification$
      .subscribe(notification => {
        this.isClosing = false; // Resetea el estado al recibir una nueva notificación
        this.currentNotification = notification;
        
        if (notification) {
          if (this.timeoutId) {
            clearTimeout(this.timeoutId);
          }
          if (notification.duration) {
            this.timeoutId = setTimeout(() => {
              this.closeNotification();
            }, notification.duration);
          }
        }
      });
  }

  // Método de cierre MODIFICADO para la animación
  closeNotification(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.currentNotification) {
      this.isClosing = true; // 1. Activa la animación de salida
      // 2. Espera a que la animación termine (400ms, como en el CSS) para limpiar la notificación
      setTimeout(() => {
        this.notificationService.clearNotification();
        this.isClosing = false; // Resetea para la próxima vez
      }, 400); 
    }
  }

  // Método para obtener clases CSS dinámicas
  getNotificationClass(notification: Notification | null): string {
    if (!notification) return '';
    return `notification-${notification.type}`;
  }

  // NUEVO: Método para obtener el nombre del icono según el tipo
  getIconName(type: NotificationType): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'info': return 'info';
      case 'warning': return 'warning';
      default: return 'notifications';
    }
  }

  ngOnDestroy(): void {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}