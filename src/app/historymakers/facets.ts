import { NumberFacet } from './number-facet';
import { StringFacet } from './string-facet';

export class Facets {
    public lastInitial: StringFacet[];
    public gender: StringFacet[];
    public birthYear: NumberFacet[];
    public makerCategories: NumberFacet[];
    public occupationTypes: NumberFacet[];
}
