import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-staff-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './staff-layout.html',
  styleUrls: ['./staff-layout.css']
})
export class StaffLayoutComponent {
  
  isStaffMenuOpen = false;

  constructor(private authService: AuthService) { }

  toggleStaffMenu(): void {
    this.isStaffMenuOpen = !this.isStaffMenuOpen;
  }

  logout(): void {
    this.authService.logout();
  }
}