import { Component, OnInit, Pipe, PipeTransform, Inject, Input, EventEmitter, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

import { TitleManagerService } from '../../title-manager.service';
import { GlobalState } from '../../app.global-state';
import { StorySetType } from '../../storyset/storyset-type';
import { MenuService } from '../../menu/menu.service';

@Component({
    selector: 'story-search',
    templateUrl: './story-search.component.html',
    styleUrls: ['./story-search.component.scss']
})

export class StorySearchComponent implements OnInit {
    @Input('mobileSearch') mobileSearchOpen: boolean;
    @Input() mobile: boolean;
    @Input() searchInBio: boolean;
    @Input() dropdown: boolean = true;

    @Output() menuState: EventEmitter<string> = new EventEmitter<string>();
    @Output() searchEmit: EventEmitter<any> = new EventEmitter<any>();

    biographyIDForLimitingSearch: number;
    storySearch: string;
    txtQuery: string = ""; // this is the query string as edited by the user
    inputPlaceholder: string;
    searchTitleOnly: boolean;
    searchTranscriptOnly: boolean;
    resultsSize: number;
    searchLastNameOnly: boolean;
    searchPreferredNameOnly: boolean;
    fields: string[] = ['all fields','title','transcript']
    searchByField: string;
    subscription: Subscription;
    uniqueID: string;

    constructor(private router: Router,
                private titleManagerService: TitleManagerService,
                private menuService: MenuService) {
                this.subscription = menuService.searchOption$.subscribe((value) => {
                    this.storySearch = value;
                    this.setFieldOptions(value);
                    this.setPlaceholderVal();
                });
                this.subscription = menuService.bioID$.subscribe((value) => {
                    this.biographyIDForLimitingSearch = value;
                })
    }

    ngOnInit() {
        this.uniqueID = Math.floor((Math.random() * 1000) + 1).toString();
        if (this.biographyIDForLimitingSearch != null && this.biographyIDForLimitingSearch != GlobalState.NOTHING_CHOSEN)
            this.inputPlaceholder = "Search this person's stories...";
        else if (this.storySearch === 'bio')
            this.inputPlaceholder = "Search ScienceMakers...";
        else
            this.inputPlaceholder = "Search stories...";
        this.searchTitleOnly = GlobalState.SearchTitleOnly;
        this.searchTranscriptOnly = GlobalState.SearchTranscriptOnly;
        this.resultsSize = GlobalState.SearchPageSize;
        this.setField();
    }

    setPlaceholderVal() {
        if (this.storySearch === 'bio')
            this.inputPlaceholder = "Search ScienceMakers...";
        else if (this.storySearch === 'storiesInBio' || this.searchInBio === true)
            this.inputPlaceholder = "Search this person's stories...";
        else
            this.inputPlaceholder = "Search stories...";
    }

    toggleMenu() {
        this.menuState.emit('close');
    }

    doSearch() {
        GlobalState.SearchTitleOnly = this.searchTitleOnly;
        GlobalState.SearchTranscriptOnly = this.searchTranscriptOnly;

        // Accumulate routing parameters specifying filter specification, page information, etc.
        if (this.txtQuery != null && this.txtQuery.length > 0) {
            // Proceed with route parameter computations and doing the search.
            var moreOptions = [];

            moreOptions['q'] = GlobalState.cleanedRouterParameter(this.txtQuery);
            this.titleManagerService.setTitle(GlobalState.PENDING_STORY_SET_TITLE);
            moreOptions['pg'] = 1; // always show page 1 of new query
            moreOptions['pgS'] = GlobalState.SearchPageSize; // use global context page size

            if (this.searchTitleOnly) // use explicit "search-title-only" indicator of sT if true
                moreOptions['sT'] = "1";
            else if (this.searchTranscriptOnly) // use explicit "search-transcript-only" indicator of sS (search spoken) if true
                moreOptions['sS'] = "1";
            // else default to "both" without the use of an explicit flag

            if ((this.storySearch === 'storiesInBio') && (this.biographyIDForLimitingSearch != null && this.biographyIDForLimitingSearch != GlobalState.NOTHING_CHOSEN))
                moreOptions['ip'] = this.biographyIDForLimitingSearch; // flag that an "inside THIS person" search context will be set and used
            if (this.searchInBio === true)
                moreOptions['ip'] = this.biographyIDForLimitingSearch;

            this.router.navigate(['/stories', StorySetType.TextSearch, moreOptions]);
            this.toggleMenu();
            this.txtQuery = "";
        }
    }

    doComponentSpecificSearch() {
        // this.searchEmit.emit();
        this.menuService.doSearch(this.txtQuery);
        this.txtQuery = "";
    }

    noNeedForSearch(): boolean { // Returns true iff there is no need for search action (i.e., no search query).
        return (this.txtQuery == null || this.txtQuery.length == 0);
    }

    setPageSize(newSize: number) {
        GlobalState.SearchPageSize = newSize;
        this.resultsSize = newSize;
    }

    setFieldOptions(type) {
        if (type === 'bio') {
            this.fields = ['chosen fields','last name','preferred name'];
        }
        else {
            this.fields = ['all fields','title','transcript'];
        }
    }

    setField() {
        if (this.storySearch === 'bio') {
            if (this.searchLastNameOnly === true) {
                this.searchByField = "last name";
            }
            else if (this.searchPreferredNameOnly === true) {
                this.searchByField = "preferred name";
            }
            else { // "chosen fields" picked, so do not limit search to just one field or the other
                this.searchByField = "chosen fields";
            }
        }
        else {
            if (this.searchTitleOnly === true) {
                this.searchByField = "title";
            }
            else if (this.searchTranscriptOnly === true) {
                this.searchByField = "transcript";
            }
            else { // "both" picked, so do not limit search to just one field or the other
                this.searchByField = "all fields";
            }
        }
    }

    searchFieldChange(currentPick: string) {
        if (this.storySearch === 'bio') {
            if (currentPick == "last name") {
                this.searchLastNameOnly = true;
                this.searchPreferredNameOnly = false;
            }
            else if (currentPick == "preferred name") {
                this.searchLastNameOnly = false;
                this.searchPreferredNameOnly = true;
            }
            else { // "chosen fields" picked, so do not limit search to just one field or the other
                this.searchLastNameOnly = false;
                this.searchPreferredNameOnly = false;
            }
            GlobalState.BiographySearchLastNameOnly = this.searchLastNameOnly;
            GlobalState.BiographySearchPreferredNameOnly = this.searchPreferredNameOnly;
            this.searchByField = currentPick;
        }
        else {

            if (currentPick == "title") {
                this.searchTitleOnly = true;
                this.searchTranscriptOnly = false;
            }
            else if (currentPick == "transcript") {
                this.searchTitleOnly = false;
                this.searchTranscriptOnly = true;
            }
            else { // "both" picked, so do not limit search to just one field or the other
                this.searchTitleOnly = false;
                this.searchTranscriptOnly = false;
            }
            this.searchByField = currentPick;
            GlobalState.SearchTitleOnly = this.searchTitleOnly;
            GlobalState.SearchTranscriptOnly = this.searchTranscriptOnly;
        }
    }

    routeToAdvancedSearch() {
        var moreOptions = [];

        if (this.biographyIDForLimitingSearch != null && this.biographyIDForLimitingSearch != GlobalState.NOTHING_CHOSEN)
            moreOptions['ip'] = this.biographyIDForLimitingSearch; // flag that an "inside THIS person" search context will be set and used

        this.router.navigate(['/storyadvs', moreOptions]);
        this.toggleMenu();
    }

    routeToAdvancedBioSearch() {
        this.router.navigate(['/bioadvs']);
        this.toggleMenu();
    }

    ngOnDestroy() {
    // prevent memory leak when component destroyed
        this.subscription.unsubscribe();
    }
}
