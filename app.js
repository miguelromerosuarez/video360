let isRecording = false;
let mediaRecorder;
let recordedChunks = [];
let stream;

document.getElementById('startRecording').addEventListener('click', startRecording);
document.getElementById('stopRecording').addEventListener('click', stopRecording);
document.getElementById('downloadVideo').addEventListener('click', downloadVideo);

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
    .then(mediaStream => {
        stream = mediaStream;
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
        alert('No se pudo acceder a la cámara. Verifica los permisos del navegador y asegúrate de estar usando HTTPS.');
        document.getElementById('startRecording').disabled = false;
        document.getElementById('startRecording').innerText = 'Start Recording';
        isRecording = false;
    });
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/mp4' });

            // Crear un objeto URL para el video grabado
            const url = URL.createObjectURL(blob);

            // Mostrar el botón de descarga del video
            const downloadButton = document.getElementById('downloadVideo');
            downloadButton.classList.remove('hidden');
            downloadButton.dataset.url = url;

            // Mostrar el video grabado
            const processedVideo = document.getElementById('processedVideo');
            processedVideo.src = url;
            processedVideo.classList.remove('hidden');

            recordedChunks = [];
            
            document.getElementById('stopRecording').disabled = true;
            document.getElementById('stopRecording').classList.add('hidden');
            const videoElement = document.getElementById('video');
            videoElement.pause();
            stream.getTracks().forEach(track => track.stop()); // Detener el stream de la cámara
            videoElement.srcObject = null;
            document.getElementById('startRecording').disabled = false;
            document.getElementById('startRecording').innerText = 'Start Recording';
            isRecording = false;
        };
    }
}

function downloadVideo() {
    const url = document.getElementById('downloadVideo').dataset.url;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'video.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Aplicar los efectos: cámara lenta en los primeros 5 segundos y reversa en los siguientes 5 segundos
    processVideoEffects(url);
}

async function processVideoEffects(url) {
    const videoElement = document.createElement('video');
    videoElement.src = url;
    await videoElement.play();
    videoElement.pause();
    videoElement.currentTime = 0;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const frameRate = 30; // Ajustar la tasa de cuadros por segundo
    const frames = [];

    // Capturar cuadros para los primeros 5 segundos en cámara lenta
    videoElement.addEventListener('seeked', function collectFrames() {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        frames.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        if (videoElement.currentTime < 5) {
            videoElement.currentTime += 1 / frameRate;
        } else {
            // Invertir el video para los siguientes 5 segundos
            frames.reverse();
            playFrames(frames, canvas);
        }
    });
}

function playFrames(frames, canvas) {
    const ctx = canvas.getContext('2d');
    let index = 0;

    function drawFrame() {
        if (index < frames.length) {
            ctx.putImageData(frames[index], 0, 0);
            index++;
            requestAnimationFrame(drawFrame);
        }
    }

    drawFrame();
}
