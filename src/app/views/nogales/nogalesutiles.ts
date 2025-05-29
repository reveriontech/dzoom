
export enum OSType {
  windows = "windows",
  mac = "mac",
  linux = "linux",
  android = "android",
  ios = "ios",
}

export enum BrowserType {
  chrome = "chrome",
  firefox = "firefox",
  safari = "safari",
  opera = "opera",
  webkit = "webkit",
  ie = "ie",
  edge = "edge",
}

export enum ProviderTitleType {
  "dr",
  "sr",
  "sra",
  "srta",
  "mx"
}

export class NogalesUtiles {
  static getRoomUrlFromPath(path: string) {
    return `${location.origin}${location.pathname}nogales/p/room/${path}`;
  }
  static isMobile() {
    if (navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/Android/i)) {
      return true;
    }
    return false;
  }

  static getOSDetail(): { name: string, type: OSType } | null {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any)['opera'];
    const platform = navigator.platform.toLowerCase();

    if (/windows nt 10.0/i.test(userAgent)) return { name: "Windows 10", type: OSType.windows };
    if (/windows nt 6.3/i.test(userAgent)) return { name: "Windows 8.1", type: OSType.windows };
    if (/windows nt 6.2/i.test(userAgent)) return { name: "Windows 8", type: OSType.windows };
    if (/windows nt 6.1/i.test(userAgent)) return { name: "Windows 7", type: OSType.windows };
    if (/windows nt 6.0/i.test(userAgent)) return { name: "Windows Vista", type: OSType.windows };
    if (/windows nt 5.1|windows xp/i.test(userAgent)) return { name: "Windows XP", type: OSType.windows };
    if (/macintosh|mac os x/i.test(userAgent)) return { name: "Mac OS X", type: OSType.mac };
    if (/mac_powerpc/i.test(userAgent)) return { name: "Mac OS (PowerPC)", type: OSType.mac };
    if (/android/i.test(userAgent)) return { name: "Android", type: OSType.android };
    if (/linux/i.test(userAgent) || platform.includes("linux")) return { name: "Linux", type: OSType.linux };
    if (/iphone|ipad|ipod/i.test(userAgent)) return { name: "iOS", type: OSType.ios };

    return null;
  }

  static getBrowserInfo(): { name: string, type: BrowserType | null } | null {
    const navigatorLocal: any = navigator;
    let userAgent = "";
    let browserType: BrowserType | null = null;
    if (navigatorLocal.userAgentData) {
      userAgent = navigatorLocal.userAgentData.brands.map((brand: any) => `${brand.brand} ${brand.version}`).join(", ");
    } else {
      userAgent = navigatorLocal.userAgent;
    }
    if (/edg/i.test(userAgent)) {
      browserType = BrowserType.edge;
    } else if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) {
      browserType = BrowserType.chrome;
    } else if (/firefox/i.test(userAgent)) {
      browserType = BrowserType.firefox;
    } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
      browserType = BrowserType.safari;
    } else if (/msie|trident/i.test(userAgent)) {
      browserType = BrowserType.ie;
    }
    return {
      name: userAgent,
      type: browserType
    };
  }

  static getJpegBytes(canvas: any): Promise<string | ArrayBuffer | null> {
    const fileReader = new FileReader();

    return new Promise((resolve, reject) => {
      fileReader.addEventListener('loadend', function () {
        if (this.error) {
          //reject(this.error);
          resolve(null);
        } else {
          resolve(this.result);
        }
      })

      canvas.toBlob(fileReader.readAsArrayBuffer.bind(fileReader), 'image/jpeg')
    });
  }

  static async grabVideoThumbnail(video: HTMLVideoElement): Promise<string | ArrayBuffer | null> {
    const canvas = document.createElement("canvas");
    const targetSquare = 150;
    canvas.width = targetSquare;
    canvas.height = targetSquare;
    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }
    const width = targetSquare * video.videoWidth / video.videoHeight;
    const height = targetSquare * video.videoHeight / video.videoWidth;
    if (width > targetSquare) {
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, -0.5 * (width - targetSquare), 0, width, targetSquare);
    } else {
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, -0.5 * (height - targetSquare), width, targetSquare);
    }

    return await this.getJpegBytes(canvas);
  }
}
