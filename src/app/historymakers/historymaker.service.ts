import { Injectable, Inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from "rxjs/Rx";

import { TableOfContents } from './table-of-contents';
import { FacetDetail } from './facet-detail';
import { StringFacet } from './string-facet';
import { BriefBio } from './brief-bio';

import { SearchResult } from '../storyset/search-result';
import { CorpusSpecifics } from './corpus-specifics';

import { SearchFacetsDetails } from './search-facets-details';

import { environment } from '../../environments/environment';
import { GlobalState } from '../app.global-state';

import { GoogleAnalyticsEventsService } from '../google-analytics-events.service';

@Injectable()
export class HistoryMakerService {
    private corpusSpecificsURL = 'HomePageInfo';
    private peopleURL = 'BiographySearch';
    // not used, private peopleBornThisDayURL = 'PeopleBornThisDay';
    private peopleBornThisMonthURL = 'PeopleBornThisMonth';
    private searchFacetsURL = 'facetList';
    private idsLoadIntoSetURL = 'FavoritesSet?csvList=';

    // NOTE:  Caching the string descriptions for numeric IDs used for Maker and OccupationTypes via an api/facetList call:
    private cachedFacetDetails: SearchFacetsDetails = null;
    private cachedMakerCategories: FacetDetail[] = [];
    private cachedOccupationTypes: FacetDetail[] = [];

    constructor(private http: HttpClient, private gaService: GoogleAnalyticsEventsService) {}

    private storeFacetDetails(givenDetails: SearchFacetsDetails) {
      if (this.cachedFacetDetails != null)
        return; // details already in cache

        var oneItem: FacetDetail;
        var assembledList: FacetDetail[] = [];
        this.cachedFacetDetails = givenDetails;
        for (var i: number = 0; i < this.cachedFacetDetails.makerCategories.length; i++) {
            oneItem = new FacetDetail();
            oneItem.ID = this.cachedFacetDetails.makerCategories[i].id;
            oneItem.value = this.cachedFacetDetails.makerCategories[i].description;
            assembledList.push(oneItem);
        }
        this.cachedMakerCategories = assembledList;
        assembledList = [];
        for (var j: number = 0; j < this.cachedFacetDetails.occupationTypes.length; j++) {
            oneItem = new FacetDetail();
            oneItem.ID = this.cachedFacetDetails.occupationTypes[j].id;
            oneItem.value = this.cachedFacetDetails.occupationTypes[j].description;
            assembledList.push(oneItem);
        }
        this.cachedOccupationTypes = assembledList;
    }

    getFacetDetails(): Observable<SearchFacetsDetails> {
        if (this.cachedFacetDetails != null)
            return Observable.of(this.cachedFacetDetails);
        else {
            return this.http.get<SearchFacetsDetails>(environment.serviceBase + this.searchFacetsURL)
                              .do(fd => this.storeFacetDetails(fd));
        }
    }

    getCorpusSpecifics(): Observable<CorpusSpecifics> {
      // NOTE: using advice from https://stackoverflow.com/questions/40788163/how-to-make-nested-observable-calls-in-angular2
        return this.getFacetDetails()
          .flatMap(fd => this.http.get<CorpusSpecifics>(environment.serviceBase + this.corpusSpecificsURL));
    }

    getHistoryMakersBornThisMonth(givenPage: number, givenPageSize: number,
      genderFacet: string, birthDecadeFacet: string, makerFacets: string, jobFacets: string, lastInitialFacetSpec: string): Observable<TableOfContents> {
        var addedArgs: string = "";
        if (givenPage != null && givenPage > 0)
            addedArgs = addedArgs + "&currentPage=" + givenPage;
        if (givenPageSize != null && givenPageSize > 0)
            addedArgs = addedArgs + "&pageSize=" + givenPageSize;
        if (genderFacet != null && genderFacet.length > 0)
            addedArgs = addedArgs + "&genderFacet=" + genderFacet;
        if (birthDecadeFacet != null && birthDecadeFacet.length > 0)
            addedArgs = addedArgs + "&yearFacet=" + birthDecadeFacet;
        if (makerFacets != null && makerFacets.length > 0)
            addedArgs = addedArgs + "&makerFacet=" + makerFacets;
        if (jobFacets != null && jobFacets.length > 0)
            addedArgs = addedArgs + "&jobFacet=" + jobFacets;
        if (lastInitialFacetSpec != null && lastInitialFacetSpec.length > 0)
            addedArgs = addedArgs + "&lastInitialFacet=" + lastInitialFacetSpec;

        // NOTE:  always pass in "this day" from the client perspective, as an additional argument to the service:
        var dateNow = new Date();
        // Remember to map months from [0,11] to [1,12] range; date is fine as is.
        var dateAsYYYYMD = dateNow.getFullYear() + "-" + (dateNow.getMonth() + 1) + "-" + dateNow.getDate();
        addedArgs = addedArgs + "&dateTodayFacet=" + dateAsYYYYMD;

        // Replace opening & with ? character instead (since there always are contents in addedArgs, at least the dateTodayFacet argument).
        addedArgs = "?" + addedArgs.substring(1);

        return this.getFacetDetails()
          .flatMap(fd => this.http.get<TableOfContents>(environment.serviceBase + this.peopleBornThisMonthURL + addedArgs));
    }

    getHistoryMakers(givenQuery: string, searchJustLastNameFieldFlag: boolean, searchJustPreferredFieldFlag: boolean,
      givenPage: number, givenPageSize: number, genderFacet: string, birthDecadeFacet: string,
      makerFacets: string, jobFacets: string, lastInitialFacet: string,
      sortField: string, sortInDescendingOrder: boolean): Observable<TableOfContents> {
        var addedArgs: string = "";
        var queryArg: string;
        var queryIssued: boolean = false;

        // NOTE: To accommodate consistent analytics reporting, move the query argument to the front.
        // (Later processing likely will only issue an analytics event if there is a query string.)
        if (givenQuery == null || givenQuery.length == 0)
            queryArg = "query=*";
        else {
            queryArg = "query=" + givenQuery;
            queryIssued = true;
        }

        if (givenPage != null && givenPage > 0)
            addedArgs = addedArgs + "&currentPage=" + givenPage;
        if (givenPageSize != null && givenPageSize > 0)
            addedArgs = addedArgs + "&pageSize=" + givenPageSize;
        if (givenQuery == null || givenQuery.length == 0)
            addedArgs = addedArgs + "&query=*";
        else
            addedArgs = addedArgs + "&query=" + givenQuery;
        if (genderFacet != null && genderFacet.length > 0)
            addedArgs = addedArgs + "&genderFacet=" + genderFacet;
        if (birthDecadeFacet != null && birthDecadeFacet.length > 0)
            addedArgs = addedArgs + "&yearFacet=" + birthDecadeFacet;
        if (makerFacets != null && makerFacets.length > 0)
            addedArgs = addedArgs + "&makerFacet=" + makerFacets;
        if (jobFacets != null && jobFacets.length > 0)
            addedArgs = addedArgs + "&jobFacet=" + jobFacets;
        if (lastInitialFacet != null && lastInitialFacet.length > 0)
            addedArgs = addedArgs + "&lastInitialFacet=" + lastInitialFacet;

        // NOTE: currently we are always specifying the search fields, even if both searchJustLastNameFieldFlag and searchJustPreferredFieldFlag are false.
        addedArgs = addedArgs + "&searchFields=" + this.searchFieldsForBiographySearch(searchJustLastNameFieldFlag, searchJustPreferredFieldFlag);
        if (sortField != null && sortField.length > 0) {
            addedArgs = addedArgs + "&sortField=" + sortField;
            // Only bother with sortInDescendingOrder if sortField non-empty.
            if (sortInDescendingOrder != null)
              addedArgs = addedArgs + "&sortInDescendingOrder=" + sortInDescendingOrder;
        }
        // NOTE: addedArgs could have stayed empty ("").

        return this.getFacetDetails()
          .flatMap(fd => this.http.get<TableOfContents>(environment.serviceBase + this.peopleURL + "?" + queryArg + addedArgs))
          .do(res => {
              if (queryIssued) {
                // Do extra logging if there was a query involved (instead of a simple look-up of all Makers, for example).
                if (res.count > 0)
                    this.gaService.emitEvent("Maker Query", queryArg + "&count=" + res.count + addedArgs);
                else
                    this.gaService.emitEvent("Maker Query (Empty)", queryArg + addedArgs);
              }
        });
    }

    private searchFieldsForBiographySearch(justLastName: boolean, justPreferredName: boolean): string {
        var csvFieldsToSearch: string = "";

        if (justLastName)
            csvFieldsToSearch = "lastName";
        else if (justPreferredName)
            csvFieldsToSearch = "preferredName";
        else {
            if ((GlobalState.BiographySearchFieldMask & GlobalState.BiographySearchAccession_On) != 0)
                csvFieldsToSearch += "accession,";
            if ((GlobalState.BiographySearchFieldMask & GlobalState.BiographySearchDescriptionShort_On) != 0)
                csvFieldsToSearch += "descriptionShort,";
            if ((GlobalState.BiographySearchFieldMask & GlobalState.BiographySearchBiographyShort_On) != 0)
                csvFieldsToSearch += "biographyShort,";
            if ((GlobalState.BiographySearchFieldMask & GlobalState.BiographySearchFirstName_On) != 0)
                csvFieldsToSearch += "firstName,";
            if ((GlobalState.BiographySearchFieldMask & GlobalState.BiographySearchLastName_On) != 0)
                csvFieldsToSearch += "lastName,";
            if ((GlobalState.BiographySearchFieldMask & GlobalState.BiographySearchPreferredName_On) != 0)
                csvFieldsToSearch += "preferredName,";
            if ((GlobalState.BiographySearchFieldMask & GlobalState.BiographySearchOccupations_On) != 0)
                csvFieldsToSearch += "occupations,";
            if (csvFieldsToSearch.length > 0)
                csvFieldsToSearch = csvFieldsToSearch.substr(0, csvFieldsToSearch.length - 1); // take off spurious , at end
            else // NOTE: never allow no fields to be chosen.  Default to just last name
                csvFieldsToSearch = "lastName";
        }
        return csvFieldsToSearch;
    }

    getJobFamilyList(chosenJobs: number[]): Observable<string> {
      if (chosenJobs == null || chosenJobs.length == 0)
        return Observable.of("");
      else
        // NOTE: cannot proceed to getting the job family list corresponding to numerals before first having search facets all in place.
        return this.getFacetDetails()
          .map(fd => {
            // NOTE: If chosenJobs are empty, or are not in the OccupationTypes table, an empty string is returned.
            var gatheredNames: string = "";
            var gatheredJobs: string[] = [];
            var j: number;
            if (this.cachedOccupationTypes != null) {
                for (var i = 0; i < this.cachedOccupationTypes.length; i++) {
                    for (j = 0; j < chosenJobs.length; j++)
                        if (this.cachedOccupationTypes[i].ID == chosenJobs[j]) {
                            gatheredJobs.push(this.cachedOccupationTypes[i].value);
                            break;
                        }
                }
            }
            if (gatheredJobs.length > 0) {
                gatheredNames = gatheredJobs[0];
                for (var i = 1; i < gatheredJobs.length; i++) {
                    gatheredNames += "; " + gatheredJobs[i]; // separate each entry with '; '
                }
            }
            return gatheredNames;
        });
    }

    getMakerGroupList(chosenMakers: number[]) : Observable<string> {
      if (chosenMakers == null || chosenMakers.length == 0)
        return Observable.of("");
      else
        // NOTE: cannot proceed to getting the maker group corresponding to numerals before first having search facets all in place.
        return this.getFacetDetails()
          .map(fd => {
            // NOTE: If chosenMakers are empty, or are not in the MakerCategories table, an empty string is returned.
            var gatheredNames: string = "";
            var gatheredMakers: string[] = [];
            var j: number;
            if (this.cachedMakerCategories != null) {
                for (var i = 0; i < this.cachedMakerCategories.length; i++) {
                    for (j = 0; j < chosenMakers.length; j++)
                        if (this.cachedMakerCategories[i].ID == chosenMakers[j]) {
                            gatheredMakers.push(this.cachedMakerCategories[i].value);
                            break;
                        }
                }
            }
            if (gatheredMakers.length > 0) {
                  gatheredNames = gatheredMakers[0];
                  for (var i = 1; i < gatheredMakers.length; i++) {
                      gatheredNames += ", " + gatheredMakers[i]; // separate each entry with ', '
                  }
              }
              return gatheredNames;
          });
    }

    getJobType(chosenJobType: number): string {
        var retVal: string = "";
        for (var i = 0; i < this.cachedOccupationTypes.length; i++)
            if (this.cachedOccupationTypes[i].ID == chosenJobType) {
                retVal = this.cachedOccupationTypes[i].value;
                break;
            }
        return retVal;
    }

    getMaker(chosenMaker: number): string {
        var retVal: string = "";
        for (var i = 0; i < this.cachedMakerCategories.length; i++)
            if (this.cachedMakerCategories[i].ID == chosenMaker) {
                retVal = this.cachedMakerCategories[i].value;
                break;
            }
        return retVal;
    }

}
