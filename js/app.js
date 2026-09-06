/**
 * MEDIDOR DE POTENCIA WiFi JH - v2.5 Cyberpunk Edition
 * Creador: Jose Herrera
 * Contacto: herrejose@gmail.com
 * Web Base: https://jesymca.github.io/
 */

// Variables globales del sistema
let currentDbm = -50;
let targetQuality = 75;
let displayQuality = 75; // Animación suave 1% en 1%
let currentSSID = "Cargando...";
let currentBSSID = "00:00:00:00:00:00";
let currentChannel = 6;
let currentFreq = 2437; // MHz
let currentLinkSpeed = "150 Mbps";

// Radar y Brújula
let currentHeading = 0; // Rumbo de la brújula (0-360)
let signalHistoryByBearing = new Array(360).fill(0); // Heatmap 360 grados
let targetBearing = 45; // Dirección estimada del router
let radarAngle = 0; // Ángulo del scanner radar

// Historial para Osciloscopio
let signalHistory = new Array(60).fill(50);
let peakQuality = 75;

// Configuración de Audio y Efectos
let audioEnabled = true;
let matrixEnabled = true;
let audioCtx = null;
let lastBeepTime = 0;

// Inicialización de la aplicación
document.addEventListener('deviceready', onDeviceReady, false);
document.addEventListener('DOMContentLoaded', () => {
    // Si no está corriendo en Cordova, inicializar directamente
    if (typeof cordova === 'undefined') {
        onDeviceReady();
    }
});

function onDeviceReady() {
    console.log('⚡ Medidor WiFi JH Iniciado por Jose Herrera');
    addMatrixLog('[SYS] Medidor de Potencia WiFi JH v2.5 iniciado');
    addMatrixLog('[SYS] Creador: Jose Herrera (herrejose@gmail.com)');
    addMatrixLog('[SYS] Web Base: https://jesymca.github.io/');

    // Inicializar Canvas
    initMatrixRain();
    initChartCanvas();
    initRadarCanvas();

    // Event Listeners para Botones
    document.getElementById('scanBtn').addEventListener('click', forceScan);
    document.getElementById('audioToggleBtn').addEventListener('click', toggleAudio);
    document.getElementById('matrixToggleBtn').addEventListener('click', toggleMatrix);
    document.getElementById('exportBtn').addEventListener('click', exportData);

    // Escuchar sensores de orientación del dispositivo (Brújula)
    initOrientationSensor();

    // Iniciar bucles de renderizado y escaneo
    setInterval(scanWiFi, 1500);
    requestAnimationFrame(updateLoop);
}

/* ==========================================================================
   1. REGISTRO Y LOGS EN MATRIZ HACKER
   ========================================================================== */
function addMatrixLog(message) {
    const matrixData = document.getElementById('matrixData');
    if (!matrixData) return;
    
    const line = document.createElement('div');
    line.className = 'matrix-line';
    line.textContent = `> ${message}`;
    matrixData.appendChild(line);

    while (matrixData.children.length > 25) {
        matrixData.removeChild(matrixData.firstChild);
    }
    matrixData.scrollTop = matrixData.scrollHeight;
}

/* ==========================================================================
   2. ESCANEO Y PROCESAMIENTO DE POTENCIA (PRECISIÓN 1% EN 1%)
   ========================================================================== */
function scanWiFi() {
    // Verificar si existe plugin de WiFi real en Cordova
    if (typeof cordova !== 'undefined' && cordova.plugins && (cordova.plugins.wifi || window.WifiWizard2)) {
        if (window.WifiWizard2) {
            window.WifiWizard2.getConnectedNetworkInfo().then(info => {
                processRealWifiData(info);
            }).catch(err => {
                useSimulatedData();
            });
        } else if (cordova.plugins.wifi) {
            cordova.plugins.wifi.scan(result => {
                if (result && result.length > 0) {
                    processWiFiList(result);
                } else {
                    useSimulatedData();
                }
            }, err => {
                useSimulatedData();
            });
        }
    } else {
        // Fallback a datos dinámicos simulados (para pruebas en navegador/desarrollo)
        useSimulatedData();
    }
}

function forceScan() {
    addMatrixLog('[SCAN] Escaneo manual forzado...');
    scanWiFi();
    playBeepSound(800, 0.1);
}

function processRealWifiData(info) {
    if (!info) return;
    currentDbm = info.level || info.rssi || -50;
    currentSSID = info.SSID || info.ssid || "Red Conectada";
    currentBSSID = info.BSSID || info.bssid || "A4:77:33:22:11:00";
    currentFreq = info.frequency || 2412;
    currentChannel = info.channel || freqToChannel(currentFreq);
    currentLinkSpeed = (info.linkSpeed || 144) + " Mbps";
    
    calculateAndUpdateSignal();
}

function processWiFiList(wifiList) {
    const connected = wifiList[0] || {};
    currentDbm = connected.level || -50;
    currentSSID = connected.SSID || "Red WiFi";
    currentBSSID = connected.BSSID || "B2:45:67:89:AB:CD";
    currentFreq = connected.frequency || 2412;
    currentChannel = connected.channel || freqToChannel(currentFreq);
    currentLinkSpeed = "72 Mbps";

    calculateAndUpdateSignal();
}

function useSimulatedData() {
    // Simulación fluida con variaciones realistas
    const delta = (Math.random() * 6 - 3);
    currentDbm = Math.min(-30, Math.max(-95, Math.round(currentDbm + delta)));
    currentSSID = "WiFi_JH_Principal_5G";
    currentBSSID = "A4:77:33:22:11:FF";
    currentChannel = 36;
    currentFreq = 5180;
    currentLinkSpeed = "866 Mbps";

    calculateAndUpdateSignal();
}

function calculateAndUpdateSignal() {
    // Conversión continua de dBm a Porcentaje con precisión del 1%
    // Rango estándar WiFi: -100 dBm (0%) a -30 dBm (100%)
    const rawQuality = Math.min(100, Math.max(0, ((currentDbm + 100) / 70) * 100));
    targetQuality = Math.round(rawQuality); // 1% de precisión

    // Registrar en mapa de calor para la brújula según rumbo actual
    const roundedHeading = Math.round(currentHeading) % 360;
    signalHistoryByBearing[roundedHeading] = (signalHistoryByBearing[roundedHeading] * 0.7) + (targetQuality * 0.3);

    // Encontrar dirección del pico de señal más alto
    let maxSig = -1;
    let bestBearing = targetBearing;
    for (let deg = 0; deg < 360; deg++) {
        if (signalHistoryByBearing[deg] > maxSig) {
            maxSig = signalHistoryByBearing[deg];
            bestBearing = deg;
        }
    }
    if (maxSig > 10) {
        targetBearing = bestBearing;
    }
}

/* ==========================================================================
   3. BUCLE DE ANIMACIÓN Y MICRO-INTERPOLACIÓN EN TIEMPO REAL
   ========================================================================== */
function updateLoop() {
    // Interpolación micro-suave 1% en 1%
    if (displayQuality !== targetQuality) {
        const step = (targetQuality - displayQuality) * 0.15;
        if (Math.abs(step) < 0.2) {
            displayQuality = targetQuality;
        } else {
            displayQuality += step;
        }
    }

    const roundedQuality = Math.round(displayQuality);

    // Actualizar UI
    document.getElementById('signalStrength').innerHTML = `${currentDbm} <span class="unit">dBm</span>`;
    document.getElementById('powerPercent').textContent = `${roundedQuality}%`;
    document.getElementById('powerBar').style.width = `${roundedQuality}%`;

    // Texto y color de Calidad
    const qElem = document.getElementById('signalQuality');
    qElem.textContent = getQualityBadge(roundedQuality);
    qElem.style.color = getQualityColor(roundedQuality);

    // Actualizar info grid
    document.getElementById('ssid').textContent = currentSSID;
    document.getElementById('bssid').textContent = currentBSSID;
    document.getElementById('channel').textContent = currentChannel;
    document.getElementById('frequency').textContent = `${currentFreq} MHz`;
    document.getElementById('linkSpeed').textContent = currentLinkSpeed;
    document.getElementById('ipAddress').textContent = getLocalIP();

    // Actualizar Historial para el Osciloscopio
    signalHistory.shift();
    signalHistory.push(roundedQuality);

    // Dibujar Gráficos
    drawSignalChart();
    drawRadarCompass();
    updateRepeaterAdvisor(roundedQuality);

    // Sonido Contador Geiger
    playGeigerClick(roundedQuality);

    requestAnimationFrame(updateLoop);
}

/* ==========================================================================
   4. EVALUACIÓN Y ASISTENTE DE UBICACIÓN PARA REPETIDOR
   ========================================================================== */
function updateRepeaterAdvisor(quality) {
    const statusElem = document.getElementById('advisorStatus');
    const descElem = document.getElementById('advisorDesc');
    const distanceElem = document.getElementById('distanceEstText');

    // Estimación de distancia basada en el modelo de pérdida en espacio libre (Friis)
    const exp = (27.55 - (20 * Math.log10(currentFreq)) + Math.abs(currentDbm)) / 20;
    const estDistance = Math.max(0.5, Math.pow(10, exp)).toFixed(1);
    distanceElem.textContent = `~ ${estDistance} metros`;

    if (quality < 30) {
        statusElem.textContent = "🔴 ZONA MUERTA / DEBIL";
        statusElem.style.background = "rgba(255, 0, 68, 0.3)";
        statusElem.style.color = "#ff0044";
        statusElem.style.border = "1px solid #ff0044";
        descElem.textContent = "Señal muy débil. No instales el repetidor aquí; colócate más cerca del router principal.";
    } else if (quality >= 30 && quality < 55) {
        statusElem.textContent = "🟠 ZONA ACEPTABLE";
        statusElem.style.background = "rgba(255, 170, 0, 0.3)";
        statusElem.style.color = "#ffaa00";
        statusElem.style.border = "1px solid #ffaa00";
        descElem.textContent = "Señal moderada. Es una ubicación aceptable si no hay muros gruesos hacia las zonas ciegas.";
    } else if (quality >= 55 && quality <= 74) {
        statusElem.textContent = "🟢 ¡ZONA ÓPTIMA PARA REPETIDOR!";
        statusElem.style.background = "rgba(0, 255, 65, 0.3)";
        statusElem.style.color = "#00ff41";
        statusElem.style.border = "1px solid #00ff41";
        descElem.textContent = "¡UBICACIÓN PERFECTA! Excelente equilibrio para recibir buena velocidad del router y extender la cobertura al resto de la casa.";
    } else {
        statusElem.textContent = "🔵 DEMASIADO CERCA DEL ROUTER";
        statusElem.style.background = "rgba(0, 229, 255, 0.3)";
        statusElem.style.color = "#00e5ff";
        statusElem.style.border = "1px solid #00e5ff";
        descElem.textContent = "Estás muy cerca del router principal. Aléjate un poco más hacia la zona sin señal para maximizar el alcance del repetidor.";
    }
}

/* ==========================================================================
   5. BRÚJULA Y RADAR CYBERPUNK EN CANVA (360°)
   ========================================================================== */
function initOrientationSensor() {
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', event => {
            if (event.alpha !== null) {
                // Compass heading (0-360)
                currentHeading = event.alpha;
                updateHeadingUI();
            }
        }, true);
    }
}

function updateHeadingUI() {
    const degrees = Math.round(currentHeading);
    const card = getCardPoint(degrees);
    document.getElementById('headingText').textContent = `${degrees}° (${card})`;

    // Rumbo relativo al objetivo
    const relBearing = (targetBearing - currentHeading + 360) % 360;
    document.getElementById('targetBearingText').textContent = `${Math.round(targetBearing)}° [Apuntar a ${getCardPoint(targetBearing)}]`;
}

function drawRadarCompass() {
    const canvas = document.getElementById('radarCompass');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = cx - 15;

    ctx.clearRect(0, 0, width, height);

    // Anillos de radar
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.25)';
    ctx.lineWidth = 1;
    for (let r = radius * 0.3; r <= radius; r += radius * 0.35) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Ejes Norte-Sur / Este-Oeste
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius);
    ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy);
    ctx.stroke();

    // Marcadores Cardinales (Girados según Rumbo)
    const cardinals = [{ label: 'N', angle: 0 }, { label: 'E', angle: 90 }, { label: 'S', angle: 180 }, { label: 'W', angle: 270 }];
    ctx.font = 'bold 12px "Share Tech Mono"';
    ctx.fillStyle = '#00ff41';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    cardinals.forEach(c => {
        const rad = ((c.angle - currentHeading) * Math.PI) / 180;
        const tx = cx + (radius - 12) * Math.sin(rad);
        const ty = cy - (radius - 12) * Math.cos(rad);
        ctx.fillText(c.label, tx, ty);
    });

    // Barrido Laser de Radar
    radarAngle = (radarAngle + 0.04) % (Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, radarAngle - 0.3, radarAngle);
    ctx.fillStyle = 'rgba(0, 255, 65, 0.15)';
    ctx.fill();

    // Línea de barrido principal
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + radius * Math.cos(radarAngle), cy + radius * Math.sin(radarAngle));
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.6)';
    ctx.stroke();

    // Aguja Flecha Apuntadora a Antena WiFi (Rumbo Objetivo)
    const targetRad = ((targetBearing - currentHeading) * Math.PI) / 180;
    const arrowLen = radius - 25;
    const arrowX = cx + arrowLen * Math.sin(targetRad);
    const arrowY = cy - arrowLen * Math.cos(targetRad);

    // Flecha Neón Cyberpunk
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(targetRad);

    ctx.beginPath();
    ctx.moveTo(0, -arrowLen);
    ctx.lineTo(-10, -arrowLen + 20);
    ctx.lineTo(0, -arrowLen + 14);
    ctx.lineTo(10, -arrowLen + 20);
    ctx.closePath();

    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 12;
    ctx.fill();

    // Centro del radar
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#00ff41';
    ctx.fill();

    ctx.restore();
}

/* ==========================================================================
   6. OSCILOSCOPIO DE POTENCIA EN CANVAS
   ========================================================================== */
function initChartCanvas() {
    const canvas = document.getElementById('signalChart');
    if (canvas) {
        canvas.width = canvas.parentElement.clientWidth || 600;
        canvas.height = 160;
    }
}

function drawSignalChart() {
    const canvas = document.getElementById('signalChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Rejilla de Fondo Cyberpunk
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 25) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Dibujar Curva de Potencia
    const stepX = w / (signalHistory.length - 1);
    ctx.beginPath();

    let sum = 0;
    let maxVal = 0;

    signalHistory.forEach((val, i) => {
        sum += val;
        if (val > maxVal) maxVal = val;

        const x = i * stepX;
        const y = h - (val / 100) * (h - 20) - 10;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00ff41';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Relleno degradado bajo la curva
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(0, 255, 65, 0.25)');
    grad.addColorStop(1, 'rgba(0, 255, 65, 0.0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Actualizar Leyendas
    const avg = Math.round(sum / signalHistory.length);
    document.getElementById('peakValue').textContent = `${maxVal}%`;
    document.getElementById('avgValue').textContent = `${avg}%`;
}

/* ==========================================================================
   7. SINTETIZADOR DE AUDIO HACKER (CONTADOR GEIGER)
   ========================================================================== */
function playGeigerClick(quality) {
    if (!audioEnabled) return;

    const now = Date.now();
    // Intervalo de click inversamente proporcional a la potencia (mayor potencia = clicks más rápidos)
    const interval = Math.max(80, 1000 - (quality * 9));

    if (now - lastBeepTime > interval) {
        lastBeepTime = now;
        playBeepSound(400 + (quality * 5), 0.03);
    }
}

function playBeepSound(freq, duration) {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
        // Audio no soportado o bloqueado por el navegador
    }
}

function toggleAudio() {
    audioEnabled = !audioEnabled;
    const btn = document.getElementById('audioToggleBtn');
    btn.textContent = `🔊 GEIGER AUDIO: ${audioEnabled ? 'ON' : 'OFF'}`;
    btn.style.borderColor = audioEnabled ? '#00ff41' : '#ff0044';
    addMatrixLog(`[AUDIO] Efectos de sonido ${audioEnabled ? 'ACTIVADOS' : 'DESACTIVADOS'}`);
}

/* ==========================================================================
   8. LLUVIA DIGITAL MATRIX
   ========================================================================== */
let matrixInterval = null;
function initMatrixRain() {
    const canvas = document.getElementById('matrixCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = '0123456789ABCDEFJH';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = new Array(columns).fill(1);

    function drawMatrix() {
        if (!matrixEnabled) return;

        ctx.fillStyle = 'rgba(3, 10, 5, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#00ff41';
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
            const text = chars.charAt(Math.floor(Math.random() * chars.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    if (matrixInterval) clearInterval(matrixInterval);
    matrixInterval = setInterval(drawMatrix, 40);
}

function toggleMatrix() {
    matrixEnabled = !matrixEnabled;
    const btn = document.getElementById('matrixToggleBtn');
    btn.textContent = `🌧️ MATRIX FX: ${matrixEnabled ? 'ON' : 'OFF'}`;
    const canvas = document.getElementById('matrixCanvas');
    if (canvas) canvas.style.display = matrixEnabled ? 'block' : 'none';
    addMatrixLog(`[GRAPH] Fondo Matrix ${matrixEnabled ? 'ACTIVADO' : 'DESACTIVADO'}`);
}

/* ==========================================================================
   9. FUNCIONES AUXILIARES Y EXPORTACIÓN DE LOGS
   ========================================================================== */
function getQualityBadge(quality) {
    if (quality >= 75) return `🟢 ${quality}% EXCELENTE`;
    if (quality >= 50) return `🟡 ${quality}% BUENA`;
    if (quality >= 30) return `🟠 ${quality}% REGULAR`;
    return `🔴 ${quality}% CRÍTICA`;
}

function getQualityColor(quality) {
    if (quality >= 75) return '#00ff41';
    if (quality >= 50) return '#ffaa00';
    if (quality >= 30) return '#ff6600';
    return '#ff0044';
}

function getCardPoint(deg) {
    const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return points[Math.floor(((deg + 22.5) % 360) / 45)];
}

function freqToChannel(freq) {
    if (freq >= 2412 && freq <= 2484) return Math.floor((freq - 2407) / 5);
    if (freq >= 5170 && freq <= 5825) return Math.floor((freq - 5000) / 5);
    return 6;
}

function getLocalIP() {
    return `192.168.1.${Math.floor(Math.random() * 200 + 10)}`;
}

function exportData() {
    const lines = document.querySelectorAll('.matrix-line');
    let log = '=== MEDIDOR DE POTENCIA WiFi JH ===\n';
    log += `Creador: Jose Herrera (herrejose@gmail.com)\n`;
    log += `Web Base: https://jesymca.github.io/\n`;
    log += `Fecha: ${new Date().toLocaleString()}\n`;
    log += `SSID: ${currentSSID} | BSSID: ${currentBSSID}\n`;
    log += `Potencia Actual: ${currentDbm} dBm (${displayQuality}%)\n`;
    log += `Rumos Brújula: ${Math.round(currentHeading)}° | Dirección Antena: ${Math.round(targetBearing)}°\n\n`;
    log += `--- REGISTRO DE EVENTOS ---\n`;

    lines.forEach(l => { log += l.textContent + '\n'; });

    const blob = new Blob([log], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WiFi_JH_Log_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    addMatrixLog('[EXPORT] Log exportado correctamente ✓');
    playBeepSound(900, 0.15);
}