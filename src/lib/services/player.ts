enum PUUIDS {
    DefNotSion = "6104470e-797d-5667-80ff-4c73cd819370",
    Sivrag9000 = "7eded1bf-389c-57db-9f75-4e6ddebbce84",
    voug = "3034483a-cce1-554e-b798-b9c83d0f7ad2",
    C9Vocaloid = "ab888e9d-5ec6-5821-b1f4-8bab9b18363d"
}

const PLAYER_NAMES: Record<string, string> = {
    [PUUIDS.DefNotSion]: "Def Not Sion",
    [PUUIDS.Sivrag9000]: "Sivrag9000",
    [PUUIDS.voug]: "voug",
    [PUUIDS.C9Vocaloid]: "C9 Vocaloid"
}

const PLAYER_MAP: Record<string, string> = {
    [PUUIDS.Sivrag9000]: PUUIDS.DefNotSion,
    [PUUIDS.C9Vocaloid]: PUUIDS.voug,
}

export class PlayerService {
    static getPlayerPuuid(puuid: string) {
        if (PLAYER_MAP[puuid]) {
            return PLAYER_MAP[puuid];
        }

        return puuid;
    }

    static getPlayerNameOrDefault(puuid: string, playerName: string) {
        if (PLAYER_MAP[puuid] && PLAYER_NAMES[PLAYER_MAP[puuid]]) {
            return PLAYER_NAMES[PLAYER_MAP[puuid]];
        }

        return playerName;
    }
}
