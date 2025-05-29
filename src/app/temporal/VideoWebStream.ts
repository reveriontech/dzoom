import { EventEmitter } from '@angular/core';
import { EmitterThen } from './EmitterThen';
import { MyCookies } from '@ejfdelgado/ejflab-common/src/MyCookies';

declare var MediaStreamTrackProcessor: any;
declare var MediaStreamTrackGenerator: any;
declare var TransformStream: any;
declare var VideoFrame: any;

console.log("change!");

export interface SelectedDeviceData {
  audio: string | null;
  video: string | null;
  speaker: string | null;
}

export interface DevicesData {
  audios: Array<DeviceOption>;
  videos: Array<DeviceOption>;
  speaker: Array<DeviceOption>;
}

export interface DeviceOption {
  txt: string;
  id: string;
}

export interface MultiScaleMediaStream {
  big: MediaStream;
  small: MediaStream;
  audio: MediaStream;
}

function scaleSource(sw: number, sh: number, dw: number, dh: number) {
  const hRatio = dw / sw;
  const vRatio = dh / sh;
  const ratio = Math.max(hRatio, vRatio);
  const x = (sw - dw / ratio) / 2;
  const y = (sh - dh / ratio) / 2;
  return { x, y, w: sw - x * 2, h: sh - y * 2, ratio };
}

export class VideoWebStream {
  static TUMBNAIL_HEIGHT = 155;
  streams: MultiScaleMediaStream | null = null;
  analyser: AnalyserNode | null = null;
  audioContext: AudioContext | null = null;
  dataArray: Uint8Array | null = null;
  microphone: MediaStreamAudioSourceNode | null = null;
  volumeMeterTimer: NodeJS.Timeout | null = null;
  currentDevices: SelectedDeviceData = {
    audio: null,
    video: null,
    speaker: null,
  };
  devices: DevicesData = {
    audios: [],
    videos: [],
    speaker: [],
  };
  emitterDevices: EmitterThen<DevicesData> = new EmitterThen();
  emitterStreams: EventEmitter<MultiScaleMediaStream | null> =
    new EventEmitter();
  volumeEmitter: EventEmitter<number> = new EventEmitter();
  lastUpdatedVideoDevice: string | null = null;
  lastUpdatedAudioDevice: string | null = null;

  constructor() {
    this.emitterDevices.then((devices: DevicesData) => {
      this.autoSelectMicrophoneAndVideoDevice(devices);
    });
    this.emitterStreams.subscribe((stream) => {
      this.updateSelectedDevice(stream);
      this.updateVolumeMeter(stream?.audio);
    });
    navigator.mediaDevices.ondevicechange = async (event) => {
      this.askAgainGetDevices();
    };
    this.askAgainGetDevices();
  }

  getAnalyser(): boolean {
    const localWindow: any = window;
    this.audioContext = new (localWindow.AudioContext ||
      localWindow.webkitAudioContext)();
    if (!this.audioContext) {
      return false;
    }
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    return true;
  }

  updateVolumeMeter(audio?: MediaStream) {
    if (!audio) {
      return;
    }
    this.getAnalyser();
    if (!this.audioContext || !this.analyser || !this.dataArray) {
      return;
    }

    if (this.volumeMeterTimer) {
      clearInterval(this.volumeMeterTimer);
    }

    if (this.microphone) {
      this.microphone.disconnect();
    }
    // Create a source from the microphone input
    this.microphone = this.audioContext.createMediaStreamSource(audio);
    // Connect the source to the analyser
    this.microphone.connect(this.analyser);
    let processing = false;
    const updateVolumeMeter = () => {
      if (processing) {
        return;
      }
      processing = true;
      if (this.audioContext && this.analyser && this.dataArray) {
        this.analyser.getByteFrequencyData(this.dataArray);
        // Calculate the average volume level
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
          sum += this.dataArray[i];
        }
        const volume = sum / this.dataArray.length;
        const percentage = (volume / 255) * 100;
        const enhanced = (200 * Math.atan(percentage / 10)) / Math.PI;
        const classification = 10 * Math.ceil(enhanced / 10);
        this.volumeEmitter.emit(classification);
      }
      processing = false;
    };

    // Start the volume meter
    this.volumeMeterTimer = setInterval(() => {
      updateVolumeMeter();
    }, 100);
  }

  autoReloadDevices(): EmitterThen<DevicesData> {
    return this.emitterDevices;
  }

  async askAgainGetDevices() {
    const nextDevices = await this.getDevices();
    this.emitterDevices.update(nextDevices);
    if (nextDevices.audios.length == 0 || nextDevices.videos.length == 0) {
      setTimeout(() => {
        this.askAgainGetDevices();
      }, 1000);
    }
  }

  async getDevices(): Promise<DevicesData> {
    // AFAICT in Safari this only gets default devices until gUM is called :/
    let deviceInfos: MediaDeviceInfo[] =
      await navigator.mediaDevices.enumerateDevices();
    const videos: Array<DeviceOption> = [];
    const audios: Array<DeviceOption> = [];
    const speaker: Array<DeviceOption> = [];
    deviceInfos = deviceInfos.filter((deviceInfo) => {
      if (deviceInfo.kind == 'audiooutput') {
        return !!deviceInfo.deviceId;
      } else {
        return !!deviceInfo.deviceId && deviceInfo.deviceId != 'default';
      }
    });
    for (const deviceInfo of deviceInfos) {
      if (deviceInfo.kind === 'audioinput') {
        const deviceOption: DeviceOption = {
          id: deviceInfo.deviceId,
          txt: deviceInfo.label || `Microphone ${audios.length + 1}`,
        };
        audios.push(deviceOption);
      } else if (deviceInfo.kind === 'videoinput') {
        const deviceOption: DeviceOption = {
          id: deviceInfo.deviceId,
          txt: deviceInfo.label || `Camera ${videos.length + 1}`,
        };
        videos.push(deviceOption);
      }
      if (deviceInfo.kind === 'audiooutput') {
        const deviceOption: DeviceOption = {
          id: deviceInfo.deviceId,
          txt: deviceInfo.label || `Speaker ${speaker.length + 1}`,
        };
        speaker.push(deviceOption);
      }
    }
    this.devices = { videos, audios, speaker };
    this.autoFixSelectedSpeaker();
    return this.devices;
  }

  sleep(millis: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, millis);
    });
  }

  async waitUntilActive(stream: MediaStream) {
    return new Promise<void>(async (resolve) => {
      do {
        await this.sleep(100);
      } while (!stream.active);
      resolve();
    });
  }

  stopStream() {
    const streams: any = this.streams;
    if (streams) {
      const llaves = Object.keys(streams);
      for (let i = 0; i < llaves.length; i++) {
        const llave = llaves[i];
        streams[llave].getTracks().forEach((track: MediaStreamTrack) => {
          track.stop();
        });
      }
    }
  }

  async getUserMedia(): Promise<MultiScaleMediaStream> {
    const audioSource = this.currentDevices.audio;
    const videoSource = this.currentDevices.video;
    //this.logCurrentDevices();
    if (
      this.lastUpdatedVideoDevice != videoSource ||
      this.lastUpdatedAudioDevice != audioSource
    ) {
      this.stopStream();
    } else {
      if (this.streams) {
        this.emitterStreams.emit(this.streams);
        return this.streams;
      }
    }
    try {
      const constraintsVideo = {
        video: { deviceId: videoSource ? { exact: videoSource } : undefined },
      };
      const constraintsAudio = {
        audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
      };
      const stream = await navigator.mediaDevices.getUserMedia(
        constraintsVideo
      );
      const streamAudio = await navigator.mediaDevices.getUserMedia(
        constraintsAudio
      );

      // Wait until active
      await this.waitUntilActive(stream);
      await this.waitUntilActive(streamAudio);

      const videoTrack: any = stream.getVideoTracks()[0];
      const { width, height } = videoTrack.getSettings();

      // https://mediastreamtrack.glitch.me/script.js
      const trackProcessor = new MediaStreamTrackProcessor({
        track: videoTrack,
      });
      const trackGenerator = new MediaStreamTrackGenerator({
        kind: 'video',
        label: 'small',
      });
      const profileHeight = VideoWebStream.TUMBNAIL_HEIGHT;
      const scale = profileHeight / height;
      const profileWidth = scale * width;

      const transformer = new TransformStream({
        async transform(videoFrame: any, controller: any) {
          const resize = scaleSource(
            width,
            height,
            profileWidth,
            profileHeight
          );

          const bitmap = await window.createImageBitmap(
            videoFrame,
            resize.x,
            resize.y,
            resize.w,
            resize.h,
            {
              resizeWidth: profileWidth,
              resizeHeight: profileHeight,
            }
          );
          const timestamp = videoFrame.timestamp;
          videoFrame.close();
          const next = new VideoFrame(bitmap, { timestamp });
          controller.enqueue(next);
        },
      });

      trackProcessor.readable
        .pipeThrough(transformer)
        .pipeTo(trackGenerator.writable); // pipe the video stream through the transformer function

      const processedStream = new MediaStream();
      processedStream.addTrack(trackGenerator);

      const response: MultiScaleMediaStream = {
        big: stream,
        small: processedStream,
        audio: streamAudio,
      };
      this.streams = response;
      this.emitterStreams.emit(response);

      this.lastUpdatedVideoDevice = videoSource;
      this.lastUpdatedAudioDevice = audioSource;

      return response;
    } catch (err) {
      this.clearStream();
      throw err;
    }
  }

  clearStream() {
    this.stopStream();
    this.streams = null;
    this.emitterStreams.emit(null);
  }

  logCurrentDevices() {
    const audioSource = this.currentDevices.audio;
    const videoSource = this.currentDevices.video;
    console.log(
      `VideoWebStream.logCurrentDevices... video:${videoSource} audio:${audioSource}`
    );
  }

  useSpeakerDevice(outputDevice: string) {
    console.log(`useSpeakerDevice ${outputDevice}`);
    this.currentDevices.speaker = outputDevice;
    this.storeCustomSelectedDevices();
  }

  useAudioDevice(audioDevice: string) {
    console.log(`useAudioDevice ${audioDevice}`);
    this.currentDevices.audio = audioDevice;
    this.storeCustomSelectedDevices();
  }

  useVideoDevice(videoDevice: string) {
    console.log(`useVideoDevice ${videoDevice}`);
    this.currentDevices.video = videoDevice;
    this.storeCustomSelectedDevices();
  }

  updateSelectedDevice(streams: MultiScaleMediaStream | null) {
    //this.logCurrentDevices();
    if (!streams) {
      this.currentDevices.audio = null;
      this.currentDevices.video = null;
    } else {
      this.currentDevices.audio = [...this.devices.audios].filter((option) => {
        const audioTrack = streams.audio.getAudioTracks()[0];
        const response = option.txt === audioTrack.label;
        return response;
      })[0]?.id;
      this.currentDevices.video = [...this.devices.videos].filter((option) => {
        const videoTrack = streams.big.getVideoTracks()[0];
        const response = option.txt === videoTrack.label;
        return response;
      })[0]?.id;
    }
    this.storeCustomSelectedDevices();
    //this.logCurrentDevices();
  }

  storeCustomSelectedDevices() {
    let audioInput = '';
    let videoInput = '';
    let audioOutput = '';
    const microphoneDevice = this.searchMicrophoneDevice(
      this.devices,
      this.currentDevices.audio
    );
    const videoDevice = this.searchVideoDevice(
      this.devices,
      this.currentDevices.video
    );
    const speakerDevice = this.searchSpeakerDevice(
      this.devices,
      this.currentDevices.speaker
    );
    //console.log('storeCustomSelectedDevices');
    //console.log(microphoneDevice);
    //console.log(videoDevice);
    //console.log(speakerDevice);
    if (microphoneDevice) {
      audioInput = microphoneDevice.txt;
    }
    if (videoDevice) {
      videoInput = videoDevice.txt;
    }
    if (speakerDevice) {
      audioOutput = speakerDevice.txt;
    }
    const DAYS = 365;
    MyCookies.setCookie('default_audio_input', audioInput, DAYS);
    MyCookies.setCookie('default_video', videoInput, DAYS);
    MyCookies.setCookie('default_audio_output', audioOutput, DAYS);
  }

  searchSpeakerDevice(
    devices: DevicesData,
    query: string | null,
    type: string = 'id'
  ) {
    const current = devices.speaker.filter((device) => {
      return query == (device as any)[type];
    });
    if (current.length == 0) {
      return null;
    } else {
      return current[0];
    }
  }

  searchMicrophoneDevice(
    devices: DevicesData,
    query: string | null,
    type: string = 'id'
  ) {
    const current = devices.audios.filter((device) => {
      return query == (device as any)[type];
    });
    if (current.length == 0) {
      return null;
    } else {
      return current[0];
    }
  }

  searchVideoDevice(
    devices: DevicesData,
    query: string | null,
    type: string = 'id'
  ) {
    const current = devices.videos.filter((device) => {
      return query == (device as any)[type];
    });
    if (current.length == 0) {
      return null;
    } else {
      return current[0];
    }
  }

  autoFixSelectedSpeaker() {
    if (!this.currentDevices.speaker) {
      if (this.devices.speaker.length > 0) {
        // Search in cookie
        const oldValue = MyCookies.getCookie('default_audio_output');
        const oldDevice = this.searchSpeakerDevice(
          this.devices,
          oldValue,
          'txt'
        );
        if (oldDevice) {
          this.currentDevices.speaker = oldDevice.id;
        } else {
          this.currentDevices.speaker = this.devices.speaker[0].id;
          this.storeCustomSelectedDevices();
        }
      }
    }
  }

  static isMobile() {
    if (navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/Android/i)) {
      return true;
    }
    return false;
  }

  /**
   * Select cold cookie selected value, or first if exist at least 1
   * @param devices
   */
  autoSelectMicrophoneAndVideoDevice(devices: DevicesData) {
    //this.logCurrentDevices();
    // Setup audio input microphone
    if (devices.audios.length > 0) {
      if (!this.currentDevices.audio) {
        const oldValue = MyCookies.getCookie('default_audio_input');
        const oldDevice = this.searchMicrophoneDevice(devices, oldValue, 'txt');
        if (oldDevice) {
          this.currentDevices.audio = oldDevice.id;
        }
      }
      const currentAudio = this.searchMicrophoneDevice(
        devices,
        this.currentDevices.audio
      );
      if (!currentAudio) {
        this.currentDevices.audio = devices.audios[0].id;
      }
    } else {
      this.currentDevices.audio = null;
    }
    // Setup video
    if (devices.videos.length > 0) {
      if (!this.currentDevices.video) {
        const oldValue = MyCookies.getCookie('default_video');
        const oldDevice = this.searchVideoDevice(devices, oldValue, 'txt');
        if (oldDevice) {
          this.currentDevices.video = oldDevice.id;
        }
        // if it is mobile 
        if (!this.currentDevices.video && VideoWebStream.isMobile()) {
          // Try to find front camera
          const frontCameras = devices.videos.filter((oneDevice) => {
            return /front/ig.test(oneDevice.txt);
          });
          if (frontCameras.length > 0) {
            this.currentDevices.video = frontCameras[0].id;
          }
        }
      }
      const currentVideo = this.searchVideoDevice(
        devices,
        this.currentDevices.video
      );
      if (!currentVideo) {
        this.currentDevices.video = devices.videos[0].id;
      }
    } else {
      this.currentDevices.video = null;
    }
    this.storeCustomSelectedDevices();
    //this.logCurrentDevices();
  }

  handleError(error: any) {
    console.error('Error: ', error);
  }
}
