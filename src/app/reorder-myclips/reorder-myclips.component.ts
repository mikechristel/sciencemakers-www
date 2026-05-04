import { Component, OnInit, ViewChildren, viewChild, QueryList, ElementRef, inject, ChangeDetectorRef, signal } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from "rxjs/operators";

import { TitleManagerService } from '../shared/title-manager.service';
import { BaseComponent } from '../shared/base.component';
import {LiveAnnouncer} from '@angular/cdk/a11y'; // used to read changes to set title
import { GlobalState, HowToReorder } from '../app.global-state';
import { PlaylistManagerService } from '../playlist-manager/playlist-manager.service';
import { IDSearchService } from '../id-search/id-search.service';
import { PlaylistInterface, Playlist } from '../playlist-manager/playlist';
import { UserSettingsManagerService } from '../user-settings/user-settings-manager.service';

// The drag and drop way with mouse via Angular CDK:
import { CdkDragDrop, moveItemInArray, CdkDropListGroup, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import { FocusMeDirective } from '../shared/focus-me.directive';


@Component({
    selector: 'thda-settings',
    templateUrl: './reorder-myclips.component.html',
    styleUrls: ['./reorder-myclips.component.scss'],
    imports: [FocusMeDirective, CdkDropListGroup, CdkDropList, CdkDrag]
})
export class ReorderMyClipsComponent extends BaseComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private globalState = inject(GlobalState);
    private titleManagerService = inject(TitleManagerService);
    private liveAnnouncer = inject(LiveAnnouncer);
    private userSettingsManagerService = inject(UserSettingsManagerService);
    private playlistManagerService = inject(PlaylistManagerService);
    private idSearchService = inject(IDSearchService);

    private changeDetectorRef = inject(ChangeDetectorRef);

    // Assign enum HowToReorder to a property to make it accessible in the html template (e.g., to use KeyboardReorder, DragAndDropReorder, PointerReorder instead of 1, 2, 3 in the html)
    protected readonly MyHowToReorder = HowToReorder;

    readonly tabGroup_Keyboard = viewChild<ElementRef>('tab1');
    readonly tabGroup_DragAndDrop = viewChild<ElementRef>('tab2');
    readonly tabGroup_PointerReorder = viewChild<ElementRef>('tab3');
    readonly helperMessageWhenNothingGrabbed = "Use Tab and Shift+Tab to move through the list of items, and Enter or space to select that item for reordering.";
    readonly helperMessageWhenItemGrabbed = "Use arrow keys to reorder the list. Press Enter to confirm, or Escape to cancel the reordering.";

    @ViewChildren('clipSetToReorder') clipItems!: QueryList<ElementRef>; // the tag #clipSetToReorder is in the html for all clip items
    // (not needed) @ViewChildren('clipSetToReorderByPointer') clipItemsInPointerList!: QueryList<ElementRef>; // the tag #clipSetToReorderByPointer is in the html for all clip items in the pointer reorder list

    reorderMannerSignal = signal<HowToReorder>(HowToReorder.KeyboardReorder); // default to keyboard reorder UI, which is more accessible, and then allow users to switch to others

    showKeyboardActionDescription: boolean = true; // start with the keyboard action description being shown as well

    reorderMyClipsPageTitle: string = "";
    reorderMyClipsPageTitleLong: string= "";
    signalFocusToTitle: boolean = false; // is used in html rendering of this component

    IDListToLoad: string = "";
    clipSet: PlaylistInterface[] = [];

    readonly MAX_CLIPS_TO_FETCH:number = 1000;

    // A number of variables hold state regarding reordering within different manners of doing this (keyboard, drag-n-drop, pointer)
    grabbedClipIndex: number = -1;
    droppedTargetIndex: number = -1; // adjusts based on input for drag-n-drop or keyboard manipulation of the grabbed item, i.e., grabbedClipIndex
    helperKeyboardOpsMsg: string = this.helperMessageWhenNothingGrabbed;

    grabbedSourceIndexSignal = signal(-1); // this one is only used with pointer-driven UI

    reorderStatus: string = "";
    terminatingStatusShown: boolean = false; // used to hold onto a message longer, across a focus change

    ngOnInit() {
        this.reorderMannerSignal.set(this.userSettingsManagerService.currentReorderSetting());
        this.reorderMyClipsPageTitle = "Reorder My Clips";
        this.reorderMyClipsPageTitleLong = "Reorder My Clips, The ScienceMakers Digital Archive";
        this.titleManagerService.setTitle(this.reorderMyClipsPageTitleLong);
        this.liveAnnouncer.announce("Reorder My Clips"); // NOTE: using LiveAnnouncer to eliminate possible double-speak
        if (this.globalState.IsInternalRoutingWithinSPA) {
            this.globalState.IsInternalRoutingWithinSPA = false;
            // Set default focus to the title for this route, since we did internally route
            // in the SPA (single page application)
            // (as it is the target for skip-to-main content as well)
            this.signalFocusToTitle = true;
        }
        this.IDListToLoad = this.playlistManagerService.MyClipsAsString();
        this.getIDListStoryTitles(this.IDListToLoad); // !!!TBD!!! NOTE: we have this info. in most cases and are refetching it rather than messing with saving some state across routes in this SPA
        this.grabbedClipIndex = -1; // start with no clip selected as "grabbed" to be moved around as with arrow keys
    }

    // No need to log, but left here in case debugging later a concern for this widget... 
    // ngAfterViewInit() {
    //   this.clipItems.changes.subscribe((elements) => {
    //     elements.forEach(element => {
    //       console.log(element.nativeElement);
    //     });
    //   });
    // }

    private resetReorderStatus() {
        this.undoListManipulation(); // needed BEFORE clearing grabbedClipIndex and droppedTargetIndex
        this.grabbedClipIndex = -1;
        this.droppedTargetIndex = -1; // adjusts based on input for drag-n-drop or keyboard manipulation of the grabbed item, i.e., grabbedClipIndex
        this.helperKeyboardOpsMsg = this.helperMessageWhenNothingGrabbed;

        this.grabbedSourceIndexSignal.set(-1); // perhaps could be removed in favor of using other drag/drop and or keyboard reorder variables, but for now this one is only used with pointer-driven UI

        this.reorderStatus = "";
        this.terminatingStatusShown = false; // used to hold onto a message longer, across a focus change
    }

    reorderInterfaceClick(newSetting: HowToReorder) {
        this.updateReorderUI(newSetting);
    }

    setReorderOption(eventCode: string, comingFromOption: HowToReorder) {
        // NOTE: understanding of the order of the 3 HowToReorder options is hard-coded here rather than generalized:
        // KeyboardReorder, DragAndDrop, Pointer (so Home key goes to KeyboardReorder and End key goes to Pointer, etc.)
        if (eventCode == "Home") {
            // Handle Home key press
            this.focusTabOption(HowToReorder.KeyboardReorder); // set focus to the keyboard reorder tab option
        }
        else if (eventCode == "End") {
            // Handle End key press
            this.focusTabOption(HowToReorder.PointerReorder); // set focus to the pointer reorder tab option
        }
        else if (eventCode == " " || eventCode == "Enter") {  
            // Process selection: note if we are already on this setting then nothing happens within updateReorderUI.
            this.updateReorderUI(comingFromOption);
        }
        else if (eventCode == "ArrowDown" || eventCode == "ArrowRight") {
            var nextOption: HowToReorder; // move to the next option in the interface
            if (comingFromOption == HowToReorder.KeyboardReorder) {
                nextOption = HowToReorder.DragAndDropReorder;
            } else if (comingFromOption == HowToReorder.DragAndDropReorder) {
                nextOption = HowToReorder.PointerReorder;
            } else {
                nextOption = HowToReorder.KeyboardReorder;
            }
            this.focusTabOption(nextOption); // set focus to the next tab option
        }
        else if (eventCode == "ArrowUp" || eventCode == "ArrowLeft") {
            var previousOption: HowToReorder; // move to the previous option in the interface
            if (comingFromOption == HowToReorder.KeyboardReorder) {
                previousOption = HowToReorder.PointerReorder;
            } else if (comingFromOption == HowToReorder.DragAndDropReorder) {
                previousOption = HowToReorder.KeyboardReorder;
            } else {
                previousOption = HowToReorder.DragAndDropReorder;
            }
            this.focusTabOption(previousOption); // set focus to the previous tab option
        }
    }

    private focusTabOption(whichTab: HowToReorder) {
      switch (whichTab) { 
        case HowToReorder.KeyboardReorder:
            // set focus to tabGroup_Keyboard
            const tabGroup_Keyboard = this.tabGroup_Keyboard();
            if (tabGroup_Keyboard && tabGroup_Keyboard.nativeElement) {
                tabGroup_Keyboard.nativeElement.focus();
            }
        break;
        case HowToReorder.DragAndDropReorder:
            const tabGroup_DragAndDrop = this.tabGroup_DragAndDrop();   
            if (tabGroup_DragAndDrop && tabGroup_DragAndDrop.nativeElement)
            {
                tabGroup_DragAndDrop.nativeElement.focus();
            }
        break;
        case HowToReorder.PointerReorder:
            const tabGroup_Pointer = this.tabGroup_PointerReorder();   
            if (tabGroup_Pointer && tabGroup_Pointer.nativeElement)
            {
                tabGroup_Pointer.nativeElement.focus();
            }
        break;
      }
    }

    getNthElement(index: number): ElementRef | undefined {
      return this.clipItems.toArray()[index];
    }

    // Needed only if we want to scroll to the item in the pointer list, and in fact we do not want that.
    // Left here to show difference between the UIs/mechanisms for reordering.
    // getNthElementInPointerList(index: number): ElementRef | undefined {
    //  return this.clipItemsInPointerList.toArray()[index];
    //}    

    private getIDListStoryTitles(IDListToLoad: string) {
        var oneClipToReorder: Playlist;

        this.clipSet = [];

        if (IDListToLoad.length > 0) {
            // NOTE similarity with getMixtapesPage() -- condense if we keep both or eventually retire out the "mixtapes" variant.

            this.idSearchService.getIDSearch(IDListToLoad, 1, this.MAX_CLIPS_TO_FETCH,"", "", "", "", "", "", "", "")
              .pipe(takeUntil(this.ngUnsubscribe)).subscribe(retSet => {
                for (var i: number = 0; i < retSet.stories.length; i++) {
                  oneClipToReorder = new Playlist(retSet.stories[i].document.storyID, retSet.stories[i].document.title);
                  this.clipSet.push(oneClipToReorder);
                }
                this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
            },
            error => {
                // TODO: Decide if further error logging/analytics is desired on fail-to-load cases like this
                this.clipSet = [];
                this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
            });
        }
    }

    public processClick(childIndicator: number) {
        // This sets focus.  Focus handler on clip set will do the rest of the work (i.e., clipItemFocused).

        const itemClicked = this.getNthElement(childIndicator);
        if (itemClicked) {
            // This clicked child is always the focus:
            if (itemClicked.nativeElement)
              itemClicked.nativeElement.focus();
        }
    }

    public clipItemFocused(childIndicator: number) {
      if (this.grabbedClipIndex != -1) { // something is grabbed...
        // If this item is the dropped target, do nothing - this focus update is via arrow keys and other keyboard logic in this code-behind class.
        if (childIndicator != this.droppedTargetIndex) {
            // As the given child is now focused, if there was a grabbed/drop-target ongoing, end that with SUCCESS (do the drag/drop) rather than CANCEL/ABANDON (ignore drag/drop).
            // Revisit (and make use of cancel logic as seen elsewhere will callers of resetReorderStatus/undoListManipulation) if instead resetting the focus within the list
            // should be treated as implicit CANCEL instead of implicit CONFIRM of a drag/drop in progress.
            var nonZeroIndexItem:number = childIndicator + 1;
            var msgPreface: string = "Focused item " + nonZeroIndexItem + ": ";
            
            this.doItemDrop(msgPreface); this.resetReorderStatus
        }
      }
      else if (this.terminatingStatusShown)
        this.terminatingStatusShown = false; // next focus change, do the clearing out of reorderStatus
      else if (this.reorderStatus.length > 0)
        this.reorderStatus = ""; // clear out the reorder status on focus change when nothing is grabbed and focus moves....
    }

    // Do the item drop from grabbed-spot to drop-spot, doing nothing if there is no grabbed spot.
    public doItemDrop(statusPreface: string) {
      if (this.grabbedClipIndex != -1) {
        // See if we dropped onto our original pickup point, in which case we do nothing except clear out that we are in a grabbed state.
        if (this.grabbedClipIndex == this.droppedTargetIndex) {
            this.reorderStatus = statusPreface + "List remains as is"; // no-op, i.e., no operation, or a drop back where grab started
          }
          else {
              this.reorderStatus = statusPreface + "List is reordered";
              this.doMyClipsUpdate(); // Update the My Clips set based on this new reordering.
          }
          // Clear out grabbed state:
          this.grabbedClipIndex = -1;
          this.droppedTargetIndex = -1;
          this.helperKeyboardOpsMsg = this.helperMessageWhenNothingGrabbed; // update helper message to reflect that nothing is now grabbed
      }
    }

    public doMyClipsUpdate() {
      this.playlistManagerService.updateMyClips(this.clipSet);
      /* !!!TBD!!! later, decide if there needs to be any additional live announcement, e.g.,
      this.liveAnnouncer.announce("Updated My Clips story set"); // NOTE: using LiveAnnouncer rather than aria-live tag
      */
    }

    private updateReorderUI(newReorderManner: HowToReorder) {
      if (this.reorderMannerSignal() != newReorderManner) {
          this.resetReorderStatus(); // reset any in-progress reorder status when switching to a new reorder manner, so that we are starting fresh with the new manner of reordering
          this.reorderMannerSignal.set(newReorderManner);
          this.userSettingsManagerService.updateReorderSetting(newReorderManner); // remember this setting for future loading of the reorder component (will default to this setting)
      }
    }

    public processClickInPointerList(childIndicator: number) {
      if (this.grabbedSourceIndexSignal() != childIndicator) {
          // This sets a SINGLE selection within the pointer-driven reorder list to be this particular child indicator, and then the user can use up/down buttons to move this item around in the list and then select it again to drop it in the new location.  
          // This is a different interaction model than the keyboard-driven reorder, so we are using a separate signal to track this selection in the pointer-driven UI rather than reusing grabbedClipIndex which is used for the keyboard-driven UI.

          // !!!TBD!!! decide if there is other work to do if we formerly had a real value (not -1) for grabbedSourceIndexSignal 

          this.grabbedSourceIndexSignal.set(childIndicator);

          // !!!TBD!!! Launch other interface elements to allow the user to move this item up and down in the list and then drop it, etc.  This is a placeholder for now.
      }
    }

    public setClickInPointerList(eventCode: string, childIndicator: number) {
        if (eventCode == " " || eventCode == "Enter") {
            var maxIndex: number = this.clipSet.length - 1;
            if (childIndicator >= 0 && childIndicator <= maxIndex) {
                this.processClickInPointerList(childIndicator);
            }
        }
    }

    public toggleShowingKeyboardAction() {
      // For this to be accessible, user cannot be manipulating the list, so clear out that status before it is hidden or especially before it is shown.
      this.reorderStatus = "";
      this.showKeyboardActionDescription = !this.showKeyboardActionDescription;
    }

    public setClipArranging(eventCode: string, childIndicator: number) {
        var maxIndex: number = this.clipSet.length - 1;
        // Logic here motivated by discussion at https://www.smashingmagazine.com/2018/01/dragon-drop-accessible-list-reordering/
        // for reordering in an accessible way.

        // On space or Enter, if there is no grabbed clip, then grab this one.  If there is a grabbed clip, then drop it.
        // On Esc - give up - turn off selection (i.e., "grabbed") if it is there, move item back to where it came from, set focus there.
        // On arrow keys - IF there is a grabbed item, move it up and down in the list.
        if (eventCode == " " || eventCode == "Enter") {
            if (childIndicator >= 0 && childIndicator <= maxIndex) {
              if (this.grabbedClipIndex == -1) {
                var nonZeroIndexItem:number = childIndicator + 1;
                this.reorderStatus = "Grabbed item " + nonZeroIndexItem + ": " + this.clipSet[childIndicator].title;
                this.grabbedClipIndex = childIndicator;
                this.droppedTargetIndex = childIndicator; // right now we are sitting at the drop target, i.e., a no-operation or no-op in case user hits space/Enter in succession
                this.helperKeyboardOpsMsg = this.helperMessageWhenItemGrabbed; // ensure helper message reflects that an item is now grabbed and awaiting drop or further manipulation
              }
              else {
                  this.doItemDrop("");
              }
            }
        }
        else if (eventCode == "Escape") {
          if (this.grabbedClipIndex != -1) {
            // Perhaps did some list manipulation if (this.grabbedClipIndex != this.droppedTargetIndex), so restore it back to its original form first.
            // The test within undoListManipulation will check if such restoration is necessary.
            this.undoListManipulation();

            this.reorderStatus = "Cancelled reordering";
            this.terminatingStatusShown = true; // this message wraps up an action; persist it a bit...

            var originalGrabSlot: number = this.grabbedClipIndex;

            // Clear bookkeeping before any focus updates to note the escape/cancel action is completed:
            this.grabbedClipIndex = -1;
            this.droppedTargetIndex = -1;
            this.helperKeyboardOpsMsg = this.helperMessageWhenNothingGrabbed; // update helper message to reflect that nothing is now grabbed

            // Make the original grab slot the focus:  
            const itemGrabbed = this.getNthElement(originalGrabSlot);
            if (itemGrabbed) {
                if (itemGrabbed.nativeElement)
                  itemGrabbed.nativeElement.focus();
            }

          }
        }
        else if (this.droppedTargetIndex == childIndicator)
        { // Possibly move the original grabbed item (which sits at childIndex) up/down 1 if that remains in legal range.
          // If so, update this.droppedTargetIndex which marks where the grabbed item is currently sitting.
            var nextIndex: number = -1; // value less than zero indicates no movement of drag target anticipated...
            if (eventCode == "ArrowDown") {
                nextIndex = childIndicator + 1;
                if (nextIndex > maxIndex)
                    nextIndex = -1; // do not exceed the max list
            }
            else if (eventCode == "ArrowUp") {
                nextIndex = childIndicator - 1;
                // less than zero is OK - marks that we should not move there
            }

            if (nextIndex >= 0) {
                var oneGrabbedClip: Playlist;
                oneGrabbedClip = new Playlist(this.clipSet[this.droppedTargetIndex].storyID, this.clipSet[this.droppedTargetIndex].title);

                // Copy nextIndex's stuff into the former drop target space:
                this.clipSet[this.droppedTargetIndex].storyID = this.clipSet[nextIndex].storyID;
                this.clipSet[this.droppedTargetIndex].title = this.clipSet[nextIndex].title;
                // Have nextIndex hold the initially grabbed item:
                this.clipSet[nextIndex].storyID = oneGrabbedClip.storyID;
                this.clipSet[nextIndex].title = oneGrabbedClip.title;
                // Update where the dropped target now sits
                this.droppedTargetIndex = nextIndex;
                this.helperKeyboardOpsMsg = this.helperMessageWhenItemGrabbed; // ensure helper message reflects that an item is now grabbed and awaiting drop or further manipulation

                // Be sure next is focused, too:
                const nextItem = this.getNthElement(nextIndex);
                if (nextItem) {
                    if (nextItem.nativeElement)
                      nextItem.nativeElement.focus();
                }
                var nonZeroIndexGrabbed:number = this.grabbedClipIndex + 1;
                var nonZeroIndexDroppedTarget:number = this.droppedTargetIndex + 1;
                if (nonZeroIndexGrabbed != nonZeroIndexDroppedTarget)
                    this.reorderStatus = "Moving item " + nonZeroIndexGrabbed + " to " + nonZeroIndexDroppedTarget + " with moved item title being \"" + this.clipSet[this.droppedTargetIndex].title + "\"";
                else
                    this.reorderStatus = "Keeping list as is";
            }
        }
    }

    private undoListManipulation() { // Helper function to restore this.clipSet to original form based on grabbedClipIndex and droppedTargetIndex (as when action is cancelled out or abandoned)
        if (this.grabbedClipIndex != -1 && this.droppedTargetIndex != -1 && this.grabbedClipIndex != this.droppedTargetIndex) {

            var oneGrabbedClip: Playlist = new Playlist(this.clipSet[this.droppedTargetIndex].storyID, this.clipSet[this.droppedTargetIndex].title);

            if (this.droppedTargetIndex < this.grabbedClipIndex) {
            // The original grabbed item oneGrabbedClip was placed earlier in list.  From dropped point to the just before the grabbed point, move forward 1.
            for (var j:number = this.droppedTargetIndex; j < this.grabbedClipIndex; j++) {
                this.clipSet[j].storyID = this.clipSet[j+1].storyID;
                this.clipSet[j].title = this.clipSet[j+1].title;
            }
            this.clipSet[this.grabbedClipIndex].storyID = oneGrabbedClip.storyID;
            this.clipSet[this.grabbedClipIndex].title = oneGrabbedClip.title;
            }
            else
            {
            // The original grabbed item oneGrabbedClip was placed later in list.  From just before the dropped point back to the grabbed point, move forward 1.
            for (var j:number = this.droppedTargetIndex - 1; j >= this.grabbedClipIndex; j--) {
                this.clipSet[j+1].storyID = this.clipSet[j].storyID;
                this.clipSet[j+1].title = this.clipSet[j].title;
            }
            this.clipSet[this.grabbedClipIndex].storyID = oneGrabbedClip.storyID;
            this.clipSet[this.grabbedClipIndex].title = oneGrabbedClip.title;
            }
        }
    }

    public dropInClipsList(event:CdkDragDrop<PlaylistInterface[]>) {
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        this.doMyClipsUpdate(); // Update the My Clips set based on this new reordering.
    }

    public processClickUpwardInReorderByPointerList() {
        // If this.grabbedSourceIndexSignal() is > 0 and <= listLength - 1, then move it upward by one in the list held by clipSet[] and immediately update the list.
        var sourceIndex: number = this.grabbedSourceIndexSignal();
        if (sourceIndex > 0 && sourceIndex < this.clipSet.length) {
            this.helperReadjustReorderByPointerList(sourceIndex, sourceIndex - 1, "upward in list");
        }
    }

    public processClickDownwardInReorderByPointerList() {
        var sourceIndex: number = this.grabbedSourceIndexSignal();
        // If sourceIndex is >= 0 and < listLength - 1, then move it downward by one in the list held by clipSet[] and immediately update the list.
        if (sourceIndex >= 0 && sourceIndex < this.clipSet.length - 1) {
            this.helperReadjustReorderByPointerList(sourceIndex, sourceIndex + 1, "downward in list");
        }
    }

    private helperReadjustReorderByPointerList(sourcePosition: number, destinationPosition: number, directionAnnouncement: string) {
        var announcingItemMoveComplete: string = "Moving " + directionAnnouncement + ", " + this.clipSet[sourcePosition].title;
        moveItemInArray(this.clipSet, sourcePosition, destinationPosition);
        this.doMyClipsUpdate(); // Update the My Clips set based on this new reordering.
        this.grabbedSourceIndexSignal.set(destinationPosition);

        // Concerned there should be some announcement as we are doing the reordering.
        this.liveAnnouncer.announce(announcingItemMoveComplete); // done here rather than via aria-live tag in the html

        // NO! this scrolls into a huge list if we have huge list and instead we want to keep focus on up/down buttons
        // and scroll on up/down buttons so instead, list the order and title of the item being moved next to the up and down buttons.
        //const nextItem = this.getNthElementInPointerList(destinationPosition);
        //if (nextItem) {
        //    if (nextItem.nativeElement)
        //        nextItem.nativeElement.focus();
        //}
    }
}
