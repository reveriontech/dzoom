import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CheckRoutingModule } from './check-routing.module';
import { CheckComponent } from './check.component';

import { MatIconModule } from '@angular/material/icon';
import { MycommonModule } from 'ejflab-front-lib';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';


@NgModule({
  declarations: [
    CheckComponent
  ],
  imports: [
    CommonModule,
    CheckRoutingModule,
    MycommonModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    MatMenuModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
  ]
})
export class CheckModule { }
