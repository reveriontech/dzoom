import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NogalesRoutingModule } from './nogales-routing.module';
import { NogalesComponent } from './nogales.component';
import { ProviderComponent } from './components/provider/provider.component';
import { HomeComponent } from './components/home/home.component';
import { MycommonModule, SincePipe } from 'ejflab-front-lib';

import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { WaitingroomComponent } from './components/waitingroom/waitingroom.component';
import { PopupwaitingroomComponent } from './components/popupwaitingroom/popupwaitingroom.component';
import { TopcontrolComponent } from './components/topcontrol/topcontrol.component';
import { TextchatComponent } from './components/textchat/textchat.component';
import { PatientQueueListComponent } from './components/patient-queue-list/patient-queue-list.component';
import { DoctorListComponent } from './components/doctor-list/doctor-list.component';
import { AccountDashboardComponent } from './components/account-dashboard/account-dashboard.component';
import { EmailShareComponent } from './components/email-share/email-share.component';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { SelectRoomComponent } from './components/select-room/select-room.component';
import { PopupconfigdevicesComponent } from './components/popupconfigdevices/popupconfigdevices.component';
import { VideoCallComponent } from './components/video-call/video-call.component';
import { PatientDetailComponent } from './components/patient-detail/patient-detail.component';
import { RoomIntroComponent } from './components/room-intro/room-intro.component';
import { NgxEditorModule } from 'ngx-editor';
import { PopupIntroComponent } from './components/popup-intro/popup-intro.component';
import { RoomSettingsComponent } from './components/room-settings/room-settings.component';
import { SimpleTabComponent } from './components/simple-tab/simple-tab.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { SettingsProfileComponent } from './components/settings-profile/settings-profile.component';
import { SettingsClinicComponent } from './components/settings-clinic/settings-clinic.component';
import { PopupSharedroomUsersComponent } from './components/settings-popup/popup-sharedroom-users/popup-sharedroom-users.component';
import { PopupSharedroomCreateComponent } from './components/settings-popup/popup-sharedroom-create/popup-sharedroom-create.component';
import { PaginationComponent } from './components/pagination/pagination.component';

@NgModule({
  //schemas: [NO_ERRORS_SCHEMA],
  declarations: [
    NogalesComponent,
    ProviderComponent,
    HomeComponent,
    WaitingroomComponent,
    PopupwaitingroomComponent,
    TopcontrolComponent,
    TextchatComponent,
    PatientQueueListComponent,
    DoctorListComponent,
    AccountDashboardComponent,
    EmailShareComponent,
    SelectRoomComponent,
    PopupconfigdevicesComponent,
    VideoCallComponent,
    PatientDetailComponent,
    RoomIntroComponent,
    PopupIntroComponent,
    RoomSettingsComponent,
    SimpleTabComponent,
    SettingsProfileComponent,
    SettingsClinicComponent,
    PopupSharedroomUsersComponent,
    PopupSharedroomCreateComponent,
    PaginationComponent,
  ],
  imports: [
    CommonModule,
    NogalesRoutingModule,
    MatAutocompleteModule,
    MatIconModule,
    MycommonModule,
    FormsModule,
    MatMenuModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    MatSelectModule,
    NgxMaterialTimepickerModule,
    NgxEditorModule,
    MatExpansionModule
  ],
})
export class NogalesModule { }
