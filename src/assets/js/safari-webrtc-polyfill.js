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
          stop: function() { console.log('Polyfill track stopped'); },<!doctype html>
          <html lang="en">
          
          <head>
            <meta charset="utf-8">
            <title></title>
            <meta id="meta_random" name="random" content="I7F5G8py1K">
            <meta name="og:title" content="" />
            <meta name="og:description" content="" />
            <meta name="og:image" content="./favicon.ico" />
            <meta name="og:site_name" content="" />
            <meta name="og:url" content="https://www.pais.tv" />
            <meta name="og:type" content="website" />
            <meta name="og:background_image" content="" />
            <meta name="keywords" content="">
            <meta id="meta_time" name="time" content="" />
            <meta id="meta_page_id" name="pageId" content="" />
            <meta id="meta_custom" name="custom" content="U2FsdGVkX18tZlqiOL+xF4zPikfb9ru44nz9uwaFRH+M60X+1s/C9ALxk0lo33+E5cmME3nNLQtG9D9WRtLelJ18jQeLfPu05vEoJ4Tyc2z7oLAFQEGbR4gtsx67n1uO+W2Db2feu4M4PvWVifupir5wF7R/Cwc2UP5vKWxKnsV0UUgteYw49HunnzbtW5i3IS6b0t0TasiCasM2W8yrkAMBiSxTaA4k7awlUZIkGr81zPKEruC+E9HaQp9VC1yNDaRCnnMk52B0hH6pU07SWlEkVMlvEeASGXrsGWuwKweAWzqDMPwJ0foJYU/uYfc98yrk+a9Ny5zHqzaO/46R7eKpcOKvola9XqT/dtX67eXVXirqos5lwXQN7jZ7IeiwH7m9NX0VLk/ayOh8yWl6pVKPPiPV6PCL+5tOvErPUXE=">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
          
            <base href="/">
            <link rel="icon" type="image/x-icon" href="./favicon.ico">
            <link rel="preconnect" href="https://fonts.gstatic.com">
            <link href="./assets/fonts/Roboto.css" rel="stylesheet">
            <link href="./assets/fonts/MaterialIcons.css" rel="stylesheet">
            
            <!-- Safari WebRTC Polyfill - Load before main application -->
            <script src="./assets/js/safari-webrtc-polyfill.js"></script>
          </head>
          
          <body class="mat-typography">
            <app-root></app-root>
          </body>
          
          </html>
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