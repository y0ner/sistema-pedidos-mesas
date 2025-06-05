import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Notification, NotificationService } from '../../services/notification'; // Importamos el servicio y las interfaces

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.html',
  styleUrls: ['./notification.css']
})
export class NotificationComponent implements OnInit, OnDestroy {
  currentNotification: Notification | null = null;
  private notificationSubscription?: Subscription;
  private timeoutId: any;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationSubscription = this.notificationService.notification$
      .subscribe(notification => {
        this.currentNotification = notification;
        if (notification) {
          // Si hay una notificación y tiene una duración, programar su cierre
          if (this.timeoutId) {
            clearTimeout(this.timeoutId); // Limpiar timeout anterior si existe
          }
          if (notification.duration) {
            this.timeoutId = setTimeout(() => {
              this.closeNotification();
            }, notification.duration);
          }
        }
      });
  }

  closeNotification(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.notificationService.clearNotification(); // Esto hará que el BehaviorSubject emita null
    this.currentNotification = null; // Aseguramos que se oculte inmediatamente en la UI
  }

  // Para obtener clases CSS dinámicas basadas en el tipo de notificación
  getNotificationClass(notification: Notification | null): string {
    if (!notification) return '';
    return `notification notification-${notification.type}`;
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