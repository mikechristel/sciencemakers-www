// NOTE: enums in TypeScript are number based. Do not change this ordering as that will break any bookmarks
// saved with the expectation that 1 == biography collection, 2 == text search, etc. (0 == none).
// NOTE: "UnsupportedStorySetType" is a placeholder for a type of story not yet supported in this corpus.
export enum StorySetType {
        None,
        BiographyCollection,
        TextSearch,
        TagSearch, // Note: Tag search is not supported in this interface to data for which too few stories are tagged.  It is left here as a placeholder for potential future work.
        StarredSet,
        UnsupportedStorySetType,
        GivenIDSet,
        StarredSetWithGivenIDs
}
