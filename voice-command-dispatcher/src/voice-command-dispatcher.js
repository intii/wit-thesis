var voiceCommandDispatcher = function() {
  var audioContext;
  var BUFF_SIZE_RENDERER = 512;
  var SILENCE_THRESHOLD = 0.00015;
  var cachedBuffer = [];

  function createAudioContext() {
    audioCtx = window.AudioContext || window.webkitAudioContext;
    if (audioCtx) {
      audioContext = new audioCtx();
    } else {
      console.alert('AudioContext not supported');
    }
  }

  function captureVoiceCommand(audioBuffer) {
    if(!detectSilence(audioBuffer)) {
      var channels = 1;
      // Create an empty two second stereo buffer at the
      // sample rate of the AudioContext
      var myArrayBuffer = audioContext.createBuffer(channels, audioBuffer.length, audioContext.sampleRate);
      var nowBuffering = myArrayBuffer.getChannelData(0);
      for (var i = 0; i < audioBuffer.length; i++) {
        nowBuffering[i] = audioBuffer[i];
      }

      // Get an AudioBufferSourceNode.
      // This is the AudioNode to use when we want to play an AudioBuffer
      var source = audioContext.createBufferSource();

      // set the buffer in the AudioBufferSourceNode
      source.buffer = myArrayBuffer;

      // connect the AudioBufferSourceNode to the
      // destination so we can hear the sound
      source.connect(audioContext.destination);

      // start the source playing
      // source.start();
      console.log('pause');
    }
  }

  function detectSilence(audioBuffer, limit) {
    var sum = 0;
    var index = audioBuffer.length -1;
    var end = limit ? audioBuffer.length - limit : 0;
    var avg;
    for(index; index >= limit; index--) {
      sum += audioBuffer[index];
    }
    avg = sum/BUFF_SIZE_RENDERER;
    return Math.abs(avg) <= SILENCE_THRESHOLD;
  }

  function processInput(event) {
    var inputBuffer = event.inputBuffer.getChannelData(0);
    var audioBuffer;

    cachedBuffer = Array.prototype.concat(cachedBuffer, Array.prototype.slice.call(inputBuffer));
    audioBuffer = audioContext.createBuffer(1, cachedBuffer.length, audioContext.sampleRate);
    audioBuffer.copyToChannel(new Float32Array(cachedBuffer), 0);

    if (audioBuffer.duration >= 0.5 && detectSilence(cachedBuffer, 20000)) {
      console.log('Silence ---> ');
      // captureVoiceCommand(cachedBuffer);
      cachedBuffer = [];
    }
  }

  function createSoundGraph(audioStream) {
    var micStream = audioContext.createMediaStreamSource(audioStream);
    var inputAnalyzer = audioContext.createScriptProcessor(BUFF_SIZE_RENDERER, 1, 1);

    inputAnalyzer.onaudioprocess = processInput;
    micStream.connect(inputAnalyzer);
    inputAnalyzer.connect(audioContext.destination);
  }

  function initialize() {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                    navigator.mozGetUserMedia || navigator.msGetUserMedia;

    createAudioContext();

    if (navigator.getUserMedia) {
      navigator.getUserMedia({audio:true}, createSoundGraph, function(e) {
        console.alert('Error capturing audio.');
      });
    } else {
      console.alert('getUserMedia not supported in this browser.');
    }
  }

  return {
    start: function() {
      initialize();
    }
  }
}


var voiceChannel = new voiceCommandDispatcher();

window.document.querySelector('.js-trigger-mic').addEventListener('click', function() {
    voiceChannel.start();
});
