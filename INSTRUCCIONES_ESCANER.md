# 📱 Instrucciones para Usar el Escáner de Código de Barras

## 🎯 Métodos Soportados

### 1. **Pistola Lectora USB** (Recomendado)
Las pistolas lectoras USB funcionan como un teclado virtual. Al escanear, envían el código seguido de Enter automáticamente.

#### Pasos:
1. **Conecta la pistola lectora** a un puerto USB de tu computadora
2. **Abre la página de "Entradas y Salidas"**
3. **Selecciona "Entrada"** como tipo de movimiento
4. **Haz clic en "Escanear con lector"** (botón naranja con icono de escáner)
5. **Apunta la pistola** al código de barras del medicamento
6. **Presiona el gatillo** de la pistola
7. El código se capturará automáticamente y buscará el medicamento en la base de datos
8. Si el medicamento existe, se llenarán automáticamente los campos: Nombre, Unidad, Dosis
9. Completa manualmente: **Cantidad** y **Fecha de caducidad**
10. Haz clic en **"Agregar"**

#### Características:
- ✅ Funciona automáticamente sin configuración adicional
- ✅ Detecta el código al instante
- ✅ Mueve el foco al siguiente campo automáticamente
- ✅ Busca el medicamento en la base de datos automáticamente

---

### 2. **Aplicación Móvil por USB** (Android/iOS)

Para usar una app móvil como escáner, necesitas configurarla como "teclado virtual" o usar una app que simule entrada de teclado.

#### Opción A: App que funciona como teclado (Android)

**Apps recomendadas:**
- **"Barcode Scanner"** (Zxing) - Configura como teclado virtual
- **"QR & Barcode Scanner"** - Tiene opción de teclado virtual
- **"Barcode to PC"** - Conecta por USB/WiFi y envía como teclado

#### Pasos:
1. **Instala la app** en tu teléfono
2. **Conecta el teléfono** a la computadora por USB
3. **Habilita "Depuración USB"** en tu teléfono (Android)
4. **Configura la app** para funcionar como teclado virtual
5. En la página web, **haz clic en "Escanear con lector"**
6. **Abre la app** en tu teléfono y escanea el código
7. El código se enviará automáticamente a la página web

#### Opción B: App con conexión USB (Barcode to PC)

1. **Instala "Barcode to PC"** en tu teléfono y computadora
2. **Conecta por USB** o WiFi
3. **Configura la app** para enviar códigos como entrada de teclado
4. Sigue los mismos pasos que con la pistola USB

---

## 🔧 Configuración del Sistema

### Para Pistolas USB:
- **No requiere configuración** - Funciona plug & play
- Windows/Mac/Linux reconocen automáticamente el dispositivo como teclado

### Para Apps Móviles:
- **Android:** Necesitas habilitar "Depuración USB" en Opciones de Desarrollador
- **iOS:** Requiere apps específicas que soporten conexión USB (más limitado)

---

## 💡 Consejos y Solución de Problemas

### Problema: El código no se captura
**Solución:**
- Asegúrate de haber hecho clic en "Escanear con lector" primero
- Verifica que el input oculto tenga el foco (debería verse un mensaje "Modo escaneo activo")
- Prueba escanear directamente en el campo visible de "Código de barras"

### Problema: El medicamento no se encuentra
**Solución:**
- Verifica que el código de barras esté registrado en la base de datos
- Si no existe, puedes llenar los campos manualmente
- El sistema te permitirá agregar el medicamento nuevo

### Problema: El foco no se mueve al siguiente campo
**Solución:**
- Presiona Enter manualmente después de escanear
- O haz clic en el siguiente campo manualmente

### Problema: La app móvil no funciona
**Solución:**
- Usa una app que funcione como "teclado virtual" o "HID keyboard"
- Verifica que la conexión USB esté activa
- Prueba con la pistola USB primero para verificar que el sistema funciona

---

## 🎨 Interfaz Visual

Cuando el modo escaneo está activo, verás:
- ✅ Botón cambia a "Cancelar escaneo" (naranja sólido)
- ✅ Mensaje informativo con instrucciones
- ✅ Indicador "Buscando medicamento..." cuando busca en la base de datos
- ✅ Alerta verde si el medicamento se encuentra

---

## 📝 Flujo de Trabajo Completo

1. **Entrar a "Entradas y Salidas"**
2. **Clic en "Nuevo Registro"**
3. **Seleccionar "Entrada - Abastecimiento de almacén"**
4. **Clic en "Escanear con lector"**
5. **Escanear código de barras** (pistola o app)
6. **Sistema busca automáticamente** el medicamento
7. **Si existe:** Se llenan campos automáticamente
8. **Completar:** Cantidad y Fecha de caducidad
9. **Clic en "Agregar"**
10. **Repetir** para más medicamentos o **Guardar Registro**

---

## 🔒 Seguridad

- El código de barras se valida antes de buscar en la base de datos
- Solo se buscan códigos con al menos 3 caracteres
- Si el medicamento no existe, puedes agregarlo manualmente
- Todos los cambios se guardan en la base de datos

---

## 📞 Soporte

Si tienes problemas:
1. Verifica que el dispositivo esté conectado correctamente
2. Prueba escanear directamente en el campo de texto visible
3. Revisa que el código de barras sea válido
4. Contacta al administrador del sistema si persisten los problemas



