// Akira Voice Generator - Speech Synthesis Tool

const synthesis = window.speechSynthesis;
let currentVoice = null;
let availableVoices = [];

// Language voice mapping (same as Akira)
const languageMap = {
    es: /Spanish|Español/i,
    en: /English/i,
    pt: /Portu/i,
    ja: /Japan/i,
    it: /Ital/i,
    zh: /Chin/i
};

// DOM Elements
const textInput = document.getElementById('text-input');
const voiceModeSelect = document.getElementById('voice-mode-select');
const languageSelect = document.getElementById('language-select');
const filenameInput = document.getElementById('filename-input');
const previewBtn = document.getElementById('preview-btn');
const generateBtn = document.getElementById('generate-btn');
const statusDiv = document.getElementById('status');
const modelProgressDiv = document.getElementById('model-download-progress');
const modelStatusText = document.getElementById('model-status-text');
const modelProgressPercent = document.getElementById('model-progress-percent');
const modelProgressBar = document.getElementById('model-progress-bar');

// Local TTS Model variables
let transformersLoaded = false;
let ttsModel = null;
let ttsSynthesizer = null;

// Load available voices
function loadVoices() {
    availableVoices = synthesis.getVoices();
    updateCurrentVoice();
}

// Update current voice based on language selection (prioritize female voices)
function updateCurrentVoice() {
    const selectedLang = languageSelect.value;
    const filter = languageMap[selectedLang] || /English/i;

    // First, try to find a female voice for the selected language
    const femaleVoices = availableVoices.filter(v =>
        filter.test(v.name) &&
        (v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('mujer') ||
            v.name.toLowerCase().includes('woman') ||
            v.name.toLowerCase().includes('femenina') ||
            !v.name.toLowerCase().includes('male') && !v.name.toLowerCase().includes('hombre'))
    );

    // If we found female voices, use the first one
    if (femaleVoices.length > 0) {
        currentVoice = femaleVoices[0];
    } else {
        // Fallback to any voice matching the language
        currentVoice = availableVoices.find(v => filter.test(v.name)) || availableVoices[0];
    }

    console.log('🎤 Voz seleccionada:', currentVoice?.name, '(Idioma:', selectedLang + ')');
}

// Show status message
function showStatus(message, type = 'success') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.classList.remove('hidden');

    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, 5000);
    }
}

// Preview voice (just speak, no recording)
function previewVoice() {
    const text = textInput.value.trim();

    if (!text) {
        showStatus('⚠️ Por favor escribe algo primero', 'error');
        return;
    }

    if (synthesis.speaking) {
        synthesis.cancel();
    }

    updateCurrentVoice();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = currentVoice;

    utterance.onstart = () => {
        previewBtn.disabled = true;
        previewBtn.innerHTML = '<span class="icon">⏸️</span> Reproduciendo...';
        showStatus('🔊 Reproduciendo vista previa...', 'processing');
    };

    utterance.onend = () => {
        previewBtn.disabled = false;
        previewBtn.innerHTML = '<span class="icon">▶️</span> Previsualizar';
        showStatus('✅ Vista previa completada', 'success');
    };

    utterance.onerror = (e) => {
        previewBtn.disabled = false;
        previewBtn.innerHTML = '<span class="icon">▶️</span> Previsualizar';
        showStatus('❌ Error en la vista previa: ' + e.error, 'error');
    };

    synthesis.speak(utterance);
}

// Generate and download audio file
async function generateAudio() {
    const text = textInput.value.trim();
    const filename = filenameInput.value.trim() || 'akira-audio';

    if (!text) {
        showStatus('⚠️ Por favor escribe algo primero', 'error');
        return;
    }

    updateCurrentVoice();

    try {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<span class="icon">⏳</span> Generando...';
        showStatus('🎙️ Generando audio...', 'processing');

        // Create audio context for recording
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const destination = audioContext.createMediaStreamDestination();

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = currentVoice;

        // Setup media recorder
        const mediaRecorder = new MediaRecorder(destination.stream);
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        // Promise to handle recording completion
        const recordingPromise = new Promise((resolve, reject) => {
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                resolve(blob);
            };

            utterance.onstart = () => {
                mediaRecorder.start();
            };

            utterance.onend = () => {
                setTimeout(() => {
                    mediaRecorder.stop();
                }, 500);
            };

            utterance.onerror = (e) => {
                mediaRecorder.stop();
                reject(e);
            };
        });

        // Start synthesis
        if (synthesis.speaking) synthesis.cancel();
        synthesis.speak(utterance);

        // Wait for recording to complete
        const blob = await recordingPromise;

        // Download file
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.webm`;
        a.click();

        URL.revokeObjectURL(url);
        audioContext.close();

        showStatus('✅ Audio generado y descargado correctamente', 'success');

    } catch (error) {
        console.error('Error generating audio:', error);
        showStatus('❌ Error generando audio: ' + error.message, 'error');
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<span class="icon">💾</span> Generar y Descargar';
    }
}

// Event listeners
languageSelect.addEventListener('change', updateCurrentVoice);
previewBtn.addEventListener('click', previewVoice);
generateBtn.addEventListener('click', generateAudio);

// Stop preview when clicking preview button while speaking
previewBtn.addEventListener('click', () => {
    if (synthesis.speaking) {
        synthesis.cancel();
        previewBtn.disabled = false;
        previewBtn.innerHTML = '<span class="icon">▶️</span> Previsualizar';
    }
});

// Initialize voices
if (synthesis.onvoiceschanged !== undefined) {
    synthesis.onvoiceschanged = loadVoices;
}
loadVoices();

// Keyboard shortcuts
textInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        generateAudioUpdated();
    }
});

// ==================== LOCAL TTS MODEL FUNCTIONS ====================

// Load Transformers.js library dynamically
async function loadTransformers() {
    if (transformersLoaded) return;

    try {
        modelStatusText.textContent = 'Cargando biblioteca Transformers.js...';
        modelProgressDiv.classList.remove('hidden');

        // Import Transformers.js from CDN
        const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');

        // Configure to use local cache
        env.allowLocalModels = false;
        env.useBrowserCache = true;

        window.transformers = { pipeline, env };
        transformersLoaded = true;

        console.log('✅ Transformers.js cargado correctamente');
    } catch (error) {
        console.error('Error loading Transformers.js:', error);
        throw new Error('No se pudo cargar la biblioteca TTS');
    }
}

// Initialize TTS model with progress tracking
async function initializeTTSModel() {
    if (ttsSynthesizer) return ttsSynthesizer;

    try {
        await loadTransformers();

        modelStatusText.textContent = 'Descargando modelo TTS (~45MB)...';
        modelProgressPercent.textContent = '0%';
        modelProgressBar.style.width = '0%';
        modelProgressDiv.classList.remove('hidden');

        const { pipeline } = window.transformers;

        // Create TTS pipeline with progress callback
        ttsSynthesizer = await pipeline('text-to-speech', 'Xenova/speecht5_tts', {
            progress_callback: (progress) => {
                if (progress.status === 'progress') {
                    const percent = Math.round((progress.loaded / progress.total) * 100);
                    modelProgressPercent.textContent = `${percent}%`;
                    modelProgressBar.style.width = `${percent}%`;
                    modelStatusText.textContent = `Descargando ${progress.file}...`;
                } else if (progress.status === 'done') {
                    modelStatusText.textContent = 'Modelo descargado, inicializando...';
                }
            }
        });

        modelStatusText.textContent = '✅ Modelo TTS listo!';
        modelProgressPercent.textContent = '100%';
        modelProgressBar.style.width = '100%';

        setTimeout(() => {
            modelProgressDiv.classList.add('hidden');
        }, 2000);

        console.log('✅ Modelo TTS inicializado y en caché');
        return ttsSynthesizer;

    } catch (error) {
        modelProgressDiv.classList.add('hidden');
        console.error('Error initializing TTS model:', error);
        throw new Error('No se pudo inicializar el modelo TTS');
    }
}

// Generate audio using local TTS model
async function generateWithLocalTTS(text) {
    try {
        const synthesizer = await initializeTTSModel();

        showStatus('🤖 Generando audio con modelo local...', 'processing');

        // Generate speech
        const output = await synthesizer(text, {
            speaker_embeddings: 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/speaker_embeddings.bin'
        });

        // Convert Float32Array to WAV blob
        const audioData = output.audio;
        const sampleRate = output.sampling_rate;

        // Create WAV file
        const wavBlob = createWavBlob(audioData, sampleRate);

        return wavBlob;

    } catch (error) {
        console.error('Error generating with local TTS:', error);
        throw error;
    }
}

// Helper function to create WAV blob from audio data
function createWavBlob(audioData, sampleRate) {
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;

    const dataLength = audioData.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Audio data
    const offset = 44;
    for (let i = 0; i < audioData.length; i++) {
        const sample = Math.max(-1, Math.min(1, audioData[i]));
        view.setInt16(offset + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// ==================== UPDATED GENERATION FUNCTIONS ====================

// Updated preview function to support both modes
async function previewVoiceUpdated() {
    const text = textInput.value.trim();
    const voiceMode = voiceModeSelect.value;

    if (!text) {
        showStatus('⚠️ Por favor escribe algo primero', 'error');
        return;
    }

    if (voiceMode === 'local') {
        // Local TTS doesn't support preview easily, so we'll just generate
        showStatus('ℹ️ El modelo local no soporta vista previa. Usa "Generar y Descargar"', 'error');
        return;
    }

    // Use Web Speech API for preview
    previewVoice();
}

// Updated generate function to support both modes
async function generateAudioUpdated() {
    const text = textInput.value.trim();
    const filename = filenameInput.value.trim() || 'akira-audio';
    const voiceMode = voiceModeSelect.value;

    if (!text) {
        showStatus('⚠️ Por favor escribe algo primero', 'error');
        return;
    }

    try {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<span class="icon">⏳</span> Generando...';

        let blob;
        let extension;

        if (voiceMode === 'local') {
            // Use local TTS model
            blob = await generateWithLocalTTS(text);
            extension = 'wav';
        } else {
            // Use Web Speech API
            updateCurrentVoice();
            showStatus('🎙️ Generando audio...', 'processing');

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const destination = audioContext.createMediaStreamDestination();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = currentVoice;

            const mediaRecorder = new MediaRecorder(destination.stream);
            const chunks = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            const recordingPromise = new Promise((resolve, reject) => {
                mediaRecorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'audio/webm' });
                    resolve(blob);
                };

                utterance.onstart = () => mediaRecorder.start();
                utterance.onend = () => setTimeout(() => mediaRecorder.stop(), 500);
                utterance.onerror = (e) => {
                    mediaRecorder.stop();
                    reject(e);
                };
            });

            if (synthesis.speaking) synthesis.cancel();
            synthesis.speak(utterance);

            blob = await recordingPromise;
            audioContext.close();
            extension = 'webm';
        }

        // Download file
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.${extension}`;
        a.click();

        URL.revokeObjectURL(url);

        showStatus('✅ Audio generado y descargado correctamente', 'success');

    } catch (error) {
        console.error('Error generating audio:', error);
        showStatus('❌ Error generando audio: ' + error.message, 'error');
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<span class="icon">💾</span> Generar y Descargar';
    }
}

// Update event listeners to use new functions
previewBtn.removeEventListener('click', previewVoice);
generateBtn.removeEventListener('click', generateAudio);
previewBtn.addEventListener('click', previewVoiceUpdated);
generateBtn.addEventListener('click', generateAudioUpdated);

console.log('🎤 Akira Voice Generator cargado correctamente');
console.log('💡 Tip: Usa Ctrl+Enter para generar audio rápidamente');
console.log('🤖 Modelo TTS Local disponible (se descargará al usarlo por primera vez)');
