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
