import { SelectableTagDetail } from './selectable-tag-detail';

export class SelectableTagBranch {
    constructor(
        public branchName: string,
        public branchOpened: boolean,
        public branchValues: SelectableTagDetail[]
    ) { }
}
