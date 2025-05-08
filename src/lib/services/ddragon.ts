export interface DdragongRepository {
    championImages: Record<string, string>;
    summonerSpellImages: Record<string, string>;
    runeImages: Record<string, string>;
    itemImages: Record<string, string>;
    getChampionImage: (championId: string) => string;
    getSummonerSpellImage: (spellId: string) => string;
    getRuneImage: (runeId: string) => string;
    getItemImage: (itemId: string) => string;
};

export async function initializeDdragon(fetch: (url: string) => Promise<Response>) : Promise<DdragongRepository> {
    const versionResponse = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    const versions = await versionResponse.json() as string[];
    const latestVersion = versions[0];

    // Fetch champion data
    const championsResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`);
    const championsData = await championsResponse.json() as { data: Record<string, { id: string, image: { full: string } }> };
    const championImages = Object.fromEntries(
        Object.entries(championsData.data).map(([_, value]) => [
            value.id.toLowerCase(),
            `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/champion/${value.image.full}`
        ])
    );

    // Fetch summoner spell data
    const spellsResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/summoner.json`);
    const spellsData = await spellsResponse.json() as { data: Record<string, { key: string, image: { full: string } }> };
    const summonerSpellImages = Object.fromEntries(
        Object.entries(spellsData.data).map(([_, value]) => [
            value.key,
            `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/spell/${value.image.full}`
        ])
    );

    // Fetch rune data
    const runesResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/runesReforged.json`);
    const runesData = await runesResponse.json() as Array<{
        id: number;
        key: string;
        icon: string;
        slots: Array<{
            runes: Array<{
                id: number;
                key: string;
                icon: string;
            }>;
        }>;
    }>;
    
    const runeImages: Record<string, string> = {};
    runesData.forEach(runePath => {
        runeImages[runePath.id.toString()] = `https://ddragon.leagueoflegends.com/cdn/img/${runePath.icon}`;
        runePath.slots.forEach(slot => {
            slot.runes.forEach(rune => {
                runeImages[rune.id.toString()] = `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`;
            });
        });
    });

    // Fetch item data
    const itemsResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/item.json`);
    const itemsData = await itemsResponse.json() as { data: Record<string, { image: { full: string } }> };
    const itemImages = Object.fromEntries(
        Object.entries(itemsData.data).map(([id, value]) => [
            id,
            `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/item/${value.image.full}`
        ])
    );

    return {
        championImages,
        summonerSpellImages,
        runeImages,
        itemImages,
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
        },
        getRuneImage: (runeId: string | undefined) => {
            if (!runeId) {
                return '';
            }

            return runeImages[runeId] || '';
        },
        getItemImage: (itemId: string | undefined) => {
            if (!itemId) {
                return '';
            }

            return itemImages[itemId] || '';
        }
    };
}