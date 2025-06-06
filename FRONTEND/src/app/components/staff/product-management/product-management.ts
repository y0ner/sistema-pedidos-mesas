import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product, ProductService } from '../../../services/product';
import { NotificationService } from '../../../services/notification';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';

@Component({
  selector: 'app-product-management',
  standalone: true,
  // Ya no importamos un componente modal separado
  imports: [CommonModule, CurrencyPipe, FormsModule, LoadingSpinnerComponent],
  templateUrl: './product-management.html',
  styleUrls: ['./product-management.css']
})
export class ProductManagementComponent implements OnInit {

  products: Product[] = [];
  isLoading = false;
  
  // --- Propiedades para controlar el modal y el formulario ---
  isModalVisible = false;
  isEditMode = false;
  selectedProduct: Partial<Product> = {};
  selectedFile: File | null = null;
  currentImageUrl: string | null = null;

  constructor(
    private productService: ProductService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.notificationService.showError(err.message);
        this.isLoading = false;
      }
    });
  }

  // --- Métodos para el Modal y el Formulario ---

  openCreateModal(): void {
    this.resetForm(); // Limpiamos el formulario para la creación
    this.isEditMode = false;
    this.isModalVisible = true;
  }

  openEditModal(product: Product): void {
    this.isEditMode = true;
    this.selectedProduct = { ...product }; // Clonamos el producto para la edición
    if (typeof product.image === 'string') {
      this.currentImageUrl = product.image;
    }
    this.isModalVisible = true;
  }
  
  closeModal(): void {
    this.isModalVisible = false;
    this.resetForm();
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      this.selectedFile = element.files[0];
      this.currentImageUrl = null; // Si se selecciona un nuevo archivo, ocultamos la imagen previa
    }
  }

  saveProduct(): void {
    this.isLoading = true;
    const formData = new FormData();
    
    if (this.selectedProduct.name) formData.append('name', this.selectedProduct.name);
    if (this.selectedProduct.price != null) formData.append('price', this.selectedProduct.price.toString());
    if (this.selectedProduct.description) formData.append('description', this.selectedProduct.description);
    if (this.selectedProduct.availability != null) formData.append('availability', String(this.selectedProduct.availability));
    
    if (this.selectedFile) {
        formData.append('image', this.selectedFile, this.selectedFile.name);
    }

    const operation = this.isEditMode
      ? this.productService.updateProduct(this.selectedProduct.id!, formData)
      : this.productService.createProduct(formData);

    operation.subscribe({
      next: () => {
        const message = this.isEditMode ? 'Producto actualizado' : 'Producto creado';
        this.notificationService.showSuccess(`${message} correctamente.`);
        this.loadProducts();
        this.closeModal();
      },
      error: (err) => {
        this.notificationService.showError(err.message);
        this.isLoading = false; // Mantenemos el modal abierto en caso de error
      }
    });
  }

  deleteProduct(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.notificationService.showSuccess('Producto eliminado correctamente.');
          this.loadProducts();
        },
        error: (err) => this.notificationService.showError(err.message)
      });
    }
  }

  private resetForm(): void {
    this.selectedProduct = {
      name: '',
      description: '',
      price: 0,
      availability: true
    };
    this.selectedFile = null;
    this.currentImageUrl = null;
    this.isLoading = false; // Asegurarse de que el loading se apague
  }
}