import { ContextComponent } from 'ejflab-front-lib';
import { MicVAD } from "@ricky0123/vad-web";
import { SimpleObj } from '@ejfdelgado/ejflab-common/src/SimpleObj';
import { NogalesUtiles } from '../../nogalesutiles';

export abstract class VoiceDetectionContext
    extends ContextComponent {
    static MAX_REFRESH_PERIOD = 10000;
    static MAX_TIME_TO_NOT_SPEECH = 5000;

    isVolumeMeterLoaded: boolean = false;
    myvad: MicVAD | null = null;
    iMTalking: boolean = false;
    audioContext: AudioContext | null = null;
    localVoiceData: { [key: string]: { voice: boolean, lastOn: number } } = {};
    lastSocketIdVoiceOn: string | null;
    voiceStream: MediaStream | null = null;

    getAudioContext(): AudioContext {
        if (this.audioContext == null) {
            this.audioContext = new AudioContext();
        }
        return this.audioContext;
    }

    computeLastChangedVoice() {
        // Leo el dato
        const people = SimpleObj.getValue(this.livemodel, `data.people`, {});
        for (let socketId in people) {
            const voice = people[socketId].sharedState.voice === true;
            if (!(socketId in this.localVoiceData)) {
                this.localVoiceData[socketId] = {
                    voice: false,
                    lastOn: 0,
                };
            }
            if (voice && !this.localVoiceData[socketId].voice) {
                // Flanco de subida
                this.localVoiceData[socketId].voice = true;
                this.localVoiceData[socketId].lastOn = new Date().getTime();
                //console.log(`Voice ${socketId} turn ON`);
            } else if (!voice && this.localVoiceData[socketId].voice === true) {
                // Flanco de bajada
                this.localVoiceData[socketId].voice = false;
                //console.log(`Voice ${socketId} turn OFF`);
            }
        }
        // Compute the maximum
        this.lastSocketIdVoiceOn = null;
        let maximumTime = 0;
        for (let socketId in this.localVoiceData) {
            const actual = this.localVoiceData[socketId];
            if (actual.lastOn > maximumTime) {
                this.lastSocketIdVoiceOn = socketId;
                maximumTime = actual.lastOn;
            }
        }
    }

    async loadAudioProcesor() {
        if (!this.isVolumeMeterLoaded) {
            const root = this.getRoot();
            //await this.getAudioContext().audioWorklet.addModule(root + "assets/processors/volume-meter-processor.js");
            await this.getAudioContext().audioWorklet.addModule(root + "assets/processors/frame-processor.js");
            this.isVolumeMeterLoaded = true;
        }
    }

    setVoiceValue(socketId: string, voiceValue: boolean, refresh: boolean = true) {
        const oldValue = SimpleObj.getValue(this.livemodel, `data.people.${socketId}.sharedState.voice`, null);
        if (oldValue === voiceValue) {
            return;
        }
        SimpleObj.recreate(
            this.livemodel,
            `data.people.${socketId}.sharedState.voice`,
            voiceValue
        );
        if (refresh) {
            this.trackChanges(['data', 'data.people', `data.people.${socketId}`]);
        }
    }

    finishVoiceFun(audio: any, refresh: boolean = true) {
        if (this.socketId) {
            //console.log("Talking End");
            this.iMTalking = false;
            this.setVoiceValue(this.socketId, this.iMTalking, refresh);
        }
    };

    async createVoiceDetection() {
        if (!this.voiceStream || NogalesUtiles.isMobile()) {
            return;
        }

        let voiceDetected = false;
        this.myvad = await MicVAD.new({
            workletURL: this.getRoot() + "assets/processors/vad.worklet.bundle.min.js",
            modelURL: this.getRoot() + "assets/processors/silero_vad.onnx",
            stream: this.voiceStream,
            ortConfig: ((ort: any) => {
                ort.env.wasm.wasmPaths = this.getRoot() + 'assets/processors/onnxruntime-web/';
            }),
            onSpeechStart: () => {
                if (this.socketId) {
                    //console.log("Talking Start");
                    this.iMTalking = true;
                    voiceDetected = true;
                    this.setVoiceValue(this.socketId, this.iMTalking);
                }
            },
            onSpeechEnd: this.finishVoiceFun.bind(this),
        });
        this.myvad.start();
        setTimeout(() => {
            if (!voiceDetected) {
                this.finishVoiceFun(null);
            }
        }, VoiceDetectionContext.MAX_TIME_TO_NOT_SPEECH);
    }

    async startVoiceDetection(stream: MediaStream) {
        if (NogalesUtiles.isMobile()) {
            return;
        }
        //console.log("Talking configure!");
        this.voiceStream = stream;
        this.stopVoiceDetection(false);
        this.finishVoiceFun(null);
        // Creates interval
        const interval = setInterval(() => {
            if (this.voiceStream) {
                // This is nedded because the speech detector
                // does not fire onSpeechEnd properly
                //console.log("Recreating voice detector...");
                this.stopVoiceDetection(false);
                requestAnimationFrame(() => {
                    this.createVoiceDetection();
                });
            } else {
                clearInterval(interval);
            }
        }, VoiceDetectionContext.MAX_REFRESH_PERIOD);

    }

    async stopVoiceDetection(deleteStream: boolean = true) {
        if (deleteStream === true) {
            this.voiceStream = null;
        }
        if (this.myvad) {
            this.myvad.destroy();
            this.myvad = null;
        }
    }
}