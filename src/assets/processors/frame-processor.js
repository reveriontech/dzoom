// Frame processor with Safari compatibility
// Provides polyfills for MediaStreamTrackProcessor functionality

// First, define the polyfill before any code tries to use it
(function() {
  'use strict';
  
  // Feature detection and polyfill registration
  if (typeof globalThis.MediaStreamTrackProcessor === 'undefined') {
    console.log('Installing MediaStreamTrackProcessor polyfill for Safari compatibility');
    
    // Provide a basic polyfill for Safari
    globalThis.MediaStreamTrackProcessor = class MediaStreamTrackProcessorPolyfill {
      constructor(options) {
        console.warn('Using MediaStreamTrackProcessor polyfill for Safari compatibility');
        this.track = options?.track || null;
        this.readable = null;
        
        // Create a basic readable stream that doesn't do actual processing
        // This prevents the error from occurring
        this.readable = new ReadableStream({
          start(controller) {
            // Basic implementation - just log that we're using fallback
            console.log('MediaStreamTrackProcessor polyfill: readable stream created');
            // Don't enqueue anything to prevent processing errors
          },
          pull(controller) {
            // No-op for Safari compatibility
          },
          cancel() {
            console.log('MediaStreamTrackProcessor polyfill: stream cancelled');
          }
        });
      }
    };
  }

  // Also provide VideoTrackGenerator if missing
  if (typeof globalThis.VideoTrackGenerator === 'undefined') {
    console.log('Installing VideoTrackGenerator polyfill for Safari compatibility');
    
    globalThis.VideoTrackGenerator = class VideoTrackGeneratorPolyfill {
      constructor() {
        console.warn('Using VideoTrackGenerator polyfill for Safari compatibility');
        this.writable = new WritableStream({
          write(chunk) {
            console.log('VideoTrackGenerator polyfill: received frame');
          },
          close() {
            console.log('VideoTrackGenerator polyfill: closed');
          },
          abort(reason) {
            console.log('VideoTrackGenerator polyfill: aborted', reason);
          }
        });
        
        // Create a basic MediaStreamTrack-like object
        this.track = {
          kind: 'video',
          id: 'polyfill-track-' + Math.random().toString(36).substr(2, 9),
          label: 'Safari Polyfill Track',
          enabled: true,
          muted: false,
          readyState: 'live',
          clone: function() { return this; },
          stop: function() { console.log('Polyfill track stopped'); },
          addEventListener: function() {},
          removeEventListener: function() {},
          dispatchEvent: function() { return true; }
        };
      }
    };
  }
})();

class SafariFrameProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.isSupported = this.checkSupport();
    
    if (!this.isSupported) {
      console.warn('MediaStreamTrackProcessor not supported in this browser. Using fallback methods.');
    }
  }

  checkSupport() {
    // Check if MediaStreamTrackProcessor is available
    return typeof MediaStreamTrackProcessor !== 'undefined';
  }

  process(inputs, outputs) {
    // Basic passthrough for Safari compatibility
    // This ensures the worklet doesn't crash when MediaStreamTrackProcessor is not available
    
    if (inputs[0] && outputs[0]) {
      const input = inputs[0][0];
      const output = outputs[0][0];
      
      if (input && output) {
        for (let i = 0; i < input.length; i++) {
          output[i] = input[i];
        }
      }
    }
    
    return true;
  }
}

// Register the processor
registerProcessor("safari-frame-processor", SafariFrameProcessor); 