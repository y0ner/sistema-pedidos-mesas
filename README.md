# 🍽️ MesaFácil — Sistema Web para Pedidos y Gestión de Mesas

**Transforma la experiencia gastronómica con tecnología inteligente.**

MesaFácil es una plataforma web responsiva pensada para locales comerciales como restaurantes y cafeterías que buscan modernizar su atención al cliente sin perder el toque humano. El sistema permite a los comensales realizar pedidos desde su móvil y a los administradores gestionar el negocio con eficiencia.

---

## 🚀 Características Destacadas

### 🧑‍🍳 Para el Cliente
- Escanea un código QR y accede sin registrarte.
- Visualiza el menú y promociones en tiempo real.
- Revisa disponibilidad de mesas y elige con un código dinámico.
- Realiza y edita pedidos desde tu propio dispositivo.
- ¡Sin esperar al mesero para comenzar tu experiencia!

### 👨‍💼 Para el Administrador
- Panel de gestión completo: productos, promociones, pedidos y mesas.
- Control en tiempo real de pedidos y ocupación de mesas.
- Modo pantalla/TV para mostrar códigos dinámicos.
- Seguridad, control y eficiencia en una sola vista.

---

## 🧠 Flujo General del Sistema

1. El cliente accede a la web escaneando un QR.
2. Visualiza el menú y selecciona una mesa mediante código.
3. Realiza un pedido → se crea una **sesión temporal**.
4. El mesero verifica y valida el pedido.
5. El administrador gestiona y finaliza el proceso.
6. La mesa se libera automáticamente o manualmente.

---

## 🛠️ Tecnologías Utilizadas

| Componente      | Tecnología             |
|-----------------|------------------------|
| Frontend        | Angular + Tailwind CSS |
| Backend         | Django + DRF           |
| Base de Datos   | MySQL (migrado desde PostgreSQL) |
| Autenticación   | JWT (JSON Web Tokens)  |
| Despliegue      | Railway / Docker       |

---

## 📦 Estructura de Datos Principal

- **Usuarios**: Cliente y administrador diferenciados por rol.
- **Productos & Promociones**: Gestión flexible y visual.
- **Mesas**: Estado, código dinámico, disponibilidad.
- **Pedidos**: Relacionados con mesas y detalles de productos.

---

## 🛡️ Seguridad y Buenas Prácticas

- Accesos y permisos diferenciados (admin/cliente).
- Protección de rutas y sesiones.
- Códigos de mesa únicos, dinámicos y de corta duración.
- Validaciones robustas en el backend.

---

## ✨ Futuras Mejoras

- 📍 Verificación por geolocalización.
- 📊 Reportes y estadísticas.
- 🌍 Multilenguaje.
- 🏪 Multisucursal.
- 📱 Aplicación nativa.
- 🛍️ Pedido para llevar.
- 💳 Integración con pasarelas de pago.

---

## 💡 Conclusión

MesaFácil es más que una app para pedidos: es una solución pensada para locales que quieren crecer con tecnología sin perder su esencia. El sistema mejora la experiencia del cliente y optimiza los procesos internos del negocio.

> "El futuro del servicio en mesa está en tus manos... o mejor dicho, en el móvil del cliente."

---

## 📚 Documentación

Consulta el [Documento Técnico del Proyecto](./Documento%20Técnico%20del%20Proyecto.pdf) para más detalles sobre la lógica del sistema, requisitos funcionales y no funcionales.

---

## 🧑‍💻 Autor

Desarrollado con pasión por **Yoner**  
💬 _“Elegí MySQL por su sencillez y eficiencia para este tipo de soluciones.”_

---

## ⚙️ Instalación y Uso (próximamente)
_Agrega aquí instrucciones cuando el proyecto esté listo para producción._

---

## 📬 Contacto

¿Ideas? ¿Colaboraciones? ¡Estoy abierto a contribuciones!  
Escríbeme vía GitHub Issues o Pull Requests.

