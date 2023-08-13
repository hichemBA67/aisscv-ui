import { PythonService } from '../../../services/python.service';
import { Component, OnInit, Input } from '@angular/core';
import { CircularBuffer } from 'src/app/models/circular-buffer.model';
import { LegoSet } from 'src/app/models/lego-set.model';
import { Part } from 'src/app/models/part.model';

@Component({
  selector: 'app-all-parts-box',
  templateUrl: './all-parts-box.component.html',
  styleUrls: ['./all-parts-box.component.scss'],
})
export class AllPartsModalComponent implements OnInit {
  // Inputs
  @Input() inferredStates: CircularBuffer<Part[]> = new CircularBuffer<Part[]>(
    20
  );
  @Input() checkAllParts: boolean = true;

  // Component State
  checkingParts: boolean = false;
  fullSet: LegoSet;
  missingParts: LegoSet;
  foundParts: LegoSet;
  foundPartsAmount: number = 0;
  checkConfidence: number = 0;

  /**
   * Constructor for the component.
   * Initializes the state for lego parts.
   *
   * @param {PythonService} pythonService - The service to communicate with Python backend.
   */
  constructor(private pythonService: PythonService) {
    this.foundParts = {
      engine: 0,
      blue_short: 0,
      blue_long: 0,
      gray_45: 0,
      gray_90: 0,
      black_stick_short: 0,
      black_short: 0,
      red_shaft: 0,
      gray_long: 0,
      gray_short: 0,
      green_3: 0,
      gray_frame: 0,
      white_45: 0,
      wheel: 0,
      tire: 0,
      gray_loop: 0,
    };

    this.fullSet = {
      engine: 1,
      blue_short: 4,
      blue_long: 3,
      gray_45: 1,
      gray_90: 1,
      black_stick_short: 2,
      black_short: 4,
      red_shaft: 1,
      gray_long: 1,
      gray_short: 1,
      green_3: 1,
      gray_frame: 1,
      white_45: 1,
      wheel: 1,
      tire: 1,
      gray_loop: 2,
    };

    this.missingParts = this.fullSet;
  }

  ngOnInit() {
    setInterval(() => {
      if (this.checkAllParts === true) {
        this.checkParts();
      }
    }, 2000);
  }

  // Method to check the available parts
  checkParts(): void {
    let parts: Part[] = [];

    const buffer: CircularBuffer<Part[]> = this.inferredStates;
    const bufferLength = buffer.getLength();

    // Iterate over the buffer to gather parts
    for (let i = 0; i < bufferLength; i++) {
      if (buffer.get(i) !== null) {
        parts = buffer.get(i)!;

        // Only proceed if current parts' count is greater or equal to previously found parts
        if (parts.length >= this.foundPartsAmount) {
          this.pythonService.calculateFullSet(parts).subscribe((response) => {
            this.foundParts = response.input;
            this.missingParts = response.check.missing_parts;
            this.checkConfidence = response.check.avg_confidence;
          });
        }
      }
    }
  }
}
