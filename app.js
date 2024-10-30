let isRecording = false;
let mediaRecorder;
let recordedChunks = [];
let stream;

document.getElementById('startRecording').addEventListener('click', startRecording);
document.getElementById('stopRecording').addEventListener('click', stopRecording);
document.getElementById('downloadVideo').addEventListener('click', downloadVideo);
document.getElementById('playSlow').addEventListener('click', playInSlowMotion);
document.getElementById('playReverse').addEventListener('click', playInReverse);

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

            // Mostrar botones de reproducción lenta y en reversa
            document.getElementById('playSlow').classList.remove('hidden');
            document.getElementById('playReverse').classList.remove('hidden');

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
}

function playInSlowMotion() {
    const processedVideo = document.getElementById('processedVideo');
    processedVideo.playbackRate = 0.5; // Reproducir a la mitad de la velocidad
    processedVideo.play();
}

function playInReverse() {
    const processedVideo = document.getElementById('processedVideo');
    processedVideo.pause();
    const context = new AudioContext();
    const source = context.createBufferSource();
    fetch(processedVideo.src)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => context.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            const reversedBuffer = context.createBuffer(
                audioBuffer.numberOfChannels,
                audioBuffer.length,
                audioBuffer.sampleRate
            );
            for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
                const channelData = audioBuffer.getChannelData(i);
                reversedBuffer.copyToChannel(channelData.reverse(), i);
            }
            source.buffer = reversedBuffer;
            source.connect(context.destination);
            source.start(0);
        });
}
