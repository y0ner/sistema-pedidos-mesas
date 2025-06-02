# 🪑 Sistema de Pedidos con Validación de Mesa

Este proyecto es una aplicación web que optimiza el proceso de pedidos en un local físico, permitiendo a los clientes realizar órdenes desde su mesa mediante un sistema seguro y controlado por el administrador.

## 🚀 ¿Cómo funciona?

1. **Ingreso al local**  
   El cliente se ubica en una mesa disponible (por ejemplo, la mesa 3).

2. **Escaneo del QR**  
   En el local hay un código QR general visible que redirige al sitio web de pedidos.

3. **Visualización del catálogo**  
   Todos los usuarios pueden explorar el catálogo de productos sin iniciar sesión ni registrarse.

4. **Validación de mesa mediante código único**
   - En una pantalla (TV o monitor) se muestran códigos únicos para cada mesa, generados y controlados solo por el **administrador del sistema**.
   - El usuario mira la pantalla, identifica el código de su mesa y lo ingresa en la app.
   - El sistema valida:
     - Que el código exista.
     - Que la mesa esté disponible.
   - Si la validación es correcta:
     - El sistema marca la mesa como **ocupada**.
     - El código deja de mostrarse públicamente.
     - Se notifica al administrador que la mesa ha sido ocupada.

5. **Realización del pedido**  
   El usuario puede ahora seleccionar productos y enviar el pedido.

6. **Confirmación final**  
   Al confirmar el pedido:
   - Se registra en el sistema como **pendiente**.
   - El personal del local recibe la información para preparar y entregar el pedido.

## 🛡️ Roles del sistema

### 👤 Administrador
- Genera y actualiza los códigos de mesa.
- Controla el estado de las mesas (disponible/ocupada).
- Recibe notificaciones en tiempo real cuando un cliente ocupa una mesa o realiza un pedido.

### 🙋‍♂️ Cliente
- Escanea el QR general.
- Ingresa el código de mesa desde la pantalla.
- Realiza y confirma pedidos desde su dispositivo móvil.

## 📦 Características principales

- Validación de acceso a mesas por código único.
- Control en tiempo real del estado de cada mesa.
- Notificaciones al administrador cuando una mesa se ocupa o se recibe un pedido.
- Flujo de pedidos sin necesidad de que el cliente cree una cuenta.
- Prevención de ocupación de mesas por usuarios no autorizados.

## 🧩 Tecnologías sugeridas (para implementar)

- **Frontend:** Angular, 
- **Backend:** Python (Django),
- **Base de datos:** MySQL 
- **Comunicación en tiempo real:** WebSockets o Firebase
- **Autenticación de administrador:** JWT o sesión protegida

## 📌 Estado del proyecto

> 🛠️ En desarrollo

### Próximas funcionalidades:
- Panel del administrador
- Historial de pedidos
- Interfaz de usuario mejorada para móviles
- Soporte multi-local

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si tienes ideas para mejorar el sistema, no dudes en abrir un issue o enviar un pull request.

---

*Proyecto creado por Yoner and Dairo.*
