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
    document.getElementById('startRecording').innerText = `Starting in ${countdown}`;
    
    const countdownInterval = setInterval(() => {
        countdown--;
        document.getElementById('startRecording').innerText = `Starting in ${countdown}`;

        if (countdown === 0) {
            clearInterval(countdownInterval);
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

        setTimeout(stopRecording, 10000); // Detener la grabación automáticamente a los 10 segundos

        document.getElementById('stopRecording').disabled = false;
        document.getElementById('stopRecording').classList.remove('hidden');
    })
    .catch(error => {
        console.error('Error accessing camera:', error);
        alert('No se pudo acceder a la cámara. Verifica los permisos del navegador y asegúrate de estar usando HTTPS.');
        document.getElementById('startRecording').disabled = false;
    });
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
        document.getElementById('stopRecording').disabled = true;
        document.getElementById('stopRecording').classList.add('hidden');
        document.getElementById('downloadVideo').classList.remove('hidden');
    }
}

function downloadVideo() {
    const blob = new Blob(recordedChunks, { type: 'video/mp4' });
    applyEffects(blob).then(editedBlob => {
        const url = URL.createObjectURL(editedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'video_processed.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Limpiar después de la descarga
        recordedChunks = [];
        document.getElementById('startRecording').disabled = false;
        document.getElementById('downloadVideo').classList.add('hidden');
    });
}

async function applyEffects(blob) {
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
        return new Blob(outputChunks, { type: 'video/mp4' });
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

    return new Promise(resolve => {
        outputRecorder.onstop = () => {
            resolve(new Blob(outputChunks, { type: 'video/mp4' }));
        };
    });
}
