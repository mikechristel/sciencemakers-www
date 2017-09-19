import { Injectable } from '@angular/core';
import { SearchResult } from './storyset/search-result';
import { Playlist } from './shared/playlist/playlist';

@Injectable()
export class GlobalState {

    static NOTHING_CHOSEN: number = -1; // indicates a null choice, an empty choice, as "real" IDs will have values >= 0
    static NO_ACCESSION_CHOSEN: string = ""; // indicates a null choice, an empty choice, as "real" accession IDs will be non-empty

    static SearchPageSize: number = 30;
    static SearchTitleOnly: boolean = false; // if true, queries to stories will be targeted only to the story title field
    static SearchTranscriptOnly: boolean = false; // if true, queries to stories will be targeted only to the transcript field

    static BiographyPageSize: number = 30;

    static BiographySearchSortingPreference: number = 0;
    static StorySearchSortingPreference: number = 0;

    static BiographySearchLastNameOnly: boolean = false; // if true, queries to biography will be targeted only to the last name field
    static BiographySearchPreferredNameOnly: boolean = false; // if true, queries to biography will be targeted only to the preferred name field
    // NOTE: There has been an explosion of biography search fields.  If both BiographySearchLastNameOnly and BiographySearchPreferredNameOnly are false,
    // then BiographySearchFieldMask is referred to in order to decide which fields are chosen to be searched by the user.
    static BiographySearchAccession_On: number = 1;
    static BiographySearchDescriptionShort_On: number = 2;
    static BiographySearchBiographyShort_On: number = 4;
    static BiographySearchFirstName_On: number = 8;
    static BiographySearchLastName_On: number = 16;
    static BiographySearchPreferredName_On: number = 32;
    static BiographySearchOccupations_On: number = 64;
    static BiographySearchFieldMask: number = GlobalState.BiographySearchPreferredName_On | GlobalState.BiographySearchLastName_On | GlobalState.BiographySearchDescriptionShort_On;

    static EARLIEST_INTERVIEW_YEAR_POSSIBLE: number = 1993; // TODO: Move into an external configuration file or a set-up API service call to remove this built-in knowledge of corpus specifics
    static EarliestInterviewYearToKeep: number = 0;
    static LatestInterviewYearToKeep: number = 0;

    static MALE_MARKER: string = "Male";
    static FEMALE_MARKER: string = "Female";

    static FEMALE_ID: number = 0;
    static MALE_ID: number = 1;

    static matchSetContext: SearchResult;

    static myStarredStoriesList: number[] = [];
    static playlist: Playlist[] = [];

    static PENDING_STORY_SET_TITLE: string = "ScienceMakers, Pending Story Set";
    static EMPTY_STORY_SET_TITLE: string = "ScienceMakers, No Stories Found";
    static PENDING_SCIENCEMAKERS_SET_TITLE: string = "Pending ScienceMakers Set";

    static volume: number = .8;

    static StarredStoriesFromString(csvList: string) {
        var storyIDs: string[] = csvList.split(",");
        var oneID: number;
        GlobalState.myStarredStoriesList = [];
        for (var i: number = 0; i < storyIDs.length; i++) {
            oneID = Number(storyIDs[i]);
            if (!Number.isNaN(oneID))
                GlobalState.myStarredStoriesList.push(oneID);
        }
    }

    static StarredStoriesAsString(): string {
        var retVal: string = "";
        var favCount: number = GlobalState.myStarredStoriesList.length;
        if (favCount > 0) {
            retVal = GlobalState.myStarredStoriesList[0].toString();
            for (var i:number = 1; i < GlobalState.myStarredStoriesList.length; i++)
                retVal = retVal + "," + GlobalState.myStarredStoriesList[i];
        }
        return retVal;
    }

    // Return mmmm d, yyyy format of a given date string, assuming input string is in format yyyy-mm-dd and then possibly T00:00:00+00:00 or similar time code suffix at end
    // NOTE: the "simple" method of using Date object gets more complicated because you do not want the time zone to roll the day over improperly for local time zone.
    // So, we maintain work in this function only with string operations, not with any Date() calls.
    static cleanedMonthDayYear(dateString: string): string {
        var retVal: string = ""; // keep as "" for null input
        var monthString: string[] = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        if (dateString != null && dateString.length >= 10) {
            var whichMonth: number = +dateString.substring(5, 7);
            if (whichMonth >= 1 && whichMonth <= 12) {
                var givenDay: number = +dateString.substring(8, 10);
                retVal = monthString[whichMonth - 1] + " " + givenDay + ", " + dateString.substring(0, 4);
            }
        }
        return retVal;
    }

    // Return a mm:ss format equivalent to the specified number of milliseconds, dropping out fractional part
    // and returning 0:ss for values under a minute.  Return 0:00 for negative values or 0, and
    // impose a ceiling of 99:59 for huge values.
    static convertToMMSS(givenVal: number): string {
        const MAX_MILLISECS_SUPPORTED = 5999; // 99 minutes and 59 seconds, 99:59
        var workVal = Math.floor(givenVal / 1000); // convert milliseconds to seconds
        // Protect for goofy values:
        if (workVal < 0)
            workVal = 0;
        else if (workVal > MAX_MILLISECS_SUPPORTED)
            workVal = MAX_MILLISECS_SUPPORTED;
        var minutes = Math.floor(workVal / 60);
        var seconds = workVal - (60 * minutes);
        var minutesString: string = minutes.toString();
        var secondsString: string = seconds.toString();
        if (secondsString.length == 1)
            secondsString = "0" + secondsString;
        return minutesString + ":" + secondsString;
    }

    // Thin out the given string by removing all . ? / ; characters, as these are not addressed by
    // Angular 2 URLSearchParams.  From https://angular.io/docs/ts/latest/api/http/index/URLSearchParams-class.html,
    // other characters that are not encoded are: $ \' ( ) * + , ; A 9 - . _ ~ ? / but that's not correct it seems since
    // + for example is turned into %2B.
    // !!!TBD!!! TODO: Perhaps be stricter here and only allow a small subset of characters to be accepted like A-Z,a-z,0-9, space, *, etc.
    // Instead, we opted to remove four problem characters that affect router/ URL parsing.
    // Update June 2017: allowing "." as that is an important character to search for in accession field on biographies.
    // Formerly, "." was stripped out along with ? / ;.
    static cleanedRouterParameter(givenString: string): string {
        return givenString
            .replace(/\?/gi, '')
            .replace(/\//gi, '')
            .replace(/\;/gi, '');
    }
}
