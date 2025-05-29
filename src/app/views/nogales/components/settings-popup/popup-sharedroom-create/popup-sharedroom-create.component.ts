import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpService, ModalService } from 'ejflab-front-lib';
import { Validators } from 'ngx-editor';

@Component({
  selector: 'app-popup-sharedroom-create',
  templateUrl: './popup-sharedroom-create.component.html',
  styleUrls: ['../../../nogales.css', '../../../nogales-popup.css', './popup-sharedroom-create.component.css'],
})
export class PopupSharedroomCreateComponent implements OnInit {
  form: FormGroup;
  create: boolean = false;
  old_name: string;
  old_title: string;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PopupSharedroomCreateComponent>,
    private modalSrv: ModalService,
    public httpSrv: HttpService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data.create == true) {
      this.create = true;
    }
    this.old_name = data.room_id;
    this.old_title = data.title;
  }
  ngOnInit(): void {
    this.form = this.fb.group({
      name: [this.old_name, [Validators.required]],
      title: [this.old_title, [Validators.required]],
    });
    if (!this.create) {
      this.form.get("name")?.disable();
    }
  }

  async cancel() {
    this.dialogRef.close();
  }

  async accept() {
    if (!this.form.valid) {
      await this.modalSrv.alert({
        title: "popup.verify.title",
        txt: "popup.verify.txt",
        translateFolder: "nogales"
      });
      return;
    }
    const payload = {
      room_id: this.form.get("name")?.getRawValue(),
      title: this.form.get("title")?.getRawValue(),
      is_public: 1,
      is_creation: this.create ? 1 : 0,
    };
    const response = await this.httpSrv.post("srv/nogales/room/create", payload);
    this.dialogRef.close({ created: true });
  }
}
