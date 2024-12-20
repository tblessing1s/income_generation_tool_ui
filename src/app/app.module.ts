import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgChartsModule} from 'ng2-charts';

import {CoveredCallEstimatorComponent} from './covered-call-estimator/covered-call-estimator.component';
import {AppComponent} from './app.component';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {MatTooltip} from '@angular/material/tooltip';
import {HelpComponent} from './help/help.component';
import {AppRoutingModule} from './app.routes';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatIcon} from '@angular/material/icon';
import {provideHttpClient} from '@angular/common/http';
import {MatStepperModule} from '@angular/material/stepper';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';
import {MatAutocomplete, MatAutocompleteTrigger} from '@angular/material/autocomplete';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {StrategyEstimatorComponent} from './strategy-estimator/strategy-estimator.component';

@NgModule({
  declarations: [
    AppComponent,
    CoveredCallEstimatorComponent,// Declare the component here
    HelpComponent,
    StrategyEstimatorComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    NgChartsModule,
    MatTooltip,
    AppRoutingModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatButtonModule,
    MatSelect,
    MatOption,
    MatIcon,
    MatStepperModule,
    MatExpansionModule,
    MatButtonToggleGroup,
    MatButtonToggle,
    MatAutocomplete,
    MatAutocompleteTrigger,
    ScrollingModule,
    ReactiveFormsModule,
// Import FormsModule for form handling
  ],
  providers: [
    provideAnimationsAsync(),
    provideHttpClient()
  ],
  exports: [
    CoveredCallEstimatorComponent
  ],
  bootstrap: [AppComponent]        // Set AppComponent as the bootstrap component
})
export class AppModule { }
