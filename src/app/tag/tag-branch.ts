import { TagBranchChild } from './tag-branch-child';

export class TagBranch {
    constructor(
        public branchName: string,
        public branchValues: TagBranchChild[]
    ) { }
}
