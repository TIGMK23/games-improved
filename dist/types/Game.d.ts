export interface GameConfig {
    name: string;
    tag: string;
    license: string;
    git: string;
    branch?: string;
    index?: string;
    mobile: boolean;
    desktop: boolean;
    build?: string[];
}
export interface GameCollection {
    [gameId: string]: GameConfig;
}
export interface GameMetadata {
    id: string;
    config: GameConfig;
    lastBuilt?: Date;
    buildStatus: BuildStatus;
    buildTime?: number;
    lastCommit?: string;
    buildErrors?: string[];
}
export declare enum BuildStatus {
    NOT_BUILT = "not_built",
    BUILDING = "building",
    SUCCESS = "success",
    FAILED = "failed",
    SKIPPED = "skipped"
}
export interface GameBuildResult {
    game: GameMetadata;
    success: boolean;
    duration: number;
    errors: string[];
    warnings: string[];
}
//# sourceMappingURL=Game.d.ts.map