import { TagFacets } from './tag-facets';

export class TagSearchResult {
    constructor(
        public facets: TagFacets,
        public count: number
    ) { }
}