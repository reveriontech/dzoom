import { Component, EventEmitter, OnDestroy, OnInit, viewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpService, MicrosoftAuthService, ModalService, UserMicrosoft } from 'ejflab-front-lib';
import { Validators } from 'ngx-editor';
import { MatAccordion } from '@angular/material/expansion';
import { Subscription } from 'rxjs';

export interface UserDb {
  userId: string;
  created: number;
  updated: number;
  email: string;
  title: string;
  name: string;
  middleName: string;
  lastName: string;
}

export interface UserDetailDb {
  userId: string;
  created: number;
  updated: number;
  jobTitle: string;
}

// https://material.angular.io/components/expansion/overview
@Component({
  selector: 'app-settings-profile',
  templateUrl: './settings-profile.component.html',
  styleUrls: ['../../nogales.css', './settings-profile.component.css'],
})
export class SettingsProfileComponent implements OnInit, OnDestroy {
  accordion = viewChild.required(MatAccordion);
  formPersonal: FormGroup;
  formProfessional: FormGroup;
  currentPanelId: string | null = null;
  actualSubscription: Subscription | null = null;
  profilePreReadEvents: EventEmitter<any> = new EventEmitter();
  state: any = {
    personalLoaded: false,
    professionalLoaded: false,
  };
  titles: any = [
    { id: 'dr' },
    { id: 'sr' },
    { id: 'sra' },
    { id: 'srta' },
    { id: 'mx' },
    { id: '--' },
  ];

  constructor(
    private fb: FormBuilder,
    private modalSrv: ModalService,
    public httpSrv: HttpService,
    public authSrv: MicrosoftAuthService,
  ) {
    this.profilePreReadEvents.subscribe((data) => {
      Object.assign(this.state, data);
      if (this.state.authenticated) {
        if (this.state.panelId == "personal" && !this.state.personalLoaded) {
          this.loadPersonalInformation();
        } else if (this.state.panelId == "professional" && !this.state.professionalLoaded) {
          this.loadProfessionalInformation();
        }
      }
    });
  }
  ngOnDestroy(): void {
    if (this.actualSubscription) {
      this.actualSubscription.unsubscribe();
    }
  }
  ngOnInit(): void {
    this.formPersonal = this.fb.group({
      title: ['--', [Validators.required]],
      name: ['', [Validators.required]],
      middleName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
    });
    this.formProfessional = this.fb.group({
      jobTitle: ['', []],
    });

    this.actualSubscription = this.authSrv.onAuthStateChanged(
      async (user: UserMicrosoft | null) => {
        if (user) {
          this.profilePreReadEvents.emit({ authenticated: true });
        } else {
          this.profilePreReadEvents.emit({ authenticated: false });
        }
      });
  }

  updateState(panelId: string, opened: boolean) {
    if (opened) {
      this.currentPanelId = panelId;
      this.profilePreReadEvents.emit({ panelId });
    } else {
      this.currentPanelId = null;
      this.profilePreReadEvents.emit({ panelId: null });
    }
  }

  async loadPersonalInformation() {
    const response: UserDb | null = await this.httpSrv.get("/srv/nogales/user/own");
    if (response) {
      this.formPersonal.get("title")?.setValue(response.title);
      this.formPersonal.get("name")?.setValue(response.name);
      this.formPersonal.get("middleName")?.setValue(response.middleName);
      this.formPersonal.get("lastName")?.setValue(response.lastName);
    }
    this.state.personalLoaded = true;
  }

  async loadProfessionalInformation() {
    const response: UserDetailDb | null = await this.httpSrv.get("/srv/nogales/user_detail/own");
    if (response) {
      this.formProfessional.get("jobTitle")?.setValue(response.jobTitle);
    }
    this.state.professionalLoaded = true;
  }

  async cancel() {
    this.accordion().closeAll();
  }

  async savePersonalInformation() {
    if (!this.formPersonal.valid) {
      await this.modalSrv.alert({
        title: "popup.verify.title",
        txt: "popup.verify.txt",
        translateFolder: "nogales"
      });
      return;
    }

    const payload = {
      title: this.formPersonal.get("title")?.getRawValue(),
      name: this.formPersonal.get("name")?.getRawValue(),
      middle_name: this.formPersonal.get("middleName")?.getRawValue(),
      last_name: this.formPersonal.get("lastName")?.getRawValue(),
    };
    const response = await this.httpSrv.post("/srv/nogales/user/own", payload);
    await this.modalSrv.alert({
      title: "room.base.settings.tabs.profile.popup.success.title",
      txt: "room.base.settings.tabs.profile.popup.success.txt",
      translateFolder: "nogales"
    });
    this.accordion().closeAll();
  }

  async saveProfessionalInformation() {
    if (!this.formProfessional.valid) {
      await this.modalSrv.alert({
        title: "popup.verify.title",
        txt: "popup.verify.txt",
        translateFolder: "nogales"
      });
      return;
    }
    const payload = {
      jobTitle: this.formProfessional.get("jobTitle")?.getRawValue(),
    };
    const response = await this.httpSrv.post("/srv/nogales/user_detail/own", payload);
    await this.modalSrv.alert({
      title: "room.base.settings.tabs.profile.popup.success.title",
      txt: "room.base.settings.tabs.profile.popup.success.txt",
      translateFolder: "nogales"
    });
    this.accordion().closeAll();
  }
}
