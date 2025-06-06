import {
    MultiScaleMediaStream,
    VideoWebStream,
} from 'ejflab-front-lib';

declare var MediaStreamTrackProcessor: any;
declare var MediaStreamTrackGenerator: any;
declare var TransformStream: any;
declare var VideoFrame: any;

function scaleSource(sw: number, sh: number, dw: number, dh: number) {
    const hRatio = dw / sw;
    const vRatio = dh / sh;
    const ratio = Math.max(hRatio, vRatio);
    const x = (sw - dw / ratio) / 2;
    const y = (sh - dh / ratio) / 2;
    return { x, y, w: sw - x * 2, h: sh - y * 2, ratio };
}

// Utility function to detect Safari
function isSafari(): boolean {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
        /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// Check if MediaStreamTrackProcessor is native (not polyfilled)
function isNativeMediaStreamTrackProcessor(): boolean {
    return typeof MediaStreamTrackProcessor !== 'undefined' &&
        !MediaStreamTrackProcessor.toString().includes('Polyfill');
}

export class VideoWebStreamHook {
    static register() {
        VideoWebStream.registerHook("getUserMedia", VideoWebStreamHook.getUserMedia);
    }
    static async getUserMedia(self: VideoWebStream): Promise<MultiScaleMediaStream> {
        const audioSource = self.currentDevices.audio;
        const videoSource = self.currentDevices.video;
        //self.logCurrentDevices();
        if (
            self.lastUpdatedVideoDevice != videoSource ||
            self.lastUpdatedAudioDevice != audioSource
        ) {
            self.stopStream();
        } else {
            if (self.streams) {
                self.emitterStreams.emit(self.streams);
                return self.streams;
            }
        }
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const constraintsVideo = {
                video: {
                    deviceId: videoSource ? { exact: videoSource } : undefined,
                },
            };

            if (urlParams.get("test") == "yes") {
                (constraintsVideo.video as any).frameRate = {
                    ideal: 15, //fps
                    max: 20, //fps
                };
            }
            console.log(JSON.stringify(constraintsVideo, null, 4));

            // Define audio constraints with noise suppression enabled
            const constraintsAudio = {
                audio: {
                    deviceId: audioSource ? { exact: audioSource } : undefined,

                    // ✅ Added noise suppression settings
                    noiseSuppression: true,
                    echoCancellation: true,
                    autoGainControl: true
                }
            };
            console.log(JSON.stringify(constraintsAudio, null, 4));
            const stream = await navigator.mediaDevices.getUserMedia(
                constraintsVideo
            );
            const streamAudio = await navigator.mediaDevices.getUserMedia(
                constraintsAudio
            );

            // Wait until active
            await self.waitUntilActive(stream);
            await self.waitUntilActive(streamAudio);

            const videoTrack: any = stream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();
            console.log('Actual video frame rate:', settings.frameRate);
            const { width, height } = videoTrack.getSettings();

            let processedStream: MediaStream;

            // Check if we can use native MediaStreamTrackProcessor
            if (isNativeMediaStreamTrackProcessor() && !isSafari()) {
                console.log('Using native MediaStreamTrackProcessor for video processing');

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

                processedStream = new MediaStream();
                processedStream.addTrack(trackGenerator);
            } else {
                console.log('MediaStreamTrackProcessor not available or Safari detected - using original stream for small video');
                // Fallback for Safari: use the original stream for both big and small
                // This means no video processing, but the app won't crash
                processedStream = stream.clone();
            }

            // ✅ Return final media stream including audio with noise suppression
            const response: MultiScaleMediaStream = {
                big: stream,
                small: processedStream,
                audio: streamAudio,
            };
            self.streams = response;
            self.emitterStreams.emit(response);
            self.lastUpdatedVideoDevice = videoSource;
            self.lastUpdatedAudioDevice = audioSource;

            return response;
        } catch (err) {
            self.clearStream();
            throw err;
        }
    }
}
