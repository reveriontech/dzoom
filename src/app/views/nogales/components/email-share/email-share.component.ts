import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MMDDYYYYAdapter, multipleEmailValidator, CUSTOM_DATE_FORMATS } from 'ejflab-front-lib';
import { FileService } from 'ejflab-front-lib';
import { MailSendData, MailService } from 'ejflab-front-lib';
import { ModalService } from 'ejflab-front-lib';
import { MyDatesFront } from '@ejfdelgado/ejflab-common/src/MyDatesFront';
import { MyTemplate } from '@ejfdelgado/ejflab-common/src/MyTemplate';
import { NogalesUtiles } from '../../nogalesutiles';
import { RoomGroup } from '../account-dashboard/account-dashboard.component';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateService } from 'ejflab-front-lib';
import { MyUtilities } from '@ejfdelgado/ejflab-common/src/MyUtilities';
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';

export interface MultiLanguageText {
  [key: string]: string;
}

@Component({
  selector: 'app-email-share',
  templateUrl: './email-share.component.html',
  styleUrls: ['../../nogales.css', './email-share.component.css'],
  providers: [
    { provide: DateAdapter, useClass: MMDDYYYYAdapter },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },
  ]
})
export class EmailShareComponent implements OnInit {
  form: FormGroup;
  minDate: Date = new Date();
  //date: Date | null = null;
  selectedPath: string;
  template: MultiLanguageText;
  subject: MultiLanguageText;
  rawBodyTemplate: MultiLanguageText;
  belowText: MultiLanguageText;
  renderer = new MyTemplate();
  renderingData: any = {
    provider: {
      name: '',
      email: '',
    },
    hasDate: false,
  };
  languages: any = [
    { id: 'en', txt: 'English' },
    { id: 'es', txt: 'Spanish (Español)' },
  ];
  roomGroups: RoomGroup[];
  myOwnPath: string;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EmailShareComponent>,
    public fileService: FileService,
    public mailService: MailService,
    private modalSrv: ModalService,
    public sanitizer: DomSanitizer,
    private translateSrv: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.selectedPath = data.selectedPath;
    this.roomGroups = data.roomGroups;
    this.myOwnPath = data.myOwnPath;
    if (data.provider) {
      this.renderingData.provider.name = data.provider.name;
      this.renderingData.provider.email = data.provider.username;// Weird, but yes
    }
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      recipients: [
        '',
        [
          Validators.required,
          Validators.maxLength(128),
          multipleEmailValidator(10),
        ],
      ],
      invitation: ['', [Validators.required, Validators.maxLength(1000)]],
      language: ['en', [Validators.required]],
      date: [null],
      time: [''],
    });
    this.loadBodyInformation();
    this.setTimeRequired(false);

    this.form.controls['language'].valueChanges.subscribe((value) => {
      this.updateLanguage();
      this.updateUrlOrLanguage();
      this.updateDateTimeOrLanguage();
    });
    this.form.controls['time'].valueChanges.subscribe((value) => {
      this.setTime(value);
      this.updateDateTimeOrLanguage();
    });

    this.form.controls['date'].valueChanges.subscribe((value) => {
      if (value instanceof Date) {
        this.setTimeRequired(true);
      } else {
        this.setTimeRequired(false);
      }
      this.updateDateTimeOrLanguage();
    });
  }

  get recipients() {
    return this.form.get('recipients');
  }

  get invitation() {
    return this.form.get('invitation');
  }

  get language() {
    return this.form.get('language');
  }

  /*
  get date() {
    return this.form.get('date');
  }

  set date(val) {
    this.form.patchValue({ date: val });
  }
  */

  cancel() {
    this.dialogRef.close();
  }

  async sendMessageTest() {
    const date = this.form.get('date')?.getRawValue();
    //console.log(date);
  }

  async sendMessage() {
    const language = this.form.get('language')?.getRawValue();
    if (!language) {
      return;
    }
    if (!this.form.valid) {
      const alertContent: any = {};
      alertContent.title = await this.translateSrv.translate(
        'room.mail.alert_err_title',
        ['nogales']
      );
      alertContent.txt = await this.translateSrv.translate(
        'room.mail.alert_err_text',
        ['nogales']
      );
      this.modalSrv.alert(alertContent);
      return;
    }
    const recipientsControl = this.form.get('recipients');
    const invitationControl = this.form.get('invitation');
    if (!recipientsControl || !invitationControl) {
      return;
    }

    const recipients = recipientsControl.getRawValue();
    this.renderingData.extra = MyUtilities.htmlEntities(
      invitationControl.getRawValue()
    );

    const subjectRendered = this.renderer.render(
      this.subject[language],
      this.renderingData
    );

    const request: MailSendData = {
      to: recipients,
      template: this.template[language],
      subject: subjectRendered,
      params: this.renderingData,
      replyTo: this.renderingData.provider.email
    };
    //console.log(JSON.stringify(request, null, 4));
    await this.mailService.send(request);
    // Alert sent message
    this.modalSrv.alert({
      title: 'Notification',
      txt: 'Email is sent!',
      autoCloseMilis: 1000,
    });
    this.dialogRef.close();
  }

  updateDateTimeOrLanguage() {
    const languageControl = this.form.get('language');
    const dateControl = this.form.get('date');
    const timeControl = this.form.get('time');
    if (!languageControl || !dateControl || !timeControl) {
      return;
    }
    const language = languageControl.getRawValue();
    const dateValue = dateControl.getRawValue();
    const timeValue = timeControl.getRawValue();
    let whenTxt = '';
    if (dateValue) {
      MyDatesFront.autoConfigure(language);
      whenTxt = MyDatesFront.formatDate(dateValue);
      MyDatesFront.autoConfigure();
    }
    this.renderingData.date = whenTxt;
    this.renderingData.time = timeValue;
    this.renderingData.hasDate = !!whenTxt;
  }

  updateUrlOrLanguage() {
    const languageControl = this.form.get('language');
    if (!languageControl || !this.belowText) {
      return;
    }
    const language = languageControl.getRawValue();
    this.renderingData.url =
      NogalesUtiles.getRoomUrlFromPath(this.selectedPath) + `?l=${language}`;
    // Update below text
    this.renderingData.below = this.sanitizer.bypassSecurityTrustHtml(
      this.renderer.render(this.belowText[language], this.renderingData)
    );
  }

  updateLanguage() {
    const languageControl = this.form.get('language');
    const invitationControl = this.form.get('invitation');
    if (!languageControl || !this.rawBodyTemplate || !invitationControl) {
      return;
    }
    const language = languageControl.getRawValue();
    this.renderingData.extra = this.renderer.render(
      this.rawBodyTemplate[language],
      this.renderingData
    );
    invitationControl.setValue(this.renderingData.extra);
  }

  getRoot() {
    return MyConstants.SRV_ROOT;
  }

  async loadBodyInformation() {
    const emailTemplateText = await this.fileService.readPlainText(
      `assets/nogales/email_template.json`
    );
    const emailTemplate = JSON.parse(emailTemplateText);
    const { subject, rawText, template, belowText } = emailTemplate;
    this.template = template;
    this.subject = subject;
    this.rawBodyTemplate = rawText;
    this.belowText = belowText;
    this.updateLanguage();
    this.updateUrlOrLanguage();
    this.updateDateTimeOrLanguage();
  }

  setTime(val: string) {
    if (!val) {
      return;
    }
    const parts = /^(\d+):(\d+)\s(am|pm)/i.exec(val);
    if (!parts) {
      return;
    }
    const [all, hourTxt, minutesTxt, ampmTxt] = parts;
    const hour = parseInt(hourTxt);
    const minutes = parseInt(minutesTxt);
    const ampm = ampmTxt.toLocaleLowerCase();
    //console.log(`${hour} ${minutes} ${ampm}`);
  }

  deleteDateTime() {
    this.form.get('date')?.setValue('');
    this.form.get('time')?.setValue('');
    this.setTimeRequired(false);
  }

  roomChange(room: string) {
    this.selectedPath = room;
    this.updateUrlOrLanguage();
  }

  setTimeRequired(required: boolean) {
    const reference = this.form.get('time');
    if (!reference) {
      return;
    }
    if (required) {
      reference.setValidators([Validators.required]);
      reference.enable();
    } else {
      reference.setValidators([]);
      reference.disable();
    }
    reference.updateValueAndValidity();
  }
}
