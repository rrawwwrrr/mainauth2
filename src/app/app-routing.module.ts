import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home';
import { LoginComponent } from './login';
import { AuthGuard } from './_guards';
import { NorrisComponent } from './www/norris/norris.component';
import { UsersRefComponent } from './www/reference/users/users.ref.component';
import { AdminUsersComponent } from './admin/users/admin.users.component';
import { AdminTrunkComponent } from './admin/trunk/admin.trunk.component';
import { SecretarComponent } from './www/secretar/secretar.component';
import { IsppodrsRefComponent } from './www/reference/isppodr/isppodr.ref.component';
import { GeoRefComponent } from './www/reference/geo/geo.component';
import { OziContractsComponent } from './www/jurnals/contracts/ozi.component';
import { UipComponent } from './www/jurnals/uip/uip.component';
import { DispatcherComponent } from './www/dispatcher/dispatcher.component';
import { AboutMeComponent } from './www/reference/aboutme/aboutme.component';
import { StatisticsVoipComponent } from './statistics/voip/statistics.voip.component';
import { MyFilesComponent } from './help/myfiles/myfiles.component';
const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'norris', component: NorrisComponent, canActivate: [AuthGuard] },
  { path: 'disp', component: DispatcherComponent, canActivate: [AuthGuard] },
  { path: 'ozi', component: OziContractsComponent, canActivate: [AuthGuard] },
  { path: 'uip', component: UipComponent, canActivate: [AuthGuard] },
  { path: 'ref/users', component: UsersRefComponent },
  { path: 'ref/isp', component: IsppodrsRefComponent, canActivate: [AuthGuard] },
  { path: 'ref/geo', component: GeoRefComponent, canActivate: [AuthGuard] },
  { path: 'ref/me', component: AboutMeComponent, canActivate: [AuthGuard] },
  { path: 'admin/users', component: AdminUsersComponent, canActivate: [AuthGuard] },
  { path: 'stat/voip', component: StatisticsVoipComponent, canActivate: [AuthGuard] },
  { path: 'admin/trunk', component: AdminTrunkComponent, canActivate: [AuthGuard] },
  { path: 'check', component: SecretarComponent, canActivate: [AuthGuard] },
  { path: 'help/myfiles', component: MyFilesComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
