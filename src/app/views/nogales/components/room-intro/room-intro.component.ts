import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { FileBase64Data, HttpService, ImagepickerOptionsData, ModalService } from 'ejflab-front-lib';
import { Editor, toHTML, Toolbar } from 'ngx-editor';
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';

export enum CardType {
  text = "text",
  image = "image",
  video = "video"
}

export interface IntroDetailData {
  type: CardType;
  value: any;
  confirmed: boolean;
  created?: number;
  updated?: number;
}

export interface IntroMasterData {
  created: number;
  updated: number;
  list: IntroDetailData[];
}

@Component({
  selector: 'app-room-intro',
  templateUrl: './room-intro.component.html',
  styleUrls: ['../../nogales.css', './room-intro.component.css'],
})
export class RoomIntroComponent implements OnInit, OnDestroy {
  @Input() edit: boolean;
  @Input() list: Array<IntroDetailData>;
  @Input() roomName: string;
  @Input() type: string;
  @Input() isChanged: boolean;
  @Output() save: EventEmitter<void> = new EventEmitter();
  @Output() delete: EventEmitter<void> = new EventEmitter();
  @Output() cancel: EventEmitter<void> = new EventEmitter();
  @Output() changed: EventEmitter<any> = new EventEmitter();
  currentChooseTypeRow: null | number = null;
  videoUrl: string = '';
  forms: Array<FormGroup> = [];
  textModels: Array<string> = [];
  textEditors: Array<Editor> = [];
  toolbar: Toolbar = [
    // default value
    ['bold', 'italic'],
    ['underline', 'strike'],
    //['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3'] }],
    //['link', 'image'],
    // or, set options for link:
    [{ link: { showOpenInNewTab: false } }],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
    ['horizontal_rule', 'format_clear', 'indent', 'outdent'],
    ['superscript', 'subscript'],
    ['undo', 'redo'],
  ];
  imageOptions: ImagepickerOptionsData = {
    isEditable: true,
    isRounded: false,
    useBackground: true,
    defaultImage: MyConstants.PAGE.DEFAULT_IMAGE,
    imageStyle: {
      'min-width': '100%',
      'max-width': '100%',
      'border-radius': '5px',
      'background-color': 'white',
    },
  };
  MAPPING_NAME: { [key: string]: string } = {
    "top": "Top",
    "bottom": "Bottom",
    "popup": "Pop Up",
  }

  constructor(
    private modalSrv: ModalService,
    private sanitizer: DomSanitizer,
    private fb: FormBuilder,
    public httpSrv: HttpService,
  ) {

  }

  ngOnInit(): void {
    this.imageOptions.isEditable = this.edit;
  }

  ngOnDestroy(): void {
    //
  }

  getTypeName() {
    if (this.type in this.MAPPING_NAME) {
      return this.MAPPING_NAME[this.type];
    }
    return "Unknown";
  }

  chooseTypeOfCard(row: number | null) {
    this.videoUrl = '';
    this.currentChooseTypeRow = row;
  }

  async eraseCard(row: number) {
    const confirmed = await this.modalSrv.confirm({ title: 'Sure?', txt: "Card will be deleted" });
    if (!confirmed) {
      return;
    }
    this.list.splice(row, 1);
    this.changed.emit();
  }

  async moveCard(row: number, down: boolean) {
    if (down) {
      // Romove actual element
      const actual = this.list.splice(row, 1)[0];
      this.list.splice(row + 1, 0, actual);
    } else {
      const actual = this.list.splice(row, 1)[0];
      this.list.splice(row - 1, 0, actual);
    }
    this.changed.emit();
  }

  async addCardAt(row: number, type: string) {
    const typeEnum: CardType = type as CardType;
    this.currentChooseTypeRow = null;
    // Prepare form
    let defaultValue = null;
    if (type == "video") {
      this.forms[row] = this.fb.group({
        videoUrl: ['', [Validators.required]],
      });
    } else if (type == "text") {
      this.textEditors[row] = new Editor();
    } else if (type == "image") {
      defaultValue = MyConstants.PAGE.DEFAULT_IMAGE;
    }
    this.list.splice(row, 0, {
      type: typeEnum,
      value: defaultValue,
      confirmed: false
    });
    this.changed.emit();
  }

  async goBackToChoice(row: number) {
    if (!this.list[row].confirmed) {
      this.list.splice(row, 1);
      this.currentChooseTypeRow = row;
    }
    this.disposeForms(row);
  }

  disposeForms(row: number) {
    if (this.forms[row]) {
      delete this.forms[row];
    }
    if (this.textEditors[row]) {
      this.textEditors[row].destroy();
      delete this.textEditors[row];
    }
    delete this.textModels[row];
  }

  async applyText(row: number) {
    const actualValue = this.textModels[row];
    let html = '';
    if (typeof actualValue == 'string') {
      html = actualValue;
    } else {
      html = toHTML(this.textModels[row] as any);
    }
    const sanitized = this.sanitizer.bypassSecurityTrustHtml(html);
    this.list[row].value = sanitized;
    this.list[row].confirmed = true;
    this.disposeForms(row);
    this.changed.emit();
  }

  async applyVideo(row: number) {
    if (!this.forms[row].valid) {
      this.modalSrv.alert({ title: 'Ups!', txt: "Please verify the field" });
      return;
    }

    let videoUrl = this.forms[row].get('videoUrl')?.value;
    const groups = /https:\/\/youtu\.be\/(.*)\?/.exec(videoUrl);
    if (groups) {
      videoUrl = `https://www.youtube.com/embed/${groups[1]}`;
    }

    this.list[row].value = this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);
    this.list[row].confirmed = true;
    this.disposeForms(row);
    this.changed.emit();
  }

  async editText(row: number) {
    let html = '';
    const oldValue = this.list[row].value;
    if (typeof oldValue == 'string') {
      html = oldValue;
    } else {
      const oldText: any = oldValue as SafeHtml;
      html = oldText['changingThisBreaksApplicationSecurity'];
    }
    this.textModels[row] = html;
    this.textEditors[row] = new Editor();
  }

  async changedImage(imagenBase64: FileBase64Data, row: number) {
    if (imagenBase64.base64) {
      const currentSearchBlob = await this.httpSrv.b64toBlob(
        imagenBase64.base64
      );
      const currentSearchImage = URL.createObjectURL(currentSearchBlob);
      this.list[row].value = currentSearchImage;
    }
    this.changed.emit();
  }

  getPageImage(row: number): string | null {
    if (typeof this.list[row].value == "string") {
      return this.list[row].value;
    }
    return null;
  }

  async goBack() {
    if (this.isChanged) {
      const save = await this.modalSrv.confirm({ title: "Warning", txt: "Do yo want to save changes?" });
      if (save) {
        this.save.emit();
        return;
      }
    }
    this.cancel.emit();
  }
}
