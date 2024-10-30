// Reinicio del código para grabación de video
let mediaRecorder;
let recordedChunks = [];
let stream;

document.getElementById('startRecording').addEventListener('click', startRecording);
document.getElementById('stopRecording').addEventListener('click', stopRecording);
document.getElementById('downloadVideo').addEventListener('click', downloadVideo);

function startRecording() {
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
        video: true,
        audio: false
    })
    .then(mediaStream => {
        stream = mediaStream;
        const videoElement = document.getElementById('video');
        videoElement.srcObject = stream;
        videoElement.classList.remove('hidden');
        videoElement.play();

        mediaRecorder = new MediaRecorder(stream);
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
    });
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
        document.getElementById('stopRecording').disabled = true;
        document.getElementById('stopRecording').classList.add('hidden');
        document.getElementById('downloadVideo').classList.remove('hidden');
    }
}

function downloadVideo() {
    const blob = new Blob(recordedChunks, { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    const videoElement = document.createElement('video');
    videoElement.src = url;
    videoElement.controls = true;
    videoElement.playbackRate = 0.5; // Reproducir a la mitad de la velocidad para efecto de cámara lenta

    document.body.appendChild(videoElement);

    // Esperar un tiempo para simular la cámara lenta y luego ofrecer la descarga
    setTimeout(() => {
        const slowMotionBlob = new Blob(recordedChunks, { type: 'video/mp4' });
        const downloadUrl = URL.createObjectURL(slowMotionBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'video_slowmotion.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Limpiar después de la descarga
        recordedChunks = [];
        document.getElementById('startRecording').disabled = false;
        document.getElementById('downloadVideo').classList.add('hidden');
        document.body.removeChild(videoElement);
    }, 5000); // Esperar para permitir la reproducción lenta antes de la descarga
}
