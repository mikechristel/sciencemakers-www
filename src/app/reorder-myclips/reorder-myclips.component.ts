import { Component, OnInit, ViewChildren, QueryList, ElementRef, inject, ChangeDetectorRef } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from "rxjs/operators";

import { TitleManagerService } from '../shared/title-manager.service';
import { BaseComponent } from '../shared/base.component';
import {LiveAnnouncer} from '@angular/cdk/a11y'; // used to read changes to set title
import { GlobalState } from '../app.global-state';
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

    @ViewChildren('clipSetToReorder') clipItems!: QueryList<ElementRef>; // the tag #clipSetToReorder is in the html for all clip items

    reorderMyClipsPageTitle: string;
    reorderMyClipsPageTitleLong: string;
    signalFocusToTitle: boolean = false; // is used in html rendering of this component
    grabbedClipIndex: number = -1;
    droppedTargetIndex: number = -1; // adjusts based on input for drag-n-drop or keyboard manipulation of the grabbed item, i.e., grabbedClipIndex
    reorderStatus: string = "";
    terminatingStatusShown: boolean = false; // used to hold onto a message longer, across a focus change
    dragDropUIForKeyboardShown: boolean = true; // if true, start with the keyboard drag/drop UI so that all users can proceed; the mouse/touch drag/drop UI may not be fully accessible so tuck it away to start
    showKeyboardActionDescription: boolean = true; // start with the keyboard action description being shown as well

    IDListToLoad: string = "";
    clipSet: PlaylistInterface[] = [];
    clipIsSelected: boolean[] = [];

    readonly MAX_CLIPS_TO_FETCH:number = 1000;

    ngOnInit() {
        this.dragDropUIForKeyboardShown = this.userSettingsManagerService.currentReorderByKeyboard();
        this.reorderMyClipsPageTitle = "Reorder My Clips";
        this.reorderMyClipsPageTitleLong = "Reorder My Clips, ScienceMakers Digital Archive";
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

    //ngAfterViewInit() {
    //  this.clipItems.changes.subscribe((elements) => {
    //    elements.forEach(element => {
    //      // no need to log, but left here in case debugging later a concern for this widget... console.log(element.nativeElement);
    //    });
    //  });
    //}

    getNthElement(index: number): ElementRef | undefined {
      return this.clipItems.toArray()[index];
    }

    private getIDListStoryTitles(IDListToLoad: string) {
        var oneClipToReorder: Playlist;

        this.clipSet = [];
        this.clipIsSelected = [];

        if (IDListToLoad.length > 0) {
            this.idSearchService.getIDSearch(IDListToLoad, 1, this.MAX_CLIPS_TO_FETCH,"", "", "", "", "", "", "", "")
              .pipe(takeUntil(this.ngUnsubscribe)).subscribe(retSet => {
                for (var i: number = 0; i < retSet.stories.length; i++) {
                  oneClipToReorder = new Playlist(retSet.stories[i].document.storyID, retSet.stories[i].document.title);
                  this.clipSet.push(oneClipToReorder);
                  this.clipIsSelected.push(false); // with pushing of a clip, also push that it starts off as not being selected in the key input UI
                }
                this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
            },
            error => {
                // TODO: Decide if further error logging/analytics is desired on fail-to-load cases like this
                this.clipSet = [];
                this.clipIsSelected = [];
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
            // As the given child is now focused, if there was a grabbed/drop-target ongoing, end that.
            var nonZeroIndexItem:number = childIndicator + 1;
            var msgPreface: string = "Focused item " + nonZeroIndexItem + ": ";
            this.doItemDrop(msgPreface);
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
          this.clipIsSelected[this.droppedTargetIndex] = false;
          this.grabbedClipIndex = -1;
          this.droppedTargetIndex = -1;
      }
    }

    public doMyClipsUpdate() {
      this.playlistManagerService.updateMyClips(this.clipSet);
      /* !!!TBD!!! later, decide if there needs to be any additional live announcement, e.g.,
      this.liveAnnouncer.announce("Updated My Clips story set"); // NOTE: using LiveAnnouncer rather than aria-live tag
      */
    }

    public toggleDragDropUI() {
      this.dragDropUIForKeyboardShown = !this.dragDropUIForKeyboardShown;
      this.userSettingsManagerService.updateReorderByKeyboard(this.dragDropUIForKeyboardShown); // remember this setting for future loading of the reorder component (will default to this setting)
    }

    public toggleShowingKeyboardAction() {
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
                this.reorderStatus = "Grabbed item " + nonZeroIndexItem;
                this.grabbedClipIndex = childIndicator;
                this.clipIsSelected[childIndicator] = true;
                this.droppedTargetIndex = childIndicator; // right now we are sitting at the drop target, i.e., a no-operation or no-op in case user hits space/Enter in succession
              }
              else {
                  this.doItemDrop("");
              }
            }
        }
        else if (eventCode == "Escape") {
          if (this.grabbedClipIndex != -1) {
            if (this.grabbedClipIndex != this.droppedTargetIndex) {
              // Did some list manipulation, so restore it back to its original form first.
              var oneGrabbedClip: Playlist;
              oneGrabbedClip = new Playlist(this.clipSet[this.droppedTargetIndex].storyID, this.clipSet[this.droppedTargetIndex].title);

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

            if (this.droppedTargetIndex != -1)
                this.clipIsSelected[this.droppedTargetIndex] = false; // No longer selected...

            this.reorderStatus = "Cancelled reordering";
            this.terminatingStatusShown = true; // this message wraps up an action; persist it a bit...

            var originalGrabSlot: number = this.grabbedClipIndex;

            // Clear bookkeeping before any focus updates to note the escape/cancel action is completed:
            this.grabbedClipIndex = -1;
            this.droppedTargetIndex = -1;

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
                this.clipIsSelected[this.droppedTargetIndex] = false; // old one off
                // Have nextIndex hold the initially grabbed item:
                this.clipSet[nextIndex].storyID = oneGrabbedClip.storyID;
                this.clipSet[nextIndex].title = oneGrabbedClip.title;
                // Update where the dropped target now sits
                this.droppedTargetIndex = nextIndex;
                // Be sure it is selected:
                this.clipIsSelected[this.droppedTargetIndex] = true; // new one on

                // Be sure next is focused, too:
                const nextItem = this.getNthElement(nextIndex);
                if (nextItem) {
                    if (nextItem.nativeElement)
                      nextItem.nativeElement.focus();
                }
                var nonZeroIndexGrabbed:number = this.grabbedClipIndex + 1;
                var nonZeroIndexDroppedTarget:number = this.droppedTargetIndex + 1;
                if (nonZeroIndexGrabbed != nonZeroIndexDroppedTarget)
                    this.reorderStatus = "Moving item " + nonZeroIndexGrabbed + " to " + nonZeroIndexDroppedTarget;
                else
                    this.reorderStatus = "Keeping list as is";
            }
        }
    }

    public dropInClipsList(event:CdkDragDrop<PlaylistInterface[]>) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.doMyClipsUpdate(); // Update the My Clips set based on this new reordering.
    }
}
