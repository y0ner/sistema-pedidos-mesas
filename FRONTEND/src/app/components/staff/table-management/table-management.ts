import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableService } from '../../../services/table';
import { NotificationService } from '../../../services/notification';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';

@Component({
  selector: 'app-table-management',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  templateUrl: './table-management.html',
  styleUrls: ['./table-management.css']
})
export class TableManagementComponent implements OnInit {

  tables: Table[] = [];
  isLoading = false;
  
  // --- Propiedades para el Modal ---
  isModalVisible = false;
  isEditMode = false;
  selectedTable: Partial<Table> = {};

  statusChoices = [
    { value: 'available', label: 'Disponible' },
    { value: 'occupied', label: 'Ocupada' },
    { value: 'reserved', label: 'Reservada' },
    { value: 'unavailable', label: 'No disponible' }
  ];

  constructor(
    private tableService: TableService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadTables();
  }

  loadTables(): void {
    this.isLoading = true;
    this.tableService.getAllTables().subscribe({
      next: (data) => {
        this.tables = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.notificationService.showError(err.message);
        this.isLoading = false;
      }
    });
  }

  // --- Métodos para el Modal ---

  openCreateModal(): void {
    this.resetForm();
    this.isEditMode = false;
    this.isModalVisible = true;
  }

  openEditModal(table: Table): void {
    this.isEditMode = true;
    this.selectedTable = { ...table };
    this.isModalVisible = true;
  }

  closeModal(): void {
    this.isModalVisible = false;
  }

  saveTable(): void {
    if (!this.selectedTable.number || !this.selectedTable.status) {
      this.notificationService.showError('El número y el estado de la mesa son obligatorios.');
      return;
    }

    this.isLoading = true;
    const tableData = {
      number: this.selectedTable.number,
      status: this.selectedTable.status
    };

    const operation = this.isEditMode
      ? this.tableService.updateTable(this.selectedTable.id!, tableData)
      : this.tableService.createTable(tableData);

    operation.subscribe({
      next: () => {
        const message = this.isEditMode ? 'Mesa actualizada' : 'Mesa creada';
        this.notificationService.showSuccess(`${message} correctamente.`);
        this.loadTables();
        this.closeModal();
      },
      error: (err) => {
        this.notificationService.showError(err.message);
        this.isLoading = false;
      }
    });
  }

  private resetForm(): void {
    this.selectedTable = {
      number: undefined,
      status: 'available'
    };
    this.isLoading = false;
  }

  // --- Otros Métodos (sin cambios) ---

  getStatusLabel(statusValue: string): string {
    return this.statusChoices.find(s => s.value === statusValue)?.label || 'Desconocido';
  }

  deleteTable(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta mesa?')) {
      this.tableService.deleteTable(id).subscribe({
        next: () => {
          this.notificationService.showSuccess('Mesa eliminada correctamente.');
          this.loadTables();
        },
        error: (err) => this.notificationService.showError(err.message)
      });
    }
  }
  
  generateCode(id: number): void {
    // Para que no interfiera con el loading del formulario
    const generatingCode = true; 
    this.tableService.generateCodeForTable(id).subscribe({
      next: (updatedTable) => {
        this.notificationService.showSuccess(`Código ${updatedTable.current_code} generado para la mesa ${updatedTable.number}.`);
        this.loadTables();
      },
      error: (err) => this.notificationService.showError(err.message)
    });
  }
}