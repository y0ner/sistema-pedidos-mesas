import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Necesario para [(ngModel)]
import { Router } from '@angular/router'; // Para la navegación
import { TableService, ValidatedTableResponse } from '../../services/table'; // Importamos el servicio y la interfaz
import { OrderContextService } from '../../services/order-context'; // Importamos el servicio de contexto

@Component({
  selector: 'app-table-code-validation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule // Importamos FormsModule
  ],
  templateUrl: './table-code-validation.html',
  styleUrls: ['./table-code-validation.css']
})
export class TableCodeValidationComponent {
  tableCode: string = '';
  isLoading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private tableService: TableService,
    private orderContextService: OrderContextService,
    private router: Router
  ) {}

  onValidateCode(): void {
    // ... (código de validación del input)

    this.tableService.validateTableCode(this.tableCode).subscribe({
      next: (response: ValidatedTableResponse) => {
        this.isLoading = false;
        // --- MODIFICADO ---
        // Usamos el nuevo método para guardar tanto el ID como el número de la mesa
        this.orderContextService.setValidatedTable(response.id, response.number);
        // --- FIN MODIFICADO ---
        this.successMessage = `Mesa ${response.number} validada correctamente. Redirigiendo al catálogo...`;

        setTimeout(() => {
          this.router.navigate(['/products']);
        }, 1500);
      },
      error: (err: Error) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Error desconocido al validar el código.';
        // --- MODIFICADO ---
        this.orderContextService.clearValidatedTable(); // Usamos el método modificado para limpiar
        // --- FIN MODIFICADO ---
      }
    });
  }

  

}