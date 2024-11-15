// src/app/help/help.component.ts

import { Component } from '@angular/core';
import {ActivatedRoute, RouterModule} from '@angular/router';

@Component({
  selector: 'app-help',
 // Import RouterModule here
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.css']
})
export class HelpComponent {
  constructor(private route: ActivatedRoute) { }
  // Your component logic here
}
