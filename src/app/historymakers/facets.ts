import { NumberFacet } from './number-facet';
import { StringFacet } from './string-facet';

export class Facets {
        constructor(
        public lastInitial: StringFacet[],
        public gender: StringFacet[],
        public birthState: StringFacet[],
        public birthYear: NumberFacet[], // !!!TBD!!! NOTE: API should name this birthDecade, not birthYear!!! Update when API updates!
        public makerCategories: StringFacet[],
        public occupationTypes: StringFacet[]
    ) { }
}
