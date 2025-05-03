
export interface DdragongRepository {
    championImages: Record<string, string>;
    summonerSpellImages: Record<string, string>;
    getChampionImage: (championId: string) => string;
    getSummonerSpellImage: (spellId: string) => string;
};

export async function initializeDdragon(fetch: (url: string) => Promise<Response>) : Promise<DdragongRepository> {
    const versionResponse = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    const versions = await versionResponse.json();
    const latestVersion = versions[0];

    // Fetch champion data
    const championsResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`);
    const championsData = await championsResponse.json();
    const championImages = Object.fromEntries(
        Object.entries(championsData.data).map(([_, value]) => [
            value.id.toLowerCase(),
            `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/champion/${value.image.full}`
        ])
    );

    // Fetch summoner spell data
    const spellsResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/summoner.json`);
    const spellsData = await spellsResponse.json();
    const summonerSpellImages = Object.fromEntries(
        Object.entries(spellsData.data).map(([_, value]) => [
            value.key,
            `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/spell/${value.image.full}`
        ])
    );

    return {
        championImages,
        summonerSpellImages,
        getChampionImage: (championId: string | undefined) => {
            if (!championId || typeof championId !== 'string') {
                return '';
            }

            return championImages[championId.toLowerCase()] || '';
        },
        getSummonerSpellImage: (spellId: string | undefined) => {
            if (!spellId) {
                return '';
            }

            return summonerSpellImages[spellId] || '';
        }
    };
}