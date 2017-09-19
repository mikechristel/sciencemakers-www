import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router, Params } from '@angular/router';

import { TitleManagerService } from '../title-manager.service';

import { GlobalState } from '../app.global-state';

import { StorySetType } from '../storyset/storyset-type';

import { ChosenBioSearchFieldInfo } from "./chosen-bio-search-field-info";

@Component({
    selector: 'thda-bio-advs',
    templateUrl: './bio-advanced-search.component.html',
    styleUrls: ['./bio-advanced-search.component.scss']
})
export class BiographyAdvancedSearchComponent implements OnInit {
    bioAdvSearchPageTitle: string;
    bioAdvSearchPageTitleLong: string;

    textQuery: string = ""; // this is the biography query string as edited by the user, perhaps not the same as the one already executed to show query results (which is in myCurrentQuery)
    searchLastNameOnly: boolean;
    searchPreferredNameOnly: boolean;
    fields: string[] = ['chosen fields','last name','preferred name'];
    searchByField: string;
    resultsSize: number;
    possibleSearchableBioFields: ChosenBioSearchFieldInfo[];

    constructor(private route: ActivatedRoute,
        private router: Router,
        private titleManagerService: TitleManagerService) {
    }

    ngOnInit() {
        this.bioAdvSearchPageTitle = "Biography Advanced Search Page";
        this.bioAdvSearchPageTitleLong = "Biography Advanced Search Page, The ScienceMakers Digital Archive";
        this.AssembleSetOfSearchableBiographyFields(); // this initializes defaultSearchableBioFields
        this.titleManagerService.setTitle(this.bioAdvSearchPageTitleLong);
        this.searchLastNameOnly = GlobalState.BiographySearchLastNameOnly;
        this.searchPreferredNameOnly = GlobalState.BiographySearchPreferredNameOnly;
        this.resultsSize = GlobalState.BiographyPageSize;
        this.setField();
    }

    private AssembleSetOfSearchableBiographyFields() {
        var oneSearchableBioField: ChosenBioSearchFieldInfo;
        var collectedSetOfBioFields: ChosenBioSearchFieldInfo[] = [];

        oneSearchableBioField = new ChosenBioSearchFieldInfo(0, "Accession", false);
        collectedSetOfBioFields.push(oneSearchableBioField);
        oneSearchableBioField = new ChosenBioSearchFieldInfo(1, "Biography", false);
        collectedSetOfBioFields.push(oneSearchableBioField);
        oneSearchableBioField = new ChosenBioSearchFieldInfo(2, "Description", false);
        collectedSetOfBioFields.push(oneSearchableBioField);
        oneSearchableBioField = new ChosenBioSearchFieldInfo(3, "First Name", false);
        collectedSetOfBioFields.push(oneSearchableBioField);
        oneSearchableBioField = new ChosenBioSearchFieldInfo(4, "Last Name", false);
        collectedSetOfBioFields.push(oneSearchableBioField);
        oneSearchableBioField = new ChosenBioSearchFieldInfo(5, "Preferred Name", false);
        collectedSetOfBioFields.push(oneSearchableBioField);
        oneSearchableBioField = new ChosenBioSearchFieldInfo(6, "Occupations", false);
        collectedSetOfBioFields.push(oneSearchableBioField);
        if (GlobalState.BiographySearchFieldMask & GlobalState.BiographySearchAccession_On)
            collectedSetOfBioFields[0].selected = true;
        if (GlobalState.BiographySearchFieldMask & GlobalState.BiographySearchBiographyShort_On)
            collectedSetOfBioFields[1].selected = true;
        if (GlobalState.BiographySearchFieldMask & GlobalState.BiographySearchDescriptionShort_On)
            collectedSetOfBioFields[2].selected = true;
        if (GlobalState.BiographySearchFieldMask & GlobalState.BiographySearchFirstName_On)
            collectedSetOfBioFields[3].selected = true;
        if (GlobalState.BiographySearchFieldMask & GlobalState.BiographySearchLastName_On)
            collectedSetOfBioFields[4].selected = true;
        if (GlobalState.BiographySearchFieldMask & GlobalState.BiographySearchPreferredName_On)
            collectedSetOfBioFields[5].selected = true;
        if (GlobalState.BiographySearchFieldMask & GlobalState.BiographySearchOccupations_On)
            collectedSetOfBioFields[6].selected = true;
        this.possibleSearchableBioFields = collectedSetOfBioFields;
    }

    onSearchableBioFieldChange(id: number, label: string, isChecked: boolean) {
        var bitFieldOperand: number;
        // NOTE: The mapping between bitmap mask and id is established in AssembleSetOfSearchableBiographyFields().
        // TODO: Named constants could be used for the [0,6] values in these two calls once the code stabilizes.
        switch (id) {
            case 0:
                bitFieldOperand = GlobalState.BiographySearchAccession_On;
                break;
            case 1:
                bitFieldOperand = GlobalState.BiographySearchBiographyShort_On;
                break;
            case 2:
                bitFieldOperand = GlobalState.BiographySearchDescriptionShort_On;
                break;
            case 3:
                bitFieldOperand = GlobalState.BiographySearchFirstName_On;
                break;
            case 4:
                bitFieldOperand = GlobalState.BiographySearchLastName_On;
                break;
            case 5:
                bitFieldOperand = GlobalState.BiographySearchPreferredName_On;
                break;
            case 6:
                bitFieldOperand = GlobalState.BiographySearchOccupations_On;
                break;

        }
        if (isChecked) {
            // If bit is not already on to mark the field as in the default chosen fields set, do so now.
            if ((GlobalState.BiographySearchFieldMask & bitFieldOperand) == 0)
                GlobalState.BiographySearchFieldMask = GlobalState.BiographySearchFieldMask + bitFieldOperand;
        }
        else {
            // If bit is not already cleared to mark the field as NOT in the default chosen fields set, do so now.
            if ((GlobalState.BiographySearchFieldMask | bitFieldOperand) != 0)
                GlobalState.BiographySearchFieldMask = GlobalState.BiographySearchFieldMask - bitFieldOperand;
        }
    }

    doBiographySearch() {

        GlobalState.BiographySearchLastNameOnly = this.searchLastNameOnly;
        GlobalState.BiographySearchPreferredNameOnly = this.searchPreferredNameOnly;

        // Accumulate routing parameters specifying filter specification, page information, etc.
        if (this.textQuery != null && this.textQuery.length > 0) {
            // Proceed with route parameter computations and doing the search.
            var moreOptions = [];

            if (this.searchLastNameOnly)
                moreOptions['ln'] = "1"; // search just the last name field
            else
                moreOptions['ln'] = "0";
            if (this.searchPreferredNameOnly)
                moreOptions['pn'] = "1"; // search just the preferred name field
            else
                moreOptions['pn'] = "0";
            moreOptions['q'] = GlobalState.cleanedRouterParameter(this.textQuery);
            this.titleManagerService.setTitle(GlobalState.PENDING_STORY_SET_TITLE);
            moreOptions['pg'] = 1; // always show page 1 of new query
            moreOptions['pgS'] = GlobalState.BiographyPageSize; // use global context page size

            this.router.navigate(['/all', moreOptions]);
        }
    }

    noNeedForBiographySearch(): boolean { // Returns true iff there is no need for search action (i.e., no search query).
        return (this.textQuery == null || this.textQuery.length == 0);
    }

    setPageSize(newSize: number) {
        GlobalState.BiographyPageSize = newSize;
        this.resultsSize = newSize;
     }

    searchFieldChange(currentPick: string) {
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

    setField() {
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
}
