export interface User {
    id: number;
    discord_id: string;
    username: string;
    email: string;
    discord_avatar?: string;
    is_admin: boolean;
}