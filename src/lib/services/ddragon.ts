interface DdragonVersionResponse extends Array<string> {}

interface DdragonChampion {
    id: string;
    image: {
        full: string;
    };
}

interface DdragonChampionsResponse {
    data: Record<string, DdragonChampion>;
}

interface DdragonSummonerSpell {
    key: string;
    image: {
        full: string;
    };
}

interface DdragonSummonerSpellsResponse {
    data: Record<string, DdragonSummonerSpell>;
}

let championImages: Record<string, string> = {};
let summonerSpellImages: Record<string, string> = {};

export async function initializeDdragon() {
    const versionResponse = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    const versions = await versionResponse.json() as DdragonVersionResponse;
    const latestVersion = versions[0];

    // Fetch champion data
    const championsResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`);
    const championsData = await championsResponse.json() as DdragonChampionsResponse;
    championImages = Object.fromEntries(
        Object.entries(championsData.data).map(([_, value]) => [
            value.id.toLowerCase(),
            `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/champion/${value.image.full}`
        ])
    );

    // Fetch summoner spell data
    const spellsResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/summoner.json`);
    const spellsData = await spellsResponse.json() as DdragonSummonerSpellsResponse;
    summonerSpellImages = Object.fromEntries(
        Object.entries(spellsData.data).map(([_, value]) => [
            value.key,
            `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/spell/${value.image.full}`
        ])
    );
}

export function getChampionImage(championId: string): string {
    return championImages[championId.toLowerCase()] || '';
}

export function getSummonerSpellImage(spellId: string): string {
    return summonerSpellImages[spellId] || '';
}