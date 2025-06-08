import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User, UserService, UserCreatePayload } from '../../../services/user';
import { NotificationService } from '../../../services/notification';
import { LoadingSpinnerComponent } from '../../loading-spinner/loading-spinner';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.css']
})
export class UserManagementComponent implements OnInit {
  
  users: User[] = [];
  isLoading = false;
  
  // Para saber si el usuario logueado es admin
  currentUser: User | null = null;
  
  // --- Propiedades para el Modal ---
  isModalVisible = false;
  isEditMode = false;
  selectedUser: Partial<User & { password?: string }> = {};

  constructor(
    private userService: UserService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadUsers();
  }

  loadCurrentUser(): void {
    this.userService.getMe().subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (err) => {
        this.notificationService.showError('No se pudieron cargar los datos del usuario actual.');
      }
    });
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.notificationService.showError(err.message || 'Error al cargar los usuarios.');
      }
    });
  }

  openCreateModal(): void {
    this.resetForm();
    this.isEditMode = false;
    this.isModalVisible = true;
  }

  openEditModal(user: User): void {
    this.resetForm();
    this.isEditMode = true;
    this.selectedUser = { ...user }; // Clonamos el usuario para editarlo
    this.isModalVisible = true;
  }

  closeModal(): void {
    this.isModalVisible = false;
  }

  saveUser(): void {
    this.isLoading = true;

    // Preparamos el payload
    const payload: Partial<UserCreatePayload> = {
      username: this.selectedUser.username,
      email: this.selectedUser.email,
      first_name: this.selectedUser.first_name,
      last_name: this.selectedUser.last_name,
      is_staff: this.selectedUser.is_staff,
      is_superuser: this.selectedUser.is_superuser
    };
    
    // Solo añadimos la contraseña si no estamos en modo edición o si se ha escrito una nueva
    if (!this.isEditMode || (this.selectedUser.password && this.selectedUser.password.trim() !== '')) {
        payload.password = this.selectedUser.password;
    }

    const operation = this.isEditMode
      ? this.userService.updateUser(this.selectedUser.id!, payload)
      : this.userService.createUser(payload as UserCreatePayload);

    operation.subscribe({
      next: () => {
        const message = this.isEditMode ? 'Usuario actualizado' : 'Usuario creado';
        this.notificationService.showSuccess(`${message} con éxito.`);
        this.loadUsers();
        this.closeModal();
      },
      error: (err) => {
        this.notificationService.showError(err.message || 'Ocurrió un error al guardar el usuario.');
        this.isLoading = false;
      }
    });
  }
  
  deleteUser(userId: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar a este usuario? Esta acción es irreversible.')) {
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          this.notificationService.showSuccess('Usuario eliminado con éxito.');
          this.loadUsers();
        },
        error: (err) => this.notificationService.showError(err.message || 'Error al eliminar el usuario.')
      });
    }
  }

  private resetForm(): void {
    this.selectedUser = {
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      is_staff: true, // Por defecto, un nuevo usuario es empleado
      is_superuser: false
    };
    this.isLoading = false;
  }
}