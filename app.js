// Añadir evento para detectar la orientación del dispositivo
let isRecording = false;
let lastBeta = null;
let rotationThreshold = 10; // Umbral para considerar que el dispositivo está girando

window.addEventListener('deviceorientation', (event) => {
    // Detectar el giro del teléfono usando los sensores del giroscopio
    const { beta } = event;
    if (lastBeta !== null) {
        const delta = Math.abs(beta - lastBeta);
        if (delta > rotationThreshold && !isRecording) {
            startRecording();
        }
    }
    lastBeta = beta;
});

document.getElementById('stopRecording').addEventListener('click', stopRecording);

let mediaRecorder;
let recordedChunks = [];

function startRecording() {
    isRecording = true;
    document.getElementById('startRecording').disabled = true;
    
    // Mostrar cuenta regresiva de 3 segundos
    let countdown = 3;
    const countdownInterval = setInterval(() => {
        document.getElementById('startRecording').innerText = `Starting in ${countdown}`;
        countdown--;

        if (countdown < 0) {
            clearInterval(countdownInterval);
            document.getElementById('startRecording').innerText = 'Recording...';
            startVideoRecording();
        }
    }, 1000);
}

function startVideoRecording() {
    navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
    })
    .then(stream => {
        const videoElement = document.getElementById('video');
        videoElement.srcObject = stream;
        videoElement.classList.remove('hidden'); // Mostrar el video en tiempo real
        videoElement.play();

        // Iniciar la grabación del video
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        mediaRecorder.start();

        // Detener la grabación automáticamente después de 10 segundos
        setTimeout(stopRecording, 10000);

        document.getElementById('stopRecording').disabled = false;
        document.getElementById('stopRecording').classList.remove('hidden');
    })
    .catch(error => {
        console.error('Error accessing camera:', error);
        alert('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
        document.getElementById('startRecording').disabled = false;
        document.getElementById('startRecording').innerText = 'Start Recording';
        isRecording = false;
    });
}

function stopRecording() {
    mediaRecorder.stop();

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/mp4' });

        // Crear un enlace para descargar el video directamente
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'video.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        recordedChunks = [];
        
        document.getElementById('stopRecording').disabled = true;
        document.getElementById('stopRecording').classList.add('hidden');
        const videoElement = document.getElementById('video');
        videoElement.pause();
        videoElement.srcObject = null; // Detener el stream de la cámara
        videoElement.classList.add('hidden');
        document.getElementById('startRecording').disabled = false;
        document.getElementById('startRecording').innerText = 'Start Recording';
        isRecording = false;
    };
}
