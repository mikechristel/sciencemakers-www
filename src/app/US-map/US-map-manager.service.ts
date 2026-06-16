import { Injectable } from '@angular/core';
import { Subject }    from 'rxjs';

// The purpose of this service is to store as an observable information from the U.S. map,
// such as which U.S. region has been clicked.  IMPORTANT: clicking a map region does not toggle it (too confusing) but only turns it on.
// There is a means to turn it off, though - via a list interface, which introduces regionIDToClear, which is also an observable.  
// This way, accessibility experts are OK with the list view allowing click on and click off (toggling) via the list.
@Injectable()
export class USMapManagerService {
  private localCurrentRegionIDToFocus: string = ""; // only set when the region list (text list) is interacted with, and cleared when the map itself is interacted with  

  public clickedRegionID: Subject<string> = new Subject<string>();
  public clickedRegionID$ = this.clickedRegionID.asObservable();
  public regionIDToClear: Subject<string> = new Subject<string>();
  public regionIDToClear$ = this.regionIDToClear.asObservable();
  constructor() {
  }

  ngOnInit() {
  }


  makeNoteOfClickedRegionID(givenClickedRegionID: string, isFromListAction: boolean) {
    if (isFromListAction) {
        this.localCurrentRegionIDToFocus = givenClickedRegionID;
    }
    else
        this.localCurrentRegionIDToFocus = ""; // clear any focus to region list item because the click is coming from the map itself, not the region list
    this.clickedRegionID.next(givenClickedRegionID);
  }

  makeNoteOfRegionIDToClear(givenRegionIDToClear: string) { // clear actions ONLY coming from the region list, not the map, so no need for an isFromListAction parameter
    this.localCurrentRegionIDToFocus = givenRegionIDToClear;
    this.regionIDToClear.next(givenRegionIDToClear);
  }

  currentRegionIDToFocus() {
    return this.localCurrentRegionIDToFocus;
  }

  clearRegionIDToFocus() {
    this.localCurrentRegionIDToFocus = "";
  }
}
