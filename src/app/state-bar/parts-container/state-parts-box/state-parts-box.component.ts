import { Component, OnInit, Input } from '@angular/core';
import { CircularBuffer } from 'src/app/models/circular-buffer.model';
import { LegoSet } from 'src/app/models/lego-set.model';
import { Part } from 'src/app/models/part.model';
import { PythonService } from 'src/app/services/python.service';

/**
 * Component that handles the state and interaction related to Lego parts.
 */
@Component({
  selector: 'app-state-parts-box',
  templateUrl: './state-parts-box.component.html',
  styleUrls: ['./state-parts-box.component.scss'],
})
export class StatePartsModelComponent implements OnInit {
  // Inputs
  @Input() inferredStates: CircularBuffer<Part[]> = new CircularBuffer<Part[]>(
    20
  );
  @Input() checkStateParts: boolean = true;
  @Input() currentState: number = 0;
  @Input() partsNeeded: { part: string; quantity: number }[] = [];

  // Component State
  checkingParts: boolean = false;
  stateParts: LegoSet;
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
    this.stateParts = this.initializeLegoParts();
    this.foundParts = this.initializeLegoParts();
    this.missingParts = this.initializeLegoParts();
  }

  /**
   * Lifecycle hook called after component's view is initialized.
   * Sets a periodic check for parts.
   */
  ngOnInit() {
    setInterval(() => {
      if (this.checkStateParts) {
        this.checkParts();
      }
    }, 2000);
  }

  /**
   * Check the parts available using the Python service and updates the component's state.
   */
  checkParts(): void {
    this.setStateParts();

    const buffer: CircularBuffer<Part[]> = this.inferredStates;
    const bufferLength = buffer.getLength();

    for (let i = 0; i < bufferLength; i++) {
      const currentParts = buffer.get(i);
      if (currentParts !== null) {
        this.pythonService
          .calculateStateSet(currentParts, this.currentState)
          .subscribe((response) => {
            this.foundParts = response.input;
            this.missingParts = response.check.missing_parts;
            this.checkConfidence = response.check.avg_confidence;
          });
      }
    }
  }

  /**
   * Returns the value for a found part.
   *
   * @param {string} key - The key for the part.
   * @returns The value of the found part.
   */
  getFoundPartValue(key: string): any {
    return this.foundParts[key as keyof LegoSet];
  }

  /**
   * Returns the value for a missing part.
   *
   * @param {string} key - The key for the part.
   * @returns The value of the missing part.
   */
  getMissingPartValue(key: string): any {
    return this.missingParts[key as keyof LegoSet];
  }

  /**
   * Initializes and sets the Lego parts based on the provided parts needed.
   */
  setStateParts(): void {
    this.stateParts = this.initializeLegoParts();

    for (const partNeeded of this.partsNeeded) {
      const className = partNeeded.part as keyof typeof this.stateParts;
      this.stateParts[className] = partNeeded.quantity;
    }
  }

  /**
   * Initializes a LegoSet object with all values set to zero.
   *
   * @returns {LegoSet} - A LegoSet object with all values initialized to zero.
   */
  private initializeLegoParts(): LegoSet {
    return {
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
  }
}
