import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import { _ } from "$env/static/private";
import type { Session } from "$lib/models/session";
import type { User } from "$lib/models/user";
import { dev } from "$app/environment";
import type { RequestEvent } from "@sveltejs/kit";

export class SessionService {
    private db: D1Database;

    constructor(db: D1Database) {
        this.db = db;
    }

    generateSessionToken(): string {
        const bytes = new Uint8Array(20);
        crypto.getRandomValues(bytes);
        const token = encodeBase32LowerCaseNoPadding(bytes);
        return token;
    }

    async createSession(token: string, userId: number): Promise<Session> {
        const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
        const session: Session = {
            id: sessionId,
            user_id: userId,
            expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days expiration
        };

        await this.db.prepare(
            "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)"
        )
        .bind(
            session.id,
            session.user_id,
            Math.floor(session.expires_at.getTime() / 1000)
        ).run();
        return session;
    }

    async validateSessionToken(token: string): Promise<SessionValidationResult> {
        const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
        const result = await this.db.prepare(
            "SELECT sessions.id, sessions.user_id, sessions.expires_at, users.id as user_id FROM sessions INNER JOIN users ON users.id = sessions.user_id WHERE sessions.id = ?"
        )
        .bind(sessionId)
        .first<Session>();

        if (!result) {
            return { session: null, user: null };
        }

        const session: Session = {
            id: result.id,
            user_id: result.user_id,
            expires_at: new Date(result.expires_at as unknown as number * 1000)
        };

        if (Date.now() >= session.expires_at.getTime()) {
            await this.db.prepare("DELETE FROM sessions WHERE id = ?")
                .bind(session.id)
                .run();
            return { session: null, user: null };
        }

        if (Date.now() >= session.expires_at.getTime() - 1000 * 60 * 60 * 24 * 15) {
            session.expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
            await this.db.prepare(
                "UPDATE session SET expires_at = ? WHERE id = ?"
            )
            .bind(
                Math.floor(session.expires_at.getTime() / 1000),
                session.id
            )
            .run();
        }

        const userResults = await this.db.prepare(
            "SELECT id, discord_id, username, email, discord_avatar, is_admin FROM users WHERE id = ?"
        )
        .bind(result.user_id)
        .first<User>();

        if (!userResults) {
            return { session: null, user: null };
        }

        const user: User = {
            id: userResults.id,
            discord_id: userResults.discord_id,
            username: userResults.username,
            email: userResults.email,
            discord_avatar: userResults.discord_avatar,
            is_admin: userResults.is_admin ? true : false
        };

        return { session, user };
    }

    async invalidateSession(sessionId: string): Promise<void> {
        await this.db.prepare("DELETE FROM sessions WHERE id = ?")
            .bind(sessionId)
            .run();
    }

    async invalidateAllSessions(userId: number): Promise<void> {
        await this.db.prepare("DELETE FROM sessions WHERE user_id = ?")
            .bind(userId)
            .run();
    }

    static setSessionTokenCookie(event: RequestEvent, sessionToken: string, expiresAt: Date): void {
        event.cookies.set("session", sessionToken, { httpOnly: true, sameSite: "lax", path: "/", expires: expiresAt, secure: !dev });
    }
    
    static deleteSessionTokenCookie(event: RequestEvent): void {
        event.cookies.set("session", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0, secure: !dev });
    }
}

export type SessionValidationResult =
    | { session: Session; user: User }
    | { session: null; user: null };
