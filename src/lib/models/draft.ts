export type DraftTeam = 'blue' | 'red' | 'none';
export type DraftActionType = 'pick' | 'ban' | 'none';

export interface DraftState {
    blueName: string;
    redName: string;
    disabledTurns: number[];
    disabledChamps: string[];
    timePerPick: string;
    timePerBan: string;
    bluePicks: string[];
    redPicks: string[];
    blueBans: string[];
    redBans: string[];
    nextTeam: DraftTeam;
    nextType: DraftActionType;
    nextTimeout: number;
    blueReady: boolean;
    redReady: boolean;
    state: 'finished' | 'in_progress' | 'waiting';
    turn: number;
}

export interface DraftWebSocketMessage {
    type: 'statechange';
    newState: DraftState;
} 