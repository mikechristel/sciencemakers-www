import { FacetDetail } from './facet-detail';

// NOTE: enum numbers may be used in historymakers.component.html so if
// order changes here update that renderer html as well!!!
export enum BioFilterFamilyType {
    None = 0,
    LastNameInitial = 1,
    Category = 2,
    Gender = 3,
    BirthDecade = 4,
    BirthState = 5,
    JobType = 6
}

export const BioFilterFamilyTypeCount = 7; // maximum number of types (including none)

export class FacetWithFamily {
  public setID: BioFilterFamilyType = BioFilterFamilyType.None; // should never be BioFilterFamilyType.None for valid content
  public ID: string = "";
  public value: string = "";
}
