// NOTE: enums in TypeScript are number based. Do not change this ordering as that will break any bookmarks
// saved with the expectation that 1 == biography collection, 2 == text search, etc. (0 == none).
// NOTE: elsewhere, code and html fragments have pieces like /stories/6 where 6 == StorySetType.GivenIDSet, so
// editing this enum would mean revisiting all those html/code/documentation fragments of /stories/ and elsewhere.
export enum StorySetType {
        None,
        BiographyCollection,
        TextSearch,
        TagSearch,
        MyClipsSet,
        Mixtape,
        GivenIDSet
}
