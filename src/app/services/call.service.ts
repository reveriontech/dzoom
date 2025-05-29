import { Injectable } from '@angular/core';
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';
import { ModalService } from 'ejflab-front-lib';
import { io, Socket } from 'socket.io-client';

interface ServerToClientEvents {
  [key: string]: (message: any) => void;
}

interface ClientToServerEvents {
  [key: string]: (message: any) => void;
}

export interface ConnectionDataOptions {
  room: string;
  uuid: string | null;
  model?: string;
}

export class CallServiceInstance {
  instanceId: string;
  socketId?: string | null = null;
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  removeInstance: Function;

  constructor(instanceId: string, removeInstance: Function) {
    this.instanceId = instanceId;
    this.removeInstance = removeInstance;
  }

  async waitUntilConnection() {
    return new Promise((resolve, reject) => {
      if (this.socket) {
        this.socket.on('connect', () => {
          if (this.socket) {
            this.socketId = this.socket.id;
            resolve(this.socket);
          }
        });
        this.socket.on('connect_error', (err) => {
          reject(err);
        });
        if (this.socket.connected) {
          resolve(this.socket);
        }
      }
    });
  }

  async beginConnection(
    opts: ConnectionDataOptions,
    waitUntilConnection = true
  ): Promise<Socket> {
    if (this.socket) {
      // Firs disconnect!
      return this.socket;
    }
    const optsAny: any = opts;
    const path = `${MyConstants.SOCKET_IO_ROOT}socket.io`;
    let uri = MyConstants.SRV_ROOT;
    if (uri.startsWith('/')) {
      uri = '/';
    }
    this.socket = io(uri, {
      path: path,
      extraHeaders: optsAny,
    });
    if (waitUntilConnection) {
      await this.waitUntilConnection();
    }
    return this.socket;
  }

  async endConnection() {
    if (!this.socket) {
      return;
    }
    console.log(`endConnection! ${this.instanceId}`);
    this.socket.disconnect();
    this.socket = null;
    this.removeInstance(this.instanceId);
  }

  async emitEvent(eventName: string, payload: any) {
    if (!this.socket) {
      return;
    }
    this.socket.emit(eventName, payload);
  }

  unregisterAllProcessors(eventName?: string) {
    //console.log(`unregisterAllProcessors...`);
    if (!this.socket) {
      console.log(`unregisterAllProcessors... no socket`);
      return;
    }
    this.socket.removeAllListeners(eventName);
    //console.log(`unregisterAllProcessors... OK`);
  }

  registerProcessor(eventName: string, processor: (message: any) => void) {
    if (!this.socket) {
      return;
    }
    this.socket.on(eventName, processor);
  }

  registerProcessorOnce(eventName: string, processor: (message: any) => void) {
    if (!this.socket) {
      return;
    }
    this.socket.once(eventName, processor);
  }

  getSocketId() {
    if (this.socket) {
      return this.socket.id;
    } else {
      return null;
    }
  }
}

@Injectable({
  providedIn: 'root',
})
export class CallService {
  instances: { [key: string]: CallServiceInstance } = {};
  constructor(private modalSrv: ModalService) {}

  getInstance(room?: string) {
    if (!room) {
      room = 'public';
    }
    let oldInstance = this.instances[room];
    if (!oldInstance) {
      const removeInstanceThis = this.removeInstance.bind(this);
      oldInstance = new CallServiceInstance(room, removeInstanceThis);
      this.instances[room] = oldInstance;
    }
    return oldInstance;
  }

  removeInstance(instanceId: string) {
    delete this.instances[instanceId];
  }

  isConnectedToRoom(instanceId: string) {
    let oldInstance = this.instances[instanceId];
    if (!oldInstance) {
      return false;
    }
    return oldInstance.socket?.connected === true;
  }
}
