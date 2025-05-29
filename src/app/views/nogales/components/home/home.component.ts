import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { TranslateService } from 'ejflab-front-lib';
import { Router } from '@angular/router';
import { MicrosoftAuthService, UserMicrosoft } from 'ejflab-front-lib';

export interface ClinicianData {
  id: string;
  txt: string;
  title?: string;
  name?: string;
  lastname?: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['../../nogales.css', './home.component.css'],
})
export class HomeComponent implements OnInit {
  @Input() currentUser: UserMicrosoft | null = null;
  clinicians: ClinicianData[] = [
    { id: 'edelgado', txt: '/edelgado' },
    { id: 'pepito', txt: '/pepito' },
  ];
  myControl = new FormControl<string | ClinicianData>('');
  filteredOptions: Observable<ClinicianData[]>;

  constructor(
    private translateSrv: TranslateService,
    private router: Router,
    public authSrv: MicrosoftAuthService
  ) {}

  ngOnInit() {
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map((value) => {
        return this._filter(value || '');
      })
    );
  }

  displayFn(user: ClinicianData): string {
    return user && user.txt ? user.txt : '';
  }

  private _filter(value: string | ClinicianData): ClinicianData[] {
    if (typeof value == 'string') {
      const filterValue = value.toLowerCase();
      return this.clinicians.filter((option) =>
        option.txt.toLowerCase().includes(filterValue)
      );
    } else {
      return [];
    }
  }

  setLang(key: string) {
    this.translateSrv.setLanguage(key);
  }

  isSelectedProvider() {
    const value: any = this.myControl.value;
    return [null, undefined, ''].indexOf(value) < 0 && typeof value == 'object';
  }

  redirectToWaitingRoom() {
    const value: any = this.myControl.value;
    this.router.navigate(['nogales', 'p', 'room', value.id]);
  }

  async logout() {
    await this.authSrv.logout();
  }

  async login() {
    await this.authSrv.login();
  }
}
