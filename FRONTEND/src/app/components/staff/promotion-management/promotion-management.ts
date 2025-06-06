import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Promotion, PromotionService } from '../../../services/promotion';
import { NotificationService } from '../../../services/notification';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';

@Component({
  selector: 'app-promotion-management',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, LoadingSpinnerComponent],
  templateUrl: './promotion-management.html',
  styleUrls: ['./promotion-management.css']
})
export class PromotionManagementComponent implements OnInit {

  promotions: Promotion[] = [];
  isLoading = false;

  // --- Propiedades para el Modal ---
  isModalVisible = false;
  isEditMode = false;
  selectedPromotion: Partial<Promotion> = {};

  constructor(
    private promotionService: PromotionService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadPromotions();
  }

  loadPromotions(): void {
    this.isLoading = true;
    this.promotionService.getPromotions().subscribe({
      next: (data) => {
        this.promotions = data;
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

  openEditModal(promo: Promotion): void {
    this.isEditMode = true;
    this.selectedPromotion = { 
        ...promo,
        start_date: this.formatDateTimeForInput(promo.start_date),
        end_date: this.formatDateTimeForInput(promo.end_date)
    };
    this.isModalVisible = true;
  }

  closeModal(): void {
    this.isModalVisible = false;
  }

  savePromotion(): void {
    if (!this.selectedPromotion.title || !this.selectedPromotion.start_date || !this.selectedPromotion.end_date) {
        this.notificationService.showError('Todos los campos son obligatorios.');
        return;
    }
      
    this.isLoading = true;
      
    const promotionData = {
        ...this.selectedPromotion,
        start_date: new Date(this.selectedPromotion.start_date).toISOString(),
        end_date: new Date(this.selectedPromotion.end_date).toISOString(),
    };

    const operation = this.isEditMode
      ? this.promotionService.updatePromotion(this.selectedPromotion.id!, promotionData)
      : this.promotionService.createPromotion(promotionData as Promotion);

    operation.subscribe({
      next: () => {
        const message = this.isEditMode ? 'Promoción actualizada' : 'Promoción creada';
        this.notificationService.showSuccess(`${message} correctamente.`);
        this.loadPromotions();
        this.closeModal();
      },
      error: (err) => {
        this.notificationService.showError(err.message);
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
  
  deletePromotion(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta promoción?')) {
      this.promotionService.deletePromotion(id).subscribe({
        next: () => {
          this.notificationService.showSuccess('Promoción eliminada correctamente.');
          this.loadPromotions();
        },
        error: (err) => this.notificationService.showError(err.message)
      });
    }
  }

  private resetForm(): void {
    this.selectedPromotion = {
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      is_active: true
    };
    this.isEditMode = false;
    this.isLoading = false;
  }
  
  private formatDateTimeForInput(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - timezoneOffset);
    return localDate.toISOString().slice(0, 16);
  }
}