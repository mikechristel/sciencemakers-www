import { Facets } from './facets';
import { BriefBio } from './brief-bio';

export class TableOfContents {
    constructor(
        public facets: Facets,
        public biographies: BriefBio[],
        public count: number
    ) { }
}