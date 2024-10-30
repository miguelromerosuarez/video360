// Reinicio del código para grabación de video
let mediaRecorder;
let recordedChunks = [];
let stream;
let currentFacingMode = 'environment';
let isRecording = false;

// Añadir eventos a los botones para escoger la cámara
document.getElementById('frontCameraButton').addEventListener('click', () => {
    currentFacingMode = 'user';
    resetRecordingState();
});

document.getElementById('backCameraButton').addEventListener('click', () => {
    currentFacingMode = 'environment';
    resetRecordingState();
});

document.getElementById('startRecording').addEventListener('click', startRecording);
document.getElementById('stopRecording').addEventListener('click', stopRecording);
document.getElementById('downloadVideo').addEventListener('click', downloadVideo);

// Escuchar el movimiento del dispositivo
window.addEventListener('devicemotion', handleMotion);

function handleMotion(event) {
    const acceleration = event.accelerationIncludingGravity;
    const threshold = 15; // Umbral para iniciar la grabación (ajustable)

    if (Math.abs(acceleration.x) > threshold || Math.abs(acceleration.y) > threshold || Math.abs(acceleration.z) > threshold) {
        if (!isRecording) {
            showMovementRecordingMessage();
            startRecording();
        }
    }
}

function showMovementRecordingMessage() {
    const movementMessage = document.createElement('div');
    movementMessage.id = 'movementMessage';
    movementMessage.style.fontSize = '2em';
    movementMessage.style.color = 'red';
    movementMessage.style.marginTop = '20px';
    movementMessage.innerText = 'Iniciando grabación debido a movimiento';
    document.body.appendChild(movementMessage);

    setTimeout(() => {
        movementMessage.remove();
    }, 3000);
}

function startRecording() {
    if (isRecording) return;
    isRecording = true;
    document.getElementById('startRecording').disabled = true;
    let countdown = 3;
    const countdownDisplay = document.createElement('div');
    countdownDisplay.id = 'countdown';
    countdownDisplay.style.fontSize = '2em';
    countdownDisplay.style.marginTop = '20px';
    countdownDisplay.innerText = countdown;
    document.body.appendChild(countdownDisplay);

    const countdownInterval = setInterval(() => {
        countdown--;
        countdownDisplay.innerText = countdown;

        if (countdown === 0) {
            clearInterval(countdownInterval);
            countdownDisplay.remove();
            document.getElementById('startRecording').innerText = 'Recording...';
            startVideoRecording();
        }
    }, 1000);
}

function startVideoRecording() {
    navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentFacingMode },
        audio: false
    })
    .then(mediaStream => {
        stream = mediaStream;
        const videoElement = document.getElementById('video');
        videoElement.srcObject = stream;
        videoElement.classList.remove('hidden');
        videoElement.play();

        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp8' });
        recordedChunks = []; // Reset recorded chunks
        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        mediaRecorder.start();

        document.getElementById('stopRecording').disabled = false;
        document.getElementById('stopRecording').classList.remove('hidden');

        // Detener la grabación automáticamente después de 10 segundos
        setTimeout(() => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                stopRecording();
            }
        }, 10000);
    })
    .catch(error => {
        console.error('Error accessing camera:', error);
        alert('No se pudo acceder a la cámara. Verifica los permisos del navegador y asegúrate de estar usando HTTPS.');
        document.getElementById('startRecording').disabled = false;
        isRecording = false;
    });
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
        document.getElementById('stopRecording').disabled = true;
        document.getElementById('stopRecording').classList.add('hidden');
        document.getElementById('downloadVideo').classList.remove('hidden');

        // Mostrar el video grabado para previsualización
        const recordedBlob = new Blob(recordedChunks, { type: 'video/webm' });
        const recordedUrl = URL.createObjectURL(recordedBlob);
        const previewVideo = document.createElement('video');
        previewVideo.controls = true;
        previewVideo.src = recordedUrl;
        previewVideo.style.marginTop = '20px';
        document.body.appendChild(previewVideo);
    }
    isRecording = false;
}

function downloadVideo() {
    if (recordedChunks.length === 0) {
        alert('No hay datos grabados disponibles para descargar.');
        return;
    }

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'video.webm';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    // Limpiar después de la descarga
    recordedChunks = [];
    document.getElementById('startRecording').disabled = false;
    document.getElementById('downloadVideo').classList.add('hidden');
    isRecording = false;
}

function resetRecordingState() {
    if (isRecording) {
        stopRecording();
    }
    document.getElementById('startRecording').disabled = false;
    document.getElementById('stopRecording').classList.add('hidden');
    document.getElementById('downloadVideo').classList.add('hidden');
    isRecording = false;
}
