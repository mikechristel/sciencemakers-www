import { FacetDetail } from '../historymakers/facet-detail';

// NOTE: numbers may be used in storyset.component.html so if
// order changes here update that renderer html as well!!!
export enum StoryFilterFamilyType {
    None = 0,
    Category = 1,
    Gender = 2,
    StateInStory = 3,
    Organization = 4,
    DecadeInStory = 5,
    YearInStory = 6,
    JobType = 7,
    DecadeOfBirth = 8
}

export const StoryFilterFamilyTypeCount = 9; // maximum number of types (including none)

export class StoryFacetWithFamily {
  public setID: StoryFilterFamilyType = StoryFilterFamilyType.None; // should never be StoryFilterFamilyType.None for valid content
  public ID: string = "";
  public value: string = "";
}
