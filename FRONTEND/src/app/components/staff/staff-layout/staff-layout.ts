import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router'; // Importar RouterModule y RouterOutlet
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-staff-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet], // Añadir RouterModule y RouterOutlet
  templateUrl: './staff-layout.html',
  styleUrls: ['./staff-layout.css']
})
export class StaffLayoutComponent {

  constructor(private authService: AuthService) { }

  logout(): void {
    this.authService.logout();
  }
}