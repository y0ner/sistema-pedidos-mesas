import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// Asegúrate que la ruta al componente sea correcta según tu estructura de carpetas
import { ProductListComponent } from './components/product-list/product-list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ProductListComponent // <--- AÑADE ESTO
  ],
  templateUrl: './app.html',
  styleUrl: './app.css' // o styleUrls si es un array
})
export class App {
  protected title = 'MesaFácil'; // Cambiado para reflejar el nombre del proyecto
}