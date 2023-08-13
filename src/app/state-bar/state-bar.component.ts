import { Component, OnInit } from '@angular/core';
import { PythonService } from '../services/python.service';

import { JetsonService } from '../services/jetson.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

// Models
import { CircularBuffer } from '../models/circular-buffer.model';
import { State, StateData } from '../models/state.model';
import { Part } from '../models/part.model';

@Component({
  selector: 'app-state-bar',
  templateUrl: './state-bar.component.html',
  styleUrls: ['./state-bar.component.scss'],
})
export class StateBarComponent implements OnInit {
  /**
   * Constants and Enumerations
   */
  // Total number of states available
  readonly states: number = 15;

  // Length for the circular buffers
  readonly BUFFERLENGTH: number = 20;

  /**
   * Circular Buffers
   */
  // Buffer to manage states in a circular fashion
  circularBuffer: CircularBuffer<State> = new CircularBuffer<State>(
    this.BUFFERLENGTH
  );

  // Buffer to manage parts in a circular fashion
  circularPartsBuffer: CircularBuffer<Part[]> = new CircularBuffer<Part[]>(
    this.BUFFERLENGTH
  );

  /**
   * State Management Variables
   */
  // Represents the currently active state
  activeState: number = 0;

  // Confidence level of the current state
  stateConfidence: number = 0;

  // Indicates if a state was detected
  stateDetected: boolean = false;

  // Controls the ability to reset the state
  canResetState: boolean = true;

  // Flags for checking parts
  checkingAllParts: boolean = false;
  checkingStateParts: boolean = false;

  // Flags for displaying parts check buttons
  showAllPartsCheckButton: boolean = true;
  showStatePartsCheckButton: boolean = true;

  /**
   * Display Properties
   */
  // Instructions and advice to show to the user
  instructionAdvice: string = '';
  fullSet: string = '';
  textFullSet: string = '';
  textFullSetAdvice: string = '';

  // Flag to display the full set
  showFullSet: boolean = false;

  // Flags to control the collapse state for parts display
  isAllPartsCollapsed: boolean = true;
  isStatePartsCollapsed: boolean = true;

  /**
   * Assembly Mode and Required Parts
   */
  // Indicates if the component is in assembly mode
  isAssemblyMode = true;

  // List of parts that are needed
  partsNeeded: { part: string; quantity: number }[] = [];

  /**
   * Connectivity and Service Subscriptions
   */
  // Flag to indicate if the component is connected to the Jetson device
  isConnectedToJetson: boolean = false;

  // Subscription object to manage messaging
  private messagesSubscription!: Subscription;

  /**
   * Lifecycle Hook: OnInit
   * Executed when the component is initialized.
   */
  ngOnInit(): void {
    // Fetch instructions for the current state
    this.fetchInstruction();

    // Reset the state reset ability every 5 seconds
    setInterval(() => {
      this.canResetState = true;
    }, 5000);
  }

  /**
   * Lifecycle Hook: OnDestroy
   * Executed when the component is destroyed.
   */
  ngOnDestroy(): void {
    // Close connection to the Jetson service
    this.jetsonService.close();

    // Unsubscribe from the messages to prevent memory leaks
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
  }

  constructor(
    private pythonService: PythonService,
    private jetsonService: JetsonService
  ) {}

  /**
   * Toggles the assembly mode.
   * When toggled, it inverses the current assembly mode state and fetches the instructions accordingly.
   */
  toggleAssemblyMode(): void {
    this.isAssemblyMode = !this.isAssemblyMode;
    this.fetchInstruction();
  }

  /**
   * Getter that returns an array of state numbers.
   * For instance, if there are 15 states, it would return [1, 2, ..., 15].
   *
   * @returns {number[]} - An array of state numbers.
   */
  get stateNumbers(): number[] {
    return Array.from({ length: this.states }, (_, index) => index + 1);
  }

  /**
   * Constructs and returns the URL for the current active state's image.
   * The image filename is determined based on the active state and the assembly mode.
   *
   * @returns {string} - The URL of the image for the current active state.
   */
  getImageUrl(): string {
    let state: number = this.activeState;
    if (this.isAssemblyMode) {
      state += 1;
    } else {
      state = 15 - state;
    }

    // If state is within range, return the corresponding image URL
    if (state <= 15) {
      return `assets/img/state_${state}.png`;
    }
    // If state is the final one, return the final image URL
    else if (state === 16) {
      return `assets/img/final.png`;
    }
    // Default image URL for any out-of-range state
    else {
      return `assets/img/questionmark.png`;
    }
  }

  /**
   * Fetches the instruction for the current state and assembly mode.
   * Once fetched, it updates the relevant component properties accordingly.
   */
  fetchInstruction(): void {
    this.pythonService
      .getInstruction(this.isAssemblyMode, this.activeState)
      .subscribe({
        next: (response) => {
          // If no state was detected, set the flag to false
          if (response === 'No state detected.') {
            this.stateDetected = false;
          }
          // Otherwise, update the instruction and parts needed
          else {
            this.stateDetected = true;
            this.instructionAdvice = response.instruction;
            this.partsNeeded = response.next_parts;
          }
        },
        error: (error) => {
          console.error('Error fetching instruction:', error);
        },
      });
  }

  /**
   * Updates the state based on the provided inference data.
   *
   * @param inference - Array of inference data objects.
   * @returns {number} - The active state number.
   */
  updateState(inference: any): number {
    let className: string;
    let stateNumberTmp: number;
    let parts: Part[] = [];

    // Initialize state confidence with the currently active state's confidence.
    let stateConfidence: number = this.stateConfidence;

    // Process each inference data point.
    for (let dataPoint of inference) {
      className = dataPoint.name;
      parts.push({ class: className, confidence: dataPoint.confidence });

      // Check if a class name is provided and if it starts with the word 'state'.
      if (className && className.startsWith('state')) {
        this.stateDetected = true; // Indicates that a state has been detected.

        // Extract the state number from the class name (e.g., '14' from 'state_14').
        const matches = className.match(/\d+/g);
        if (matches && matches.length > 0) {
          stateNumberTmp = parseInt(matches[0]);

          // Push the detected state and its confidence to the circular buffer.
          this.circularBuffer.push({
            state: stateNumberTmp,
            confidence: dataPoint.confidence,
          });

          stateConfidence = dataPoint.confidence;
        }
      }
    }
    // Push parts[] into circularPartsBuffer
    if (parts.length > 0) {
      this.circularPartsBuffer.push(parts);
    }

    // Update the global state confidence.
    this.stateConfidence = stateConfidence;

    // Further processes the detected state.
    this.findMostCommmonState();
    this.fetchInstruction();

    return this.activeState;
  }

  /**
   * Finds the state with the highest occurrence from the circular buffer.
   * It then sets this state as the active state and updates the state confidence.
   *
   * @returns The state with the highest occurrence or null if not found.
   */
  findMostCommmonState(): number | null {
    const ordererMap = new Map<number, StateData>();

    // Populate the map with states from the circular buffer
    this.populateOrdererMapFromBuffer(ordererMap);

    // Extract the state with the highest occurrence
    const [maxState, maxData] = this.getStateWithHighestOccurrence(ordererMap);

    if (maxState !== null && maxData !== null) {
      this.activeState = maxState;
      this.stateConfidence = maxData.confidence;
      return this.activeState;
    } else {
      return 0;
    }
  }

  /**
   * Populate the given map with state data from the circular buffer.
   * @param ordererMap - The map to populate.
   */
  private populateOrdererMapFromBuffer(ordererMap: Map<number, StateData>) {
    for (let i = 0; i < this.circularBuffer.getLength(); i++) {
      const stateTmp = this.circularBuffer.get(i) as State | null;
      if (stateTmp) {
        const existingData = ordererMap.get(stateTmp.state);
        if (existingData) {
          const stateOccuranceAmount = existingData.occurance;
          const stateConfidenceAmount =
            existingData.confidence * stateOccuranceAmount;

          ordererMap.set(stateTmp.state, {
            confidence:
              (stateConfidenceAmount + stateTmp.confidence) /
              (stateOccuranceAmount + 1),
            occurance: stateOccuranceAmount + 1,
          });
        } else {
          ordererMap.set(stateTmp.state, {
            confidence: stateTmp.confidence,
            occurance: 1,
          });
        }
      }
    }
  }

  /**
   * Gets the state with the highest occurrence from the given map.
   * @param ordererMap - The map to extract from.
   * @returns A tuple [state, data] or [null, null] if no state found.
   */
  private getStateWithHighestOccurrence(
    ordererMap: Map<number, StateData>
  ): [number | null, StateData | null] {
    let maxState: number | null = null;
    let maxData: StateData | null = null;

    for (const [state, data] of ordererMap.entries()) {
      if (!maxData || data.occurance > maxData.occurance) {
        maxState = state;
        maxData = data;
      }
    }
    return [maxState, maxData];
  }

  /**
   * Attempts to establish a connection to Jetson Nano via the WebSocket protocol.
   *
   * @returns boolean indicating if the connection is deemed successful.
   */
  connectToJetson(): boolean {
    // Connect to the Jetson service via WebSocket using the specified URL.
    this.jetsonService.connect('ws://192.168.2.2:8765');

    // Update the connection status. (Note: This assumes a successful connection immediately,
    // you may want to only update this flag after validating the connection)
    this.isConnectedToJetson = true;

    // Subscribe to the message stream from the Jetson service to listen for inference results.
    this.messagesSubscription = this.jetsonService.messages().subscribe(
      (inference) => {
        // Handle and process the inference result.
        this.updateState(inference);
      },
      (error) => {
        // Log any errors that occur while receiving messages.
        console.error(error);
      }
    );

    // Display a notification to inform the user of a successful connection.
    Swal.fire({
      icon: 'success',
      title: 'Successfully connected to Jetson Nano',
      showConfirmButton: false,
      timer: 2000,
    });

    // Return the current connection status.
    return this.isConnectedToJetson;
  }

  /**
   * Disconnects from the Jetson Nano and cleans up any related resources.
   *
   * @returns boolean indicating the disconnection status (false means disconnected).
   */
  disconnectJetson(): boolean {
    // Close the connection to the Jetson service.
    this.jetsonService.close();

    // If there's an active subscription to the message stream, unsubscribe to stop listening.
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }

    // Update the connection status to indicate disconnection.
    this.isConnectedToJetson = false;

    // Return the current connection status.
    return this.isConnectedToJetson;
  }

  toggleContentBox() {
    this.showFullSet = !this.showFullSet;
  }

  /**
   * Toggles the visibility of the All Parts Box.
   * - If the box is currently collapsed and there's no connection to Jetson Nano, it displays an error message.
   * - If the box is expanded, it toggles the display of the State Parts Check Button and the checking state.
   * - Finally, it toggles the collapsed state of the All Parts Box.
   */
  toggleAllPartsBox(): void {
    if (this.isAllPartsCollapsed) {
      if (!this.isConnectedToJetson) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Jetson Nano is not connected',
        });
        return;
      }
      this.showStatePartsCheckButton = false;
      this.checkingAllParts = true;
    } else {
      this.showStatePartsCheckButton = true;
      this.checkingAllParts = false;
    }
    this.isAllPartsCollapsed = !this.isAllPartsCollapsed;
  }

  /**
   * Toggles the visibility of the State Parts Box.
   * - If the box is currently collapsed and there's no connection to Jetson Nano, it displays an error message.
   * - If the box is expanded, it toggles the display of the All Parts Check Button and the checking state.
   * - Finally, it toggles the collapsed state of the State Parts Box.
   */
  toggleStatePartsBox(): void {
    if (this.isStatePartsCollapsed) {
      if (!this.isConnectedToJetson) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Jetson Nano is not connected',
        });
        return;
      }
      this.showAllPartsCheckButton = false;
      this.checkingStateParts = true;
    } else {
      this.showAllPartsCheckButton = true;
      this.checkingStateParts = false;
    }
    this.isStatePartsCollapsed = !this.isStatePartsCollapsed;
  }

  /**
   * Provides text for the next step based on the active state and assembly mode.
   * If the user is on the last step of assembly mode, it congratulates them.
   *
   * @returns {string} - Text for the next step.
   */
  nextStepText(): string {
    if (this.activeState === 15 && this.isAssemblyMode) {
      return `🥳 Congratulations! You finished the Mindstorm`;
    }
    return `Next Step:`;
  }
}
