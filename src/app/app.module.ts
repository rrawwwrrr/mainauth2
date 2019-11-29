import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
registerLocaleData(localeRu, 'ru');
import { MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { JwtInterceptor, ErrorInterceptor } from './_helpers';
import {
  MatAutocompleteModule,
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule,
  MatDatepickerModule,
  MatDialogModule,
  MatExpansionModule,
  MatGridListModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatNativeDateModule,
  MatPaginatorModule,
  MatProgressBarModule,
  MatProgressSpinnerModule,
  MatRadioModule,
  MatRippleModule,
  MatSelectModule,
  MatFormFieldModule,
  MatSidenavModule,
  MatSliderModule,
  MatSlideToggleModule,
  MatSnackBarModule,
  MatSortModule,
  MatTableModule,
  MatTabsModule,
  MatToolbarModule,
  MatTooltipModule,
  MatTreeModule,
  MatBadgeModule,
} from '@angular/material';
import { DataService } from './_services';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HomeComponent } from './home';
import { LoginComponent } from './login';
import { NorrisComponent } from './www/norris/norris.component';
import { UsersRefComponent } from './www/reference/users/users.ref.component';
import { AdminUsersComponent, AdminUsersAddComponent } from './admin/users/admin.users.component';
import { StatisticsVoipComponent } from './statistics/voip/statistics.voip.component';
import { SecretarComponent, SecretarAddComponent, SecretarEditComponent } from './www/secretar/secretar.component';
import { MyFilesAddComponent, MyFilesEditComponent, MyFilesComponent } from './help/myfiles/myfiles.component';
import {
  IsppodrsRefComponent, IsppodrsRefAddDigalogComponent, IsppodrsRefEditDigalogComponent
} from './www/reference/isppodr/isppodr.ref.component';
import { GeoRefComponent } from './www/reference/geo/geo.component';
import { AboutMeComponent } from './www/reference/aboutme/aboutme.component';
import {
  OziContractsComponent,
  OziContractsDialogAddComponent,
  OziContractsDialogEditComponent,
  OziContractsDialogShowSigningComponent
} from './www/jurnals/contracts/ozi.component';
import {
  UipComponent,
  UipDialogAddComponent,
  UipDialogEditComponent
} from './www/jurnals/uip/uip.component';
import {
  DispatcherComponent,
  DispatcherDialogAddComponent,
  DispatcherDialogAddContactComponent
} from './www/dispatcher/dispatcher.component';
export const MY_FORMATS = {
  parse: {
    dateInput: 'D/MM/YYYY'
  },
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: 'MMMM Y',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM Y'
  }
};
import { AdminTrunkComponent, AdminTrunkAddComponent } from './admin/trunk/admin.trunk.component';
@NgModule({
  declarations: [
    AppComponent,
    AdminUsersComponent, AdminUsersAddComponent,
    NorrisComponent,
    DispatcherComponent, DispatcherDialogAddComponent, DispatcherDialogAddContactComponent,
    UsersRefComponent,
    OziContractsComponent, OziContractsDialogAddComponent, OziContractsDialogEditComponent,
    OziContractsDialogShowSigningComponent,
    GeoRefComponent,
    IsppodrsRefComponent,
    AdminTrunkComponent,
    AdminTrunkAddComponent,
    IsppodrsRefAddDigalogComponent, IsppodrsRefEditDigalogComponent,
    UipComponent, UipDialogAddComponent, UipDialogEditComponent,
    StatisticsVoipComponent,
    SecretarComponent, SecretarAddComponent, SecretarEditComponent,
    MyFilesAddComponent, MyFilesEditComponent, MyFilesComponent,
    AboutMeComponent,
    HomeComponent,
    LoginComponent
  ],
  entryComponents: [
    OziContractsComponent, OziContractsDialogAddComponent, OziContractsDialogEditComponent,
    OziContractsDialogShowSigningComponent,
    AdminUsersComponent,
    AdminUsersAddComponent,
    AdminTrunkComponent,
    AdminTrunkAddComponent,
    DispatcherComponent, DispatcherDialogAddComponent, DispatcherDialogAddContactComponent,
    IsppodrsRefComponent, IsppodrsRefAddDigalogComponent, IsppodrsRefEditDigalogComponent,
    SecretarComponent, SecretarAddComponent, SecretarEditComponent,
    UipComponent, UipDialogAddComponent, UipDialogEditComponent,
    MyFilesAddComponent, MyFilesEditComponent, MyFilesComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    HttpClientModule,
    NoopAnimationsModule,
    BrowserAnimationsModule,
    FormsModule,
    MatProgressBarModule,
    MatDialogModule,
    MatTabsModule,
    MatTreeModule,
    MatSidenavModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatFormFieldModule,
    MatExpansionModule,
    MatCardModule,
    MatMenuModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatSelectModule,
    MatGridListModule,
    MatBadgeModule,
    MatInputModule,
    MatAutocompleteModule,
    MatPaginatorModule,
    MatSortModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatTooltipModule,
    MatIconModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatButtonModule,
    MatTableModule,
    BrowserAnimationsModule,
    MatRadioModule,
    MatRippleModule,
    MatSliderModule,
    MatSlideToggleModule,
    AppRoutingModule,
  ],
  providers: [
    [DataService],
    { provide: MAT_DATE_LOCALE, useValue: 'ru-RU' },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS/* MAT_MOMENT_DATE_FORMATS */ },
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
