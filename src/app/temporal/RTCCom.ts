import { Buffer } from 'buffer';
import { EventEmitter } from '@angular/core';
import { PromiseEmitter } from './PromiseEmitter';
import { MultiScaleMediaStream } from './VideoWebStream';
import { CallServiceInstance } from "../services/call.service";

export interface PeerStream {
  stream: MediaStream | null;
}

export interface PeerDataChannel {
  peerConn: RTCPeerConnection;
  channels: { [key: string]: RTCDataChannel };
  streams: {
    audio: PeerStream;
    video: Array<PeerStream>;
  };
}

export interface PeerOutputElements {
  audio?: HTMLAudioElement;
  video?: HTMLVideoElement;
}

export interface StreamActiveData {
  type: string;
  socketId: string;
  stream: MediaStream,
  id?: number;
}

export class RTCCom {
  static peers: { [key: string]: PeerDataChannel } = {};
  static peersElements: { [key: string]: PeerOutputElements } = {};
  static callServiceInstance: CallServiceInstance;
  static rtcConfig: PromiseEmitter = new PromiseEmitter();
  static dataChannelEvents: EventEmitter<any> = new EventEmitter();
  static mustUpdate: EventEmitter<void> = new EventEmitter();
  static mediaStreams: MultiScaleMediaStream | null = null;
  static callMadeConfigured: EventEmitter<void> = new EventEmitter();
  static includeOtherPeersEvent: EventEmitter<void> = new EventEmitter();
  static streamActive: EventEmitter<StreamActiveData> = new EventEmitter();

  static async init(callServiceInstance: CallServiceInstance) {
    this.rtcConfig = new PromiseEmitter();
    this.callServiceInstance = callServiceInstance;
    // Configuración de una sola vez
    this.oneTimeConfiguration();
    this.callServiceInstance.emitEvent('askiceservers', {});
  }

  static unregisterAudioVideoElement(socketId: string) {
    delete this.peersElements[socketId];
  }

  static getPeerHtmlElements(socketId: string) {
    return this.peersElements[socketId];
  }

  static registerAudioElement(
    socketId: string,
    audioElement: HTMLAudioElement
  ) {
    if (!(socketId in this.peersElements)) {
      this.peersElements[socketId] = {};
    }
    this.peersElements[socketId].audio = audioElement;
  }

  static registerVideoElement(
    socketId: string,
    videoElement: HTMLVideoElement
  ) {
    if (!(socketId in this.peersElements)) {
      this.peersElements[socketId] = {};
    }
    this.peersElements[socketId].video = videoElement;
  }

  static hasConnectionWith(socketId: string): boolean {
    const value = socketId in this.peers;
    return value;
  }

  static onDataChannel(callback: Function) {
    return this.dataChannelEvents.subscribe(callback);
  }

  static async closeChannelWith(remoteSocketId: string) {
    const peerData = this.peers[remoteSocketId];
    if (!peerData) {
      return;
    }
    peerData.peerConn.close();
    peerData.streams.audio.stream?.getTracks().forEach(function (track) {
      track.stop();
    });
    const videos = peerData.streams.video;
    videos.forEach((someVideo) => {
      someVideo.stream?.getTracks().forEach(function (track) {
        track.stop();
      });
    });
    delete this.peers[remoteSocketId];
  }

  static isHealthyConnection(remoteSocketId: string) {
    if (!(remoteSocketId in this.peers)) {
      return false;
    }
    const dataChannel = this.peers[remoteSocketId];
    if (dataChannel.peerConn.connectionState != 'connected') {
      return false;
    }
    // Maybe check if both streams are active?
    const videoStream1: MediaStream | null =
      dataChannel.streams.video[0].stream;
    const videoStream2: MediaStream | null =
      dataChannel.streams.video[1].stream;
    const audioStream: MediaStream | null = dataChannel.streams.audio.stream;
    if (!videoStream1 || !audioStream || !videoStream2) {
      return false;
    }
    if (!videoStream1.active || !videoStream2.active || !audioStream.active) {
      return false;
    }
    return true;
  }

  static async openChannelWith(
    remoteSocketId: string,
    channelLabels: Array<string> = []
  ) {
    console.log(`openChannelWith(${remoteSocketId})`);
    // Espero la configuración
    const config = await this.rtcConfig.then();
    // Se crea el webrtc
    const peerConn = new RTCPeerConnection(config);

    // Se registra el peer
    this.peers[remoteSocketId] = {
      peerConn,
      channels: {},
      streams: { audio: { stream: null }, video: [] },
    };

    // I start the communication
    await this.commonConfiguration(peerConn, remoteSocketId);

    // Creo el datachannel text
    for (let i = 0; i < channelLabels.length; i++) {
      const channelLabel = channelLabels[i];
      const dataChannel = peerConn.createDataChannel(channelLabel);
      this.onDataChannelCreated(dataChannel, remoteSocketId);
    }

    // Creo la oferta
    peerConn
      .createOffer()
      .then(function (offer) {
        return peerConn.setLocalDescription(offer);
      })
      .then(() => {
        this.callServiceInstance.emitEvent('callUser', {
          offer: peerConn.localDescription,
          to: remoteSocketId,
        });
      })
      .catch(this.logError);
  }

  static oneTimeConfiguration() {
    console.log('oneTimeConfiguration');
    // Escucho cuando alguien me llama
    const callServiceInstance = this.callServiceInstance;
    const socketId = callServiceInstance.getSocketId();

    this.callServiceInstance.unregisterAllProcessors('oniceservers');
    this.callServiceInstance.unregisterAllProcessors('callMade');
    this.callServiceInstance.unregisterAllProcessors('onicecandidate');
    this.callServiceInstance.unregisterAllProcessors('answerMade');

    this.callServiceInstance.registerProcessor(
      'oniceservers',
      async (message: any) => {
        message.offerToReceiveAudio = true;
        message.offerToReceiveVideo = true;
        this.rtcConfig.resolve(message);
      }
    );
    callServiceInstance.registerProcessor('callMade', async (message: any) => {
      // Se configura el secundario
      const { offer, socket } = message;
      console.log(`callMade(${socket})`);
      const config = await this.rtcConfig.then();
      // Se crea el webrtc
      const peerConn = new RTCPeerConnection(config);
      // Se registra
      this.peers[socket] = {
        peerConn,
        channels: {},
        streams: { audio: { stream: null }, video: [] },
      };
      // Quien recibe el llamado
      await this.commonConfiguration(peerConn, socket);
      // Se escucha ondatachannel
      peerConn.ondatachannel = (event) => {
        this.onDataChannelCreated(event.channel, socket);
      };
      // Se envía la respuesta
      console.log('callMade -> peerConn.setRemoteDescription');
      await peerConn.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConn.createAnswer();
      await peerConn.setLocalDescription(new RTCSessionDescription(answer));
      console.log('makeAnswer!');
      callServiceInstance.emitEvent('makeAnswer', {
        answer,
        to: socket,
      });
      this.callMadeConfigured.emit();
    });

    callServiceInstance.registerProcessor(
      'includeOtherPeers',
      async (message: any) => {
        this.includeOtherPeersEvent.emit();
      }
    );

    // Escucho los ice candidates
    callServiceInstance.registerProcessor('onicecandidate', (message: any) => {
      const remoteSocketId = message.from;
      const peer = this.peers[remoteSocketId];
      if (peer) {
        peer.peerConn.addIceCandidate(
          new RTCIceCandidate({
            candidate: message.candidate,
            sdpMLineIndex: message.label,
            sdpMid: message.id,
          })
        );
      } else {
        console.log(`onicecandidate No peer found for ${remoteSocketId}`);
      }
    });

    // Receiving the answer
    callServiceInstance.registerProcessor(
      'answerMade',
      async (message: any) => {
        const { socket, answer } = message;
        if (socketId == socket) {
          // Ignore call me with me
          return;
        }
        //console.log(`Me ${socketId} incomming ${socket}`);
        const peer = this.peers[socket];
        if (peer) {
          console.log('answerMade -> peerConn.setRemoteDescription');
          await peer.peerConn.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
        } else {
          console.log(`answerMade No peer found for ${socket}`);
        }

        // Ask the peer to fix their connections with the rest of peers
        this.callServiceInstance.emitEvent('includeOtherPeers', {
          to: socket,
        });
      }
    );
  }

  static onStatusChange(updateFun: Function) {
    return this.mustUpdate.subscribe(updateFun);
  }

  static async handleDisconnection(socketId: string) {
    await RTCCom.closeChannelWith(socketId);
    this.mustUpdate.emit();
  }

  static setOnlineStatus(status: string) {
    console.log(`RTCPeer Conection ${status}`);
  }

  static sendBuffer(dataChannel: RTCDataChannel, buffer: Buffer) {
    let CHUNK_LEN = 64000;
    let len = buffer.byteLength;
    let n = (len / CHUNK_LEN) | 0;
    //console.log('Sending a total of ' + len + ' byte(s)');
    dataChannel.send(`${len}`);
    // split the photo and send in chunks of about 64KB
    for (var i = 0; i < n; i++) {
      var start = i * CHUNK_LEN,
        end = (i + 1) * CHUNK_LEN;
      //console.log(start + ' - ' + (end - 1));
      dataChannel.send(buffer.subarray(start, end));
    }

    // send the reminder, if any
    if (len % CHUNK_LEN) {
      //console.log('last ' + (len % CHUNK_LEN) + ' byte(s)');
      dataChannel.send(buffer.subarray(n * CHUNK_LEN));
    }
  }

  static send(socketId: string, label: string, message: string | Buffer) {
    const peer = this.peers[socketId];
    if (peer) {
      const dataChannel = peer.channels[label];
      if (dataChannel) {
        if (dataChannel.readyState !== 'closed') {
          //console.log(`Sending ${message}`);
          if (typeof message == 'string') {
            const buf = Buffer.from(message, 'utf8');
            this.sendBuffer(dataChannel, buf);
          } else {
            this.sendBuffer(dataChannel, message);
          }
        } else {
          console.log(`dataChannel.readyState = ${dataChannel.readyState}`);
        }
      } else {
        console.log(`Channel labeled ${label} does not exists`);
      }
    } else {
      console.log(`There is not connection with ${socketId}`);
    }
  }

  static logError(err: any) {
    if (!err) return;
    if (typeof err === 'string') {
      console.warn(err);
    } else {
      console.warn(err.toString(), err);
    }
  }

  static onDataChannelCreated(channel: RTCDataChannel, remoteSocketId: string) {
    const label = channel.label;
    this.peers[remoteSocketId].channels[label] = channel;
    channel.onopen = () => {
      console.log(`Channel ${label} opened`);
    };

    channel.onclose = () => {
      console.log(`Channel ${label} closed`);
      this.handleDisconnection(remoteSocketId);
    };

    const receiver = (buff: any) => {
      //console.log(`receiver!`);
      this.dataChannelEvents.emit({
        data: buff,
        label,
        socketId: remoteSocketId,
      });
    };

    if (navigator.userAgent.indexOf('Firefox') != -1) {
      channel.onmessage = this.receiveDataFirefoxFactory(receiver);
    } else {
      channel.onmessage = this.receiveDataChromeFactory(receiver);
    }
  }

  static receiveDataChromeFactory(callback: Function) {
    let buf: any, count: any;

    return function onmessage(event: any) {
      if (typeof event.data === 'string') {
        buf = new Uint8ClampedArray(parseInt(event.data));
        count = 0;
        //console.log('Expecting a total of ' + buf.byteLength + ' bytes');
        return;
      }

      let data = new Uint8ClampedArray(event.data);
      buf.set(data, count);

      count += data.byteLength;
      //console.log('count: ' + count);

      if (count === buf.byteLength) {
        // we're done: all data chunks have been received
        //console.log('Done. Rendering photo.');
        callback(buf);
      }
    };
  }

  static receiveDataFirefoxFactory(callback: Function) {
    var count: any, total: any, parts: any;

    return function onmessage(event: any) {
      if (typeof event.data === 'string') {
        total = parseInt(event.data);
        parts = [];
        count = 0;
        console.log('Expecting a total of ' + total + ' bytes');
        return;
      }

      parts.push(event.data);
      count += event.data.size;
      console.log(
        'Got ' + event.data.size + ' byte(s), ' + (total - count) + ' to go.'
      );

      if (count === total) {
        console.log('Assembling payload');
        var buf = new Uint8ClampedArray(total);
        var compose = function (i: any, pos: any) {
          var reader = new FileReader();
          reader.onload = function () {
            const result: any = this.result;
            buf.set(new Uint8ClampedArray(result), pos);
            if (i + 1 === parts.length) {
              console.log('Done. Rendering photo.');
              callback(buf);
            } else {
              compose(i + 1, pos + result.byteLength);
            }
          };
          reader.readAsArrayBuffer(parts[i]);
        };
        compose(0, 0);
      }
    };
  }

  static async setMediaStream(mediaStreams: MultiScaleMediaStream | null) {
    this.mediaStreams = mediaStreams;
  }

  static removeAllTracks(remoteSocketId: string) {
    const peer = this.peers[remoteSocketId];
    if (peer) {
      const senders = peer.peerConn.getSenders();
      console.log(`Clean ${senders.length} tracks for ${remoteSocketId}`);
      senders.forEach((sender) => {
        peer.peerConn.removeTrack(sender);
      });
    }
  }

  static getPeerStream(remoteSocketId: string) {
    const peerData = this.peers[remoteSocketId];
    return peerData;
  }

  static async publishMyLocalMediaStream(remoteSocketId: string) {
    // WTF SEND STREAMS
    const peer = this.peers[remoteSocketId];
    if (this.mediaStreams && peer) {
      this.removeAllTracks(remoteSocketId);
      const addSingleStream = (mediaStream: MediaStream) => {
        mediaStream.getTracks().forEach((track: MediaStreamTrack) => {
          const sender: RTCRtpSender = peer.peerConn.addTrack(
            track,
            mediaStream
          );
        });
      };
      // Publish all tracks
      const mediaStreams: any = this.mediaStreams;
      const llaves = ['small', 'big', 'audio'];
      for (let i = 0; i < llaves.length; i++) {
        const key = llaves[i];
        const currentMediaStream = mediaStreams[key];
        console.log(
          `STREAM SEND: socketId: ${remoteSocketId} key: ${key} ${RTCCom.printMediaStream(
            currentMediaStream
          )}`
        );
        addSingleStream(currentMediaStream);
      }
    } else {
      console.log(
        `ERROR: Can't publish media source because mediaStream OK? ${!!this
          .mediaStreams} peer OK? ${!!peer}`
      );
    }
  }

  static async commonConfiguration(
    peerConn: RTCPeerConnection,
    remoteSocketId: string
  ) {
    // Agrego el track de video y audio si lo hay
    await this.publishMyLocalMediaStream(remoteSocketId);
    // Publico los icecandidates
    peerConn.onicecandidate = (args: RTCPeerConnectionIceEvent) => {
      if (args.candidate) {
        this.callServiceInstance.emitEvent('onicecandidate', {
          candidate: args.candidate.candidate,
          label: args.candidate.sdpMLineIndex,
          id: args.candidate.sdpMid,
          to: remoteSocketId,
        });
      }
    };
    peerConn.ontrack = (information: RTCTrackEvent) => {
      const {
        track,
        streams: [stream],
      } = information;
      // WTF RECEIVE STREAMS
      const peerRef = this.peers[remoteSocketId];
      if (stream.getAudioTracks().length > 0) {
        console.log(
          `STREAM RECEIVE: socketId: ${remoteSocketId} key:audio ${RTCCom.printMediaStream(
            stream
          )}`
        );
        peerRef.streams.audio.stream = stream;
        // bind events with event emmiter
        const emitFunction = () => {
          // Emit Event
          RTCCom.streamActive.emit({
            type: 'audio',
            socketId: remoteSocketId,
            stream
          });
        };
        stream.addEventListener('active', emitFunction);
        emitFunction();
      } else if (stream.getVideoTracks().length > 0) {
        peerRef.streams.video.push({
          stream: stream,
        });
        const emitFunction = () => {
          // Emit Event
          RTCCom.streamActive.emit({
            type: 'video',
            id: peerRef.streams.video.length,
            socketId: remoteSocketId,
            stream
          });
        };
        stream.addEventListener('active', emitFunction);
        emitFunction();
        console.log(
          `STREAM RECEIVE: socketId: ${remoteSocketId} key:video#${peerRef.streams.video.length
          } ${RTCCom.printMediaStream(stream)}`
        );
        // TODO clean old/closed streams
      }

      //track.onunmute = () => {
      const trackIndex = 0; //1 = big, 0 = small
      this.connectStreamToHtmlElement(remoteSocketId, trackIndex);
      //};
    };
    //
    peerConn.onconnectionstatechange = (ev: any) => {
      switch (peerConn.connectionState) {
        case 'new':
        case 'connecting':
          this.setOnlineStatus('Connecting...');
          break;
        case 'connected':
          this.setOnlineStatus('Online');
          break;
        case 'disconnected':
          this.setOnlineStatus('Disconnecting...');
          this.handleDisconnection(remoteSocketId);
          break;
        case 'closed':
          this.setOnlineStatus('Offline');
          break;
        case 'failed':
          this.setOnlineStatus('Error');
          this.handleDisconnection(remoteSocketId);
          break;
        default:
          this.setOnlineStatus('Unknown');
          break;
      }
    };
  }

  static connectStreamToHtmlElement(remoteSocketId: string, videoId?: number) {
    console.log(`connectStreamToHtmlElement(${remoteSocketId})`);
    if (!(remoteSocketId in this.peersElements)) {
      console.log(
        `ERROR: No ${remoteSocketId} in this.peersElements ${Object.keys(
          this.peersElements
        ).join(', ')}`
      );
      return;
    }
    const { audio, video } = this.peersElements[remoteSocketId];
    const peerRef = this.peers[remoteSocketId];
    if (!peerRef) {
      console.log(`ERROR: No ${remoteSocketId} in this.peers`);
      return;
    }
    if (peerRef.streams.audio.stream) {
      if (audio) {
        console.log(
          `STREAM ASSIGN: socketId: ${remoteSocketId} ${RTCCom.printMediaStream(
            peerRef.streams.audio.stream
          )}`
        );
        audio.srcObject = peerRef.streams.audio.stream;
      } else {
        console.log(`ERROR: ${remoteSocketId} has no audio element`);
      }
    } else {
      console.log(
        `ERROR: ${remoteSocketId} has no peerRef.streams.audio.stream`
      );
    }
    if (videoId === undefined) {
      if (video) {
        if (peerRef.streams.video.length > 0) {
          if (!video.srcObject) {
            video.srcObject = peerRef.streams.video[0].stream;
          } else {
            const actual = peerRef.streams.video.filter((element) => {
              return element.stream == video.srcObject;
            })[0];
            const actualIndex = peerRef.streams.video.indexOf(actual);
            let nextIndex = actualIndex + 1;
            if (nextIndex >= peerRef.streams.video.length) {
              nextIndex = 0;
            }
            video.srcObject = peerRef.streams.video[nextIndex].stream;
          }
        } else {
          console.log(
            `ERROR: ${remoteSocketId} has video length = ${peerRef.streams.video.length}`
          );
        }
      } else {
        console.log(`ERROR: ${remoteSocketId} has no video element`);
      }
    } else {
      if (peerRef.streams.video.length > videoId) {
        const currentStream = peerRef.streams.video[videoId];
        if (video) {
          console.log(
            `STREAM ASSIGN: socketId: ${remoteSocketId} ${RTCCom.printMediaStream(
              currentStream.stream
            )}`
          );
          video.srcObject = currentStream.stream;
        } else {
          console.log(`ERROR: ${remoteSocketId} has no video element`);
        }
      } else {
        console.log(
          `ERROR: ${remoteSocketId} has no index ${videoId} because has length ${peerRef.streams.video.length}`
        );
      }
    }
  }

  // RTCCom.printMediaStream()
  static printMediaStream(stream: MediaStream | null) {
    if (!stream) {
      return 'null';
    } else {
      return `Stream: ${stream.id} ${stream.active}${stream.getAudioTracks().length > 0 ? ' AUDIO' : ''
        }${stream.getVideoTracks().length > 0 ? ' VIDEO' : ''}`;
    }
  }
}
