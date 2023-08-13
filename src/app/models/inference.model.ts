export namespace Inference {
  export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  export interface Prediction {
    class: string;
    confidence: number;
    bbox: BoundingBox;
  }

  // You can still create an interface for an array of predictions, if needed:
  export type Predictions = Prediction[];
}
