# Sistema de Gestión de Asilo

Proyecto full-stack para la gestión de un asilo, con frontend en React/TypeScript y backend en Node.js/Express con SQL Server.

## 📋 Requisitos Previos

- **Node.js** (versión 16 o superior)
- **SQL Server** (Express, Developer o cualquier edición)
- **npm** o **yarn**

## 🚀 Configuración Inicial

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd proyAsilo
```

### 2. Instalar dependencias

```bash
# Instalar dependencias del frontend
npm install

# Instalar dependencias del backend
cd backend
npm install
cd ..
```

### 3. Modo Mock (Para trabajar solo en diseño/frontend) ⚡

**Si solo quieres trabajar en el diseño de la interfaz sin necesidad de base de datos:**

1. **Configurar modo mock**:
   ```bash
   cd backend
   copy config.example.env .env
   ```
   
   Edita el archivo `.env` y agrega:
   ```env
   USE_MOCK=true
   PORT=3001
   NODE_ENV=development
   ```
   
   **No necesitas configurar las variables de SQL Server** cuando usas modo mock.

2. **Iniciar el backend**:
   ```bash
   cd backend
   npm run dev
   ```

3. **Iniciar el frontend** (en otra terminal):
   ```bash
   npm start
   ```

4. **Iniciar sesión con credenciales de prueba**:
   - Email: `admin@asilo.com`
   - Contraseña: `admin123`

**¡Listo!** Ya puedes trabajar en el diseño sin necesidad de SQL Server. El backend usará datos mock en memoria.

> ⚠️ **Importante**: El modo mock solo funciona en desarrollo local. En producción (Vercel/Render) siempre se usa la base de datos real.

### 4. Configurar la Base de Datos (Para desarrollo completo)

#### Opción A: Base de Datos Local (Recomendado para desarrollo completo)

1. **Instalar SQL Server** si no lo tienes:
   - Descarga SQL Server Express (gratis): https://www.microsoft.com/sql-server/sql-server-downloads
   - O usa SQL Server Developer Edition (gratis para desarrollo)

2. **Crear la base de datos**:
   - Abre SQL Server Management Studio (SSMS)
   - Conéctate a tu instancia local
   - Ejecuta: `CREATE DATABASE AsiloDB;`

3. **Configurar variables de entorno**:
   ```bash
   cd backend
   # Copiar el archivo de ejemplo
   copy config.example.env .env
   ```
   
   Edita el archivo `.env` con tus credenciales:
   ```env
   DB_SERVER=localhost
   DB_NAME=AsiloDB
   DB_USER=sa
   DB_PASSWORD=tu_contraseña_aqui
   DB_ENCRYPT=false
   DB_TRUST_CERT=true
   PORT=3001
   NODE_ENV=development
   USE_MOCK=false  # Asegúrate de que esté en false para usar BD real
   ```

4. **Inicializar el esquema de la base de datos**:
   ```bash
   cd backend
   npm run create-fresh
   ```

5. **Crear usuario administrador** (opcional):
   ```bash
   npm run create-admin
   ```

#### Opción B: Base de Datos Compartida/Remota

Si tu equipo tiene una base de datos compartida (Azure SQL, SQL Server en servidor, etc.):

1. **Configurar variables de entorno**:
   ```bash
   cd backend
   copy config.example.env .env
   ```
   
   Edita el archivo `.env` con las credenciales de la base compartida:
   ```env
   DB_SERVER=nombre-servidor.database.windows.net  # o IP del servidor
   DB_NAME=AsiloDB
   DB_USER=usuario
   DB_PASSWORD=contraseña
   DB_ENCRYPT=true  # Para Azure SQL usar true
   DB_TRUST_CERT=false
   PORT=3001
   NODE_ENV=development
   USE_MOCK=false  # Asegúrate de que esté en false para usar BD real
   ```

2. **Verificar conexión**:
   ```bash
   npm run check-tables
   ```

## 🏃 Ejecutar el Proyecto

### Desarrollo

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm start
```

El frontend estará disponible en: http://localhost:3000
El backend estará disponible en: http://localhost:3001

### Producción

```bash
# Compilar backend
cd backend
npm run build

# Iniciar backend
npm start

# Compilar frontend (desde la raíz)
npm run build
```

## 📁 Estructura del Proyecto

```
proyAsilo/
├── backend/           # Servidor Node.js/Express
│   ├── src/
│   │   ├── database/  # Scripts y configuración de BD
│   │   ├── routes/    # Rutas de la API
│   │   ├── services/  # Lógica de negocio
│   │   └── server.ts  # Punto de entrada del servidor
│   ├── config.example.env  # Plantilla de configuración
│   └── package.json
├── src/              # Frontend React
│   ├── components/   # Componentes reutilizables
│   ├── pages/        # Páginas de la aplicación
│   ├── api/          # Cliente API
│   └── contexts/     # Contextos de React
└── package.json
```

## 🛠️ Scripts Útiles del Backend

```bash
cd backend

# Crear esquema desde cero
npm run create-fresh

# Crear usuario administrador
npm run create-admin

# Verificar tablas
npm run check-tables

# Resetear base de datos (¡CUIDADO! Elimina todos los datos)
npm run reset-db

# Verificar datos
npm run verify-data
```

## ⚠️ Notas Importantes

1. **El archivo `.env` NO debe subirse al repositorio** (ya está en `.gitignore`)
2. **Para trabajar solo en diseño**, usa `USE_MOCK=true` - no necesitas SQL Server
3. **Para desarrollo completo**, cada desarrollador necesita su propia base de datos o acceso a una compartida
4. **Para desarrollo local**, se recomienda usar SQL Server Express (gratis)
5. **Las credenciales en `config.example.env` son solo ejemplos** - usa tus propias credenciales
6. **En producción (Vercel/Render)**, el modo mock NO se activa automáticamente - siempre usa la base de datos real

## 🔧 Solución de Problemas

### Error de conexión a la base de datos
- Verifica que SQL Server esté corriendo
- Verifica las credenciales en `.env`
- Asegúrate de que la base de datos `AsiloDB` existe
- Para SQL Server local, verifica que el servicio "SQL Server (MSSQLSERVER)" esté activo

### Error al crear tablas
- Asegúrate de tener permisos suficientes en la base de datos
- Verifica que la base de datos esté vacía o ejecuta `npm run reset-db` primero

## 📝 Contribuir

1. Crea una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
2. Realiza tus cambios
3. Commit: `git commit -m "Agregar nueva funcionalidad"`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

