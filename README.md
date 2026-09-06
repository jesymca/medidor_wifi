# ⚡ Medidor de Potencia WiFi JH (Hacker Cyberpunk Edition)

[![Venezuela](https://img.shields.io/badge/HECHO_EN-VENEZUELA-00247D?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA5MDAgNjAwIj48cGF0aCBmaWxsPSIjRkNEMTExIiBkPSJNMCAwaDkwMHYyMDBIMHoiLz48cGF0aCBmaWxsPSIjMDAyNDdEIiBkPSJNMCAyMDBoOTAwdjIwMEgweiIvPjxwYXRoIGZpbGw9IiNDRjE0MkIiIGQ9Ik0wIDQwMGg5MDB2MjAwSDB6Ii8+PC9zdmc+)](#)
[![Versión](https://img.shields.io/badge/VERSION-v2.5_HACKER-00ff41?style=for-the-badge)](#)
[![APK Disponibilidad](https://img.shields.io/badge/APK-DISPONIBLE-00e5ff?style=for-the-badge)](#)

Una herramienta avanzada y estilizada para el análisis de potencia de señal WiFi en tiempo real, rastreo direccional de antenas y optimización de ubicación de repetidores WiFi en hogares y oficinas.

> 🇻🇪 **CREADO EN VENEZUELA** por **Jose Herrera**  
> 📧 **Contacto**: [herrejose@gmail.com](mailto:herrejose@gmail.com)  
> 🌐 **Sitio Web Base**: [https://jesymca.github.io/](https://jesymca.github.io/)

---

## 📦 Archivo APK Instalable Disponible

El ejecutable listo para instalar en cualquier dispositivo Android se encuentra disponible en la raíz del repositorio:

📥 **[Descargar Medidor_de_Potencia_WiFi_JH.apk](./Medidor_de_Potencia_WiFi_JH.apk)**  
*(Tamaño aproximado: ~3.7 MB | Soporta Android 5.0 Lollipop en adelante)*

---

## 🔥 Características Principales

- **📊 Medición Ultra Fluida (1% en 1%)**: Motor de micro-interpolación continua a 60 FPS que convierte la lectura de potencia en dBm (`-100 dBm` a `-30 dBm`) a incrementos exactos de 1% sin saltos bruscos.
- **📈 Osciloscopio en Tiempo Real**: Lienzo gráfico Cyberpunk que representa el historial de estabilidad de la señal, calculando el pico máximo y el promedio en tiempo real.
- **🧭 Brújula Ubicadora de Antena & Radar 360°**: Mapea la señal respecto a la orientación de tu teléfono (brújula/magnetómetro) y apunta con una flecha neón directamente hacia el sector donde se encuentra el router o punto de acceso WiFi.
- **📍 Evaluador de Ubicación de Repetidor (Sweet-Spot Advisor)**:
  - 🔴 **Zona Muerta (< 30%)**: Señal insuficiente.
  - 🟠 **Zona Aceptable (30% - 54%)**: Calidad moderada.
  - 🟢 **¡Zona Óptima para Repetidor! (55% - 74%)**: *Punto Dulce*. Máxima velocidad de enlace para retransmitir señal a zonas ciegas.
  - 🔵 **Demasiado Cerca del Router (≥ 75%)**: Recomienda alejarse un poco más.
- **🔊 Contador Geiger Audio Synthesizer**: Generador de efectos de audio con clicks cuya velocidad aumenta automáticamente conforme te aproximas a la fuente WiFi.
- **🌧️ Estética Cyberpunk Matrix Rain**: Fondo interactivo de código Matrix cayendo en pantalla, con paleta neón verde/cian.

---

## 🛡️ Guía de Instalación del APK y Gestión de Alertas de Android

### ¿Por qué Android muestra una alerta durante la instalación?
Cuando instalas un archivo `.apk` directamente descargado fuera de la tienda oficial **Google Play Store**, Android activa por seguridad dos mecanismos de advertencia:
1. **Instalar aplicaciones desconocidas**: El gestor de archivos o navegador te pedirá permiso para instalar archivos externos.
2. **Google Play Protect**: Al ser una aplicación propia/personalizada sin firmar con un certificado comercial registrado en Google Play, Play Protect dirá *"Aplicación no reconocida"* o *"Desarrollador desconocido"*. Esto es un comportamiento normal en cualquier APK descargada externamente.

### 📲 Cómo instalar sin bloqueos (Paso a Paso):

1. **Copiar el APK**: Copia el archivo `Medidor_de_Potencia_WiFi_JH.apk` a la memoria interna de tu celular.
2. **Abrir el instalador**: Toca el archivo desde tu gestor de archivos o navegador.
3. **Conceder permiso de fuentes desconocidas**: Si Android te muestra una pantalla emergente diciendo *"Por seguridad, tu teléfono no tiene permitido instalar apps desconocidas de esta fuente"*, toca **Ajustes** y activa la casilla **"Autorizar desde esta fuente"**.
4. **Respuesta ante Google Play Protect**:
   - Si aparece la pantalla flotante de Play Protect indicando *"Bloqueada por Play Protect"* o *"App de desarrollador no verificado"*:
   - Toca en la opción **"Más detalles"** (o *"Detalles"*).
   - Toca el botón **"Instalar de todos modos (no seguro)"**.
5. **Permisos de la App**: Al abrir la app por primera vez, concédele permiso de **Ubicación/Location** (Android exige este permiso para permitir que las apps lean los datos de las redes WiFi locales y el estado del sensor de la brújula).

---

## 🛠️ Estructura del Proyecto y Compilación

Si deseas modificar el código fuente o reconstruir la aplicación:

```text
medidor_wifi/
├── config.xml             # Configuración del paquete Cordova y permisos de Android
├── index.html             # Interfaz Cyber HUD y canvas de gráficos
├── css/style.css          # Estilos Cyberpunk neón y animaciones Matrix
├── js/app.js              # Lógica de 1% de precisión, radar 360° y sintetizador de audio
├── www/                   # Carpeta compilada de assets
└── Medidor_de_Potencia_WiFi_JH.apk  # Paquete instalable para Android
```

### Requisitos para Compilar:
- Node.js & npm
- Apache Cordova CLI (`npm install -g cordova`)
- Android SDK (API Level 34) & OpenJDK 17

### Comandos de Compilación:
```bash
# Instalar dependencias y plataforma Android
cordova platform add android

# Instalar plugins requeridos
cordova plugin add https://github.com/tripflex/wifiwizard2.git cordova-plugin-device-orientation cordova-plugin-geolocation cordova-plugin-android-permissions

# Sincronizar archivos y compilar APK
cp -r index.html css js www/
unset ANDROID_SDK_ROOT && export ANDROID_HOME=$HOME/Android/Sdk
cordova build android
```

---

## 👨‍💻 Autor

Desarrollado con orgullo en **Venezuela 🇻🇪**  
**Jose Herrera**  
- Email: [herrejose@gmail.com](mailto:herrejose@gmail.com)  
- Sitio Web: [https://jesymca.github.io/](https://jesymca.github.io/)

*Medidor de Potencia WiFi JH v2.5 - Todos los derechos reservados.*
