import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';
import {
  provideAnalytics,
  getAnalytics,
  ScreenTrackingService,
  UserTrackingService,
} from '@angular/fire/analytics';
import { MycommonModule, JwtInterceptor } from 'ejflab-front-lib';
import { CommonModule } from '@angular/common';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { MatDialogModule } from '@angular/material/dialog';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [AppComponent],
  imports: [
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    BrowserAnimationsModule,
    MatDialogModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MycommonModule,
  ],
  providers: [
    ScreenTrackingService,
    UserTrackingService,
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAnalytics(() => getAnalytics()),
    provideAuth(() => getAuth()),
    provideDatabase(() => getDatabase()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    // Provide a value to be used by Angular's dependency injection
    // machanism to pass 
    { provide: 'appVersion', useValue: '1.17.1' },
    { provide: 'authProvider', useValue: 'microsoft' },
    { provide: 'msTenant', useValue: 'e03b8fb1-7e35-4dab-ae1e-aa681402dbf2' },
    { provide: 'msClientId', useValue: '4c1062f0-7409-4597-9eac-21b87ac6005e' },
    {
      provide: "msGroupIdMap", useValue: {
        "3769f35a-1b70-4df1-be52-4ad257a1916e": "apps_admin",
        "4bb739b5-7146-4d56-b47d-255df3f9e1b2": "apps_dev",
        "acb90354-8c08-4048-8dab-824d988c1f2f": "apps_editors",
        "08890eb7-cd82-4fe5-9b47-4225cf40a0f1": "apps_historians",
        "2c6671c4-b274-44bd-ae9b-f5647671f31a": "apps_importer",
        "45874332-7cf5-4047-ba57-2ecd9183b7fc": "apps_videocall_admin",
        "73bcb929-0ca6-4b52-9edd-4ac39e6d6e9e": "apps_videocall_provider"
      }
    }
  ],
  exports: [

  ],
  bootstrap: [AppComponent],
})
export class AppModule { }