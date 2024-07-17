const videoElement = document.querySelector('video');
const startBtn = document.querySelector('#startBtn');
const stopBtn = document.querySelector('#stopBtn');
const videoSelectBtn = document.querySelector('#videoSelectBtn');
videoSelectBtn.onclick = getVideoSources;

const { desktopCapturer, Menu, dialog } = require('@electron/remote');
const {writeFile} = require('fs');

startBtn.onclick = () => {
  mediaRecorder.start();
  startBtn.classList.add('is-danger');
  startBtn.innerText = 'Recording';
  stopBtn.disabled = false;
};

stopBtn.onclick = () => {
  mediaRecorder.stop();
  startBtn.classList.remove('is-danger');
  startBtn.innerText = 'Start';
};

async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => {
      return {
        label: source.name,
        click: () => {
          selectSource(source);
          startBtn.disabled = false;
        }
      }
    })
  );

  videoOptionsMenu.popup();
}

let mediaRecorder = null;
const recordedChunks = [];

async function selectSource(source) {
  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id
      }
    }
  }

  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  videoElement.srcObject = stream;
  videoElement.play();

  const options = { mimeType: 'video/webm; codecs=vp9' };
  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

const handleDataAvailable = (event) => {
  recordedChunks.push(event.data)
}

const handleStop = async () => {
  stopBtn.disabled = true;

  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9'
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const {filePath} = await dialog.showSaveDialog({
    buttonLabel: 'Save video',
    defaultPath: `vid-${Date.now()}.webm`
  });

  writeFile(filePath, buffer, () => dialog.showMessageBox({message:'Video has been saved successfully.'}));
}