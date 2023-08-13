import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-state',
  templateUrl: './state.component.html',
  styleUrls: ['./state.component.scss']
})
export class StateComponent {
@Input() isActive = false;
@Input() stateNumber = 0;

}
