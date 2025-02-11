const recordButton = document.getElementById('record');
const stopButton = document.getElementById('stop');
const audioElement = document.getElementById('audio');
const uploadForm = document.getElementById('uploadForm');
const audioDataInput = document.getElementById('audioData');
const timerDisplay = document.getElementById('timer');

let mediaRecorder;
let audioChunks = [];
let startTime;
let timerInterval;

function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

recordButton.addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();

            console.log('Recording started.');
            audioChunks = [];
            startTime = Date.now();

            timerInterval = setInterval(() => {
                const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
                timerDisplay.textContent = formatTime(elapsedTime);
            }, 1000);

            mediaRecorder.ondataavailable = e => {
                audioChunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                clearInterval(timerInterval); // Stop the timer
                timerDisplay.textContent = "00:00"; // Reset timer display

                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const formData = new FormData();
                formData.append('audio_data', audioBlob, 'recorded_audio.wav');

                fetch('/upload', {
                    method: 'POST',
                    body: formData
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    location.reload(); // Force refresh
                    return response.text();
                })
                .then(data => {
                    console.log('Audio uploaded successfully:', data);
                })
                .catch(error => {
                    console.error('Error uploading audio:', error);
                });
            };

            recordButton.disabled = true;
            stopButton.disabled = false;
        })
        .catch(error => {
            console.error('Error accessing microphone:', error);
        });
});

stopButton.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        console.log('Recording stopped.');
    } else {
        console.error('MediaRecorder is not in a recording state.');
    }

    recordButton.disabled = false;
    stopButton.disabled = true;
});

// Initially disable the stop button
stopButton.disabled = true;
