// FRONTEND/src/app/app.ts
import { Component, HostListener, OnInit, Renderer2, ElementRef } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { OrderContextService } from './services/order-context';
import { NotificationComponent } from './components/notification/notification';
import { AuthService } from './services/auth';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    NotificationComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected title = 'MesaFácil';
  public cartItemCount$: Observable<number>;
  public isStaffLoggedIn$: Observable<boolean>;
  public isMobileMenuOpen: boolean = false;

  private touchStartX: number = 0;

  constructor(
    private orderContextService: OrderContextService,
    private authService: AuthService,
    private renderer: Renderer2,
    private el: ElementRef,
    private router: Router
  ) {
    this.cartItemCount$ = this.orderContextService.getCartItemCount();
    this.isStaffLoggedIn$ = this.authService.isAuthenticated$;

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isMobileMenuOpen = false;
        this.renderer.removeClass(document.body, 'no-scroll');
        this.renderer.removeClass(this.el.nativeElement.querySelector('main'), 'blurred-content'); // Remover blur
      }
    });
  }

  ngOnInit(): void {
    // Escuchar clics en el documento para cerrar el menú si se hace clic fuera
    this.renderer.listen('document', 'click', (event) => {
      if (this.isMobileMenuOpen) {
        const mainNav = this.el.nativeElement.querySelector('.main-nav');
        const hamburgerBtn = this.el.nativeElement.querySelector('.hamburger-menu-btn');

        // Si el clic no fue dentro del menú ni del botón de hamburguesa
        if (mainNav && !mainNav.contains(event.target) && hamburgerBtn && !hamburgerBtn.contains(event.target)) {
          this.toggleMobileMenu(); // Cierra el menú
        }
      }
    });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    const mainElement = this.el.nativeElement.querySelector('main');

    if (this.isMobileMenuOpen) {
      this.renderer.addClass(document.body, 'no-scroll');
      this.renderer.addClass(mainElement, 'blurred-content'); // Aplica blur
    } else {
      this.renderer.removeClass(document.body, 'no-scroll');
      this.renderer.removeClass(mainElement, 'blurred-content'); // Remueve blur
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth > 768 && this.isMobileMenuOpen) {
      this.isMobileMenuOpen = false;
      this.renderer.removeClass(document.body, 'no-scroll');
      this.renderer.removeClass(this.el.nativeElement.querySelector('main'), 'blurred-content'); // Remover blur
    }
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (this.isMobileMenuOpen) {
      this.touchStartX = event.touches[0].clientX;
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (this.isMobileMenuOpen) {
      const touchEndX = event.changedTouches[0].clientX;
      const swipeDistance = touchEndX - this.touchStartX;

      if (swipeDistance < -50) {
        this.toggleMobileMenu(); // Llama a toggle para remover la clase blur y no-scroll
      }
    }
  }
}