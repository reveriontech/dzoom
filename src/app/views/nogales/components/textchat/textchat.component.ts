import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MyDatesFront } from '@ejfdelgado/ejflab-common/src/MyDatesFront';
import { MyUtilities } from '@ejfdelgado/ejflab-common/src/MyUtilities';
import { MyLocalUserData } from '../../nogales.component';

export interface MessageData {
  author: {
    uid: string;
  };
  date?: number;
  text: string;
}

@Component({
  selector: 'app-textchat',
  templateUrl: './textchat.component.html',
  styleUrls: ['./textchat.component.css', '../../nogales.css'],
})
export class TextchatComponent implements OnInit, OnDestroy {
  self: any;
  messageText: string = '';
  @Input() messages: Array<MessageData> = [];
  @Input() people: { [key: string]: MyLocalUserData } = {};
  @Input() socketId?: string | null;
  @Input() currentUserUID?: string | null;
  @Input() roomName: string;
  @Input() connectionState: string;
  @Input() chatSetSawProcessor: Function;
  @Output() sendMessage: EventEmitter<string> = new EventEmitter();
  @ViewChild('messages_list') messagesList: ElementRef;
  lastScrolledSize = 0;
  EMPTY_HTML: SafeHtml;
  updateSawInterval: any;
  @Input() isOpened: boolean;
  @Output() toggleOpenCloseChat: EventEmitter<void> = new EventEmitter();
  @Output() closeRoom: EventEmitter<void> = new EventEmitter();

  MAX_CHAT_LENGTH = 200;

  constructor(public sanitizer: DomSanitizer) {
    this.self = this;
    this.EMPTY_HTML = this.sanitizer.bypassSecurityTrustHtml('');
    this.updateSawInterval = setInterval(() => {
      // Only do this if the chat is opened
      this.chatSetSawProcessor();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.updateSawInterval) {
      clearInterval(this.updateSawInterval);
    }
  }

  getCurrentUserUID() {
    return this.currentUserUID;
  }

  ngOnInit(): void {}

  async sendMessageLocal() {
    const len = this.messageText.trim().length;
    if (len == 0) {
      return;
    }
    if (len > this.MAX_CHAT_LENGTH) {
      return;
    }
    this.sendMessage.emit(this.messageText);
    requestAnimationFrame(() => {
      this.messageText = '';
      this.scrollToBottom();
    });
  }

  async textAreaKeyDown(event: any) {
    if (this.messageText.trim().length == 0) {
      return;
    }
    if (event.key == 'Enter') {
      await this.sendMessageLocal();
    }
  }

  scrollToBottom(): void {
    if (!this.messages || this.messages.length == this.lastScrolledSize) {
      return;
    }
    this.lastScrolledSize = this.messages.length;
    try {
      this.messagesList.nativeElement.scrollTop =
        this.messagesList.nativeElement.scrollHeight;
    } catch (err) {}
  }

  getOtherName() {
    if (this.people && this.currentUserUID) {
      const roomName = this.roomName;
      let otherId: string = '';
      if (roomName.startsWith(this.currentUserUID)) {
        otherId = roomName.replace(this.currentUserUID + '_', '');
      } else if (roomName.endsWith(this.currentUserUID)) {
        otherId = roomName.replace('_' + this.currentUserUID, '');
      }
      const person = this.people[otherId];
      if (person) {
        const localScope = {
          name: MyUtilities.htmlEntities(person.name),
        };
        const lan = MyDatesFront.getSelectedLanguage();
        if (lan == 'es') {
          return `Chat con ${localScope.name}`;
        } else {
          return `Chat with ${localScope.name}`;
        }
      }
    }
    return 'Chat';
  }
}
