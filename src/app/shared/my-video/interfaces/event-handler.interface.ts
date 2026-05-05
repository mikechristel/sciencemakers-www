export interface EventHandler {
  element: any; // perhaps could be updated to HTMLVideoElement | null in a future update
  name: string;
  callback: (event?: any) => boolean | void;
  dispose: (() => void) | null;
}
