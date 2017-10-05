import { Component, Input, Output, EventEmitter, Inject } from '@angular/core';
import { StoryDocument } from '../storyset/story-document';
import { StoryHighlight } from '../storyset/story-highlight';
import { GlobalState } from '../app.global-state';
import { AppConfig } from '../config/app-config';

import { Playlist } from '../shared/playlist/playlist';
import { PlaylistManagerService } from '../playlist-manager/playlist-manager.service';
import { Subscription }   from 'rxjs/Subscription';

@Component({
    selector: 'thda-story',
    templateUrl: './story-stamp.component.html',
    styleUrls: ['./story-stamp.component.scss']
})

// This class is used to present a single story in a presumed grid/list of stories.
// It takes as input the story details in the form of a StoryDocument object, and the ID of whatever story might be
// selected to appropriately decorate the selected story in a grid/list.
// It emits the onSelected event when it fires its onSelect event.
// See https://angular.io/docs/ts/latest/cookbook/component-communication.html for more on component communication.
export class StoryStampComponent {
    @Input() story: StoryDocument;
    @Input() highlights: StoryHighlight;
    @Input('selectedID') selectedStoryID: number;
    @Input() isStarredSetItem: boolean;
    @Input() cardView: boolean;
    @Output() onSelected = new EventEmitter<number>();
    @Output() triggerRemoval = new EventEmitter<number>();
    @Output() storyForPlaylist = new EventEmitter<number>();
    @Output() hideParent = new EventEmitter<boolean>();


    private subscription: Subscription;
    public myMediaBase: string;
    public playlist: Playlist[];
    public inPlaylist: boolean;
    public hideCheckmark: boolean;
    public mobilePopover: boolean = false;
    public mobileTooltipMessage: string;
    private timer: any;

    constructor(private config: AppConfig, private playlistManagerService: PlaylistManagerService) {
      this.myMediaBase = this.config.getConfig('mediaBase');
      this.subscription = playlistManagerService.playlist$.subscribe((value) => {
            this.playlist = value;
            this.isInPlaylist(this.story);
        })
    }

    ngOnInit() {
        this.playlist = this.playlistManagerService.initializePlaylist();
        var idx: number;

        idx = this.playlist.findIndex(x => x.storyID == this.story.storyID);
        if (idx >= 0) {
            this.inPlaylist = true;
        }
        else {
            this.inPlaylist = false;
        }
        this.hideCheckmark = this.inPlaylist;
    }

    removeCard(isStarredSetItem) {
        if (isStarredSetItem) this.hideParent.emit();
    }

    togglePlaylist(story) {

        this.storyForPlaylist.emit(story);
        this.isInPlaylist(story);
        this.toggleToolTip();
    }

    // This custom tooltip implementation is a temporary workaround
    // until ngx-bootstrap releases a fix for this issue: https://github.com/valor-software/ngx-bootstrap/issues/2257
    toggleToolTip() {
        this.inPlaylist ? this.mobileTooltipMessage = "Added to Playlist" : this.mobileTooltipMessage = "Removed from Playlist";
        this.mobilePopover = true;
        clearTimeout(this.timer);
        this.timer = setTimeout(()=>{ this.mobilePopover = false; },2000);
    }

    isInPlaylist(story) {
        let idx: any;

        idx = this.playlist.findIndex(x => x.storyID == story.storyID)
        if (idx >= 0) this.inPlaylist = true;
        else this.inPlaylist = false;
    }

    isSelected(oneStoryID: number) {
        return oneStoryID == this.selectedStoryID;
    }

    onSelect(oneStoryID: number) {
        this.onSelected.emit(oneStoryID);
    }

    removeFromStarredSet(e, storyIDForRemoval: number) {
        e.stopPropagation(); // do not allow click on "X" remove button to trigger click action to open that story as well
        this.triggerRemoval.emit(storyIDForRemoval);
    }

    convertToMMSS(givenVal: number): string {
        return GlobalState.convertToMMSS(givenVal);
    }

    // Return the given string, unless it is too long, then return a shortened form ended with ...
    // NOTE: new manner of showing title will often crop long titles out of view without user able to see
    // the truncation cue of "..." but the advantage is we are not showing extra lines of space for most results
    // in order to show the ending ... line for a few (which was true even when max-allowable-length was 80).
    truncatedAsNeeded(givenString: string): string {
        var validatedString: string = givenString;
        const MAX_ALLOWABLE_LENGTH = 160;
        if (validatedString != null && validatedString.length > MAX_ALLOWABLE_LENGTH) {
            var lastIndex = givenString.lastIndexOf(' ', MAX_ALLOWABLE_LENGTH - 3);
            if (lastIndex < 0)
                // Could not find a space to break on, so just keep first MAX_ALLOWABLE_LENGTH - 3 characters
                lastIndex = MAX_ALLOWABLE_LENGTH - 2;
            validatedString = givenString.substring(0, lastIndex) + "...";
        }
        return validatedString;
    }

    makeDatePretty(givenDate: string): string {
        var month: string = "";
        var monthAsNumber: number;
        var day: string;

        if (givenDate != null && givenDate.length >= 10) {
            // NOTE:  Date form starts yyyy-mm-dd
            monthAsNumber = +givenDate.substr(5, 2);
            switch (monthAsNumber) {
                case 1: month = "Jan."; break;
                case 2: month = "Feb."; break;
                case 3: month = "Mar."; break;
                case 4: month = "Apr."; break;
                case 5: month = "May"; break;
                case 6: month = "June"; break;
                case 7: month = "July"; break;
                case 8: month = "Aug."; break;
                case 9: month = "Sep."; break;
                case 10: month = "Oct."; break;
                case 11: month = "Nov."; break;
                case 12: month = "Dec."; break;
            }
            if (givenDate.substr(8, 1) == "0")
                day = givenDate.substr(9, 1); // drop leading zero
            else
                day = givenDate.substr(8, 2);
            return month + " " + day + ", " + givenDate.substr(0, 4);
        }
        else
            return ""; // give up on bad input data
    }
}
