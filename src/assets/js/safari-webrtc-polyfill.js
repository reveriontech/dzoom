/**
 * Safari WebRTC Polyfill
 * Provides compatibility for MediaStreamTrackProcessor and related APIs
 * Load this script before your main application
 */

(function() {
  'use strict';
  
  // Detect Safari/iOS
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || 
                   /iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  if (isSafari) {
    console.log('Safari detected - installing WebRTC polyfills');
  }
  
  // MediaStreamTrackProcessor polyfill
  if (typeof globalThis.MediaStreamTrackProcessor === 'undefined') {
    console.log('Installing MediaStreamTrackProcessor polyfill');
    
    globalThis.MediaStreamTrackProcessor = class MediaStreamTrackProcessorPolyfill {
      constructor(options = {}) {
        this.track = options.track || null;
        this.readable = new ReadableStream({
          start(controller) {
            console.log('MediaStreamTrackProcessor polyfill: stream started');
            // Close immediately since Safari doesn't support this
            controller.close();
          },
          pull(controller) {
            // No-op to prevent errors
          },
          cancel() {
            console.log('MediaStreamTrackProcessor polyfill: stream cancelled');
          }
        });
      }
    };
  }
  
  // MediaStreamTrackGenerator polyfill
  if (typeof globalThis.MediaStreamTrackGenerator === 'undefined') {
    console.log('Installing MediaStreamTrackGenerator polyfill');
    
    globalThis.MediaStreamTrackGenerator = class MediaStreamTrackGeneratorPolyfill {
      constructor(options = {}) {
        this.kind = options.kind || 'video';
        this.writable = new WritableStream({
          write(chunk) {
            console.log('MediaStreamTrackGenerator polyfill: received frame (ignored in Safari)');
          },
          close() {
            console.log('MediaStreamTrackGenerator polyfill: closed');
          },
          abort(reason) {
            console.log('MediaStreamTrackGenerator polyfill: aborted', reason);
          }
        });
        
        // Create a fake video track for Safari compatibility
        this.track = this.createFakeVideoTrack();
        console.warn('MediaStreamTrackGenerator polyfill: using fake track for Safari compatibility');
      }
      
      createFakeVideoTrack() {
        // Create a basic MediaStreamTrack-like object
        return {
          kind: this.kind,
          id: 'polyfill-track-' + Math.random().toString(36).substr(2, 9),
          label: 'Safari Polyfill Track',
          enabled: true,
          muted: false,
          readyState: 'live',
          clone: function() { return this; },
          stop: function() { console.log('Polyfill track stopped'); },
          addEventListener: function() {},
          removeEventListener: function() {},
          dispatchEvent: function() { return true; },
          getSettings: function() { 
            return { 
              width: 640, 
              height: 480, 
              frameRate: 30,
              aspectRatio: 1.33
            }; 
          },
          getCapabilities: function() { 
            return { 
              width: { min: 320, max: 1920 }, 
              height: { min: 240, max: 1080 },
              frameRate: { min: 1, max: 60 }
            }; 
          },
          getConstraints: function() { return {}; },
          applyConstraints: function() { return Promise.resolve(); }
        };
      }
    };
  }
  
  console.log('Safari WebRTC polyfills installed');
})(); 
