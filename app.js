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
    document.getElementById('stopRecording').classList.remove('hidden');

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
    })
    .catch(error => {
        console.error('Error accessing camera:', error);
        alert('No se pudo acceder a la cámara. Verifica los permisos del navegador y asegúrate de estar usando HTTPS.');
        document.getElementById('startRecording').disabled = false;
        isRecording = false;
    });
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        document.getElementById('stopRecording').classList.add('hidden');

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/mp4' });
            recordedChunks = []; // Limpiar los datos grabados
            processVideoEffects(blob);
        };
    }
}

async function processVideoEffects(blob) {
    const videoElement = document.createElement('video');
    videoElement.src = URL.createObjectURL(blob);
    await videoElement.play();
    videoElement.pause();
    videoElement.currentTime = 0;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const frameRate = 30;
    const slowMotionFrames = [];
    const reverseFrames = [];

    // Capturar los primeros 5 segundos en cámara lenta
    videoElement.currentTime = 0;
    while (videoElement.currentTime < 5) {
        await new Promise(resolve => {
            videoElement.onseeked = () => {
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                slowMotionFrames.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
                videoElement.currentTime += 1 / frameRate;
                resolve();
            };
        });
    }

    // Capturar los siguientes 5 segundos en reversa
    videoElement.currentTime = 5;
    while (videoElement.currentTime < 10) {
        await new Promise(resolve => {
            videoElement.onseeked = () => {
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                reverseFrames.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
                videoElement.currentTime += 1 / frameRate;
                resolve();
            };
        });
    }

    reverseFrames.reverse();

    // Crear un nuevo video combinando los efectos
    const finalFrames = [...slowMotionFrames, ...reverseFrames];
    const outputCanvas = document.createElement('canvas');
    const outputCtx = outputCanvas.getContext('2d');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;

    const stream = outputCanvas.captureStream(30);
    const outputRecorder = new MediaRecorder(stream);
    const outputChunks = [];

    outputRecorder.ondataavailable = e => {
        if (e.data.size > 0) {
            outputChunks.push(e.data);
        }
    };

    outputRecorder.onstop = () => {
        const outputBlob = new Blob(outputChunks, { type: 'video/mp4' });
        const outputUrl = URL.createObjectURL(outputBlob);

        // Mostrar el botón de descarga del video
        const downloadButton = document.getElementById('downloadVideo');
        downloadButton.classList.remove('hidden');
        downloadButton.dataset.url = outputUrl;

        // Mostrar el video procesado
        const processedVideo = document.getElementById('processedVideo');
        processedVideo.src = outputUrl;
        processedVideo.classList.remove('hidden');
    };

    outputRecorder.start();

    let frameIndex = 0;
    function drawFinalFrame() {
        if (frameIndex < finalFrames.length) {
            outputCtx.putImageData(finalFrames[frameIndex], 0, 0);
            frameIndex++;
            requestAnimationFrame(drawFinalFrame);
        } else {
            outputRecorder.stop();
        }
    }

    drawFinalFrame();
}

function downloadVideo() {
    const url = document.getElementById('downloadVideo').dataset.url;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'video_processed.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
