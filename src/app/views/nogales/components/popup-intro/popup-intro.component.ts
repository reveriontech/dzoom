import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IntroDetailData } from '../room-intro/room-intro.component';

@Component({
  selector: 'app-popup-intro',
  templateUrl: './popup-intro.component.html',
  styleUrls: ['../../nogales.css', './popup-intro.component.css']
})
export class PopupIntroComponent {
  popUpIntro: Array<IntroDetailData> = [];
  constructor(
    private dialogRef: MatDialogRef<PopupIntroComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data.popUpIntro) {
      this.popUpIntro = data.popUpIntro;
    }
  }

  cancel() {
    this.dialogRef.close({
      skip: false,
    });
  }

  dontShowAgain() {
    this.dialogRef.close({
      skip: true,
    });
  }
}
