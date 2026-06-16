import { CountsContainer } from './countsContainer';
export class CorpusSpecifics {
    constructor(
        public lastUpdated: string,
        public biographies: CountsContainer,
        public stories: CountsContainer
    ) { }
}
