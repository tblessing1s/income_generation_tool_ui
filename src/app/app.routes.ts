// src/app/app-routing.module.ts

import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HelpComponent} from './help/help.component';
import {StrategyEstimatorComponent} from './strategy-estimator/strategy-estimator.component';

export const routes: Routes = [
  { path: '', component: StrategyEstimatorComponent },
  { path: 'help', component: HelpComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
