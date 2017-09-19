// Inspiration for this particular architecture choice is via:
// https://blog.thecodecampus.de/angular-2-include-google-analytics-event-tracking/
import {Injectable} from "@angular/core";

declare let ga: Function;

@Injectable()
export class GoogleAnalyticsEventsService {

  public emitEvent(eventCategory: string,
                   eventAction: string,
                   eventLabel: string = null,
                   eventValue: number = null) {
    ga('send', 'event', {
      eventCategory: eventCategory,
      eventLabel: eventLabel,
      eventAction: eventAction,
      eventValue: eventValue
    });
  }
}
