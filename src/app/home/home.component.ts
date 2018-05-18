import { Component, OnInit, Pipe, PipeTransform, Inject, Input } from '@angular/core';
import { Router } from '@angular/router';

import { HistoryMakerService } from '../historymakers/historymaker.service';
import { TitleManagerService } from '../title-manager.service';
import { MenuService } from '../menu/menu.service';
import { StorySetType } from '../storyset/storyset-type';

import { GlobalState } from '../app.global-state';
import { environment } from '../../environments/environment';

import { BriefBio } from '../historymakers/brief-bio';
import { BiographyStampComponent } from '../biography-stamp/biography-stamp.component';

import { KeysPipe } from './keys.pipe'

@Component({
    selector: 'thda-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
    txtQuery: string = ""; // this is the query string as edited by the user
    searchTitleOnly: boolean;
    searchTranscriptOnly: boolean;

    storyCount: string;
    biographyCount: string;
    scienceMakersStoryCount: string;
    scienceMakersBiographyCount: string;

    today: number = Date.now();
    resultsSize: number;
    fields: string[] = ['all fields','title','transcript']
    searchByField: string;
    biographies: BriefBio[];
    confirmedNoBirthdays: boolean;
    cardView: boolean = true;

    public myMediaBase: string;

    constructor(
        private router: Router,
        private historyMakerService: HistoryMakerService,
        private titleManagerService: TitleManagerService,
        private menuService: MenuService) {
            this.myMediaBase = environment.mediaBase;
    }

    ngOnInit() {
        var monthIndicator: number;
        this.menuService.setSearchOption('story');
        this.titleManagerService.setTitle("The ScienceMakers Digital Archive (May 2018)");
        this.searchTitleOnly = GlobalState.SearchTitleOnly;
        this.searchTranscriptOnly = GlobalState.SearchTranscriptOnly;
        this.resultsSize = GlobalState.SearchPageSize;
        this.setField();
        this.historyMakerService.getCorpusSpecifics()
            .subscribe(corpusDetails => {
              this.storyCount = corpusDetails.storyCount.toLocaleString();
              this.biographyCount = corpusDetails.biographyCount.toLocaleString();
              // NOTE: when testing, we may not have specific ScienceMakers counts, as that is a "special" API that might not be in the testing infrastructure.
              // So, do not presume the existence of these counts.
              if (corpusDetails.scienceMakersBiographyCount)
                  this.scienceMakersBiographyCount = corpusDetails.scienceMakersBiographyCount.toLocaleString();
              if (corpusDetails.scienceMakersStoryCount)
                  this.scienceMakersStoryCount = corpusDetails.scienceMakersStoryCount.toLocaleString();
        });
        // Do not qualify the people born this month in any way (i.e., no filtering, no paging): just get them all (hence null filtering/paging parameters):
        this.historyMakerService.getHistoryMakersBornThisMonth(null, null, null, null, null, null, null).subscribe(retSet => {
          this.biographies = retSet.biographies;
          if (this.biographies == null || this.biographies.length == 0) {
              this.confirmedNoBirthdays = true;
          }
        });
    }

    searchFieldChange(currentPick: string) {
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
        GlobalState.SearchTitleOnly = this.searchTitleOnly;
        GlobalState.SearchTranscriptOnly = this.searchTranscriptOnly;
        this.searchByField = currentPick;
    }

    doSearch() {
        // This legal range check should be built into the input controls, but just in case, do possibly redundant check here:
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

            this.router.navigate(['/stories', StorySetType.TextSearch, moreOptions]);
        }
    }

    noNeedForSearch(): boolean { // Returns true iff there is no need for search action (i.e., no search query).
        return (this.txtQuery == null || this.txtQuery.length == 0);
    }

    setPageSize(newSize: number) {
        GlobalState.SearchPageSize = newSize;
        this.resultsSize = newSize;
    }

    setField() {
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

    onSelected(bio: BriefBio) {

      // NOTE: ID is *REQUIRED* and so is part of link parameters array (along with /detail) rather than in optional data like spec.
      // The optional data allows a "go back" operation to be easily made (go back to source page filtered appropriately).
      var moreNavigationParams = {};
      moreNavigationParams['ID'] = bio.document.accession;
      moreNavigationParams['bt'] = "1"; // born this time marker (to allow go-back to go back to a born this month set of people)
      this.router.navigate(['/storiesForBio', moreNavigationParams]);
  }

}
