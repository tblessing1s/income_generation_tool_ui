// src/app/app-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CoveredCallEstimatorComponent } from './covered-call-estimator/covered-call-estimator.component';
import {HelpComponent} from './help/help.component';

export const routes: Routes = [
  { path: '', component: CoveredCallEstimatorComponent },
  { path: 'help', component: HelpComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
