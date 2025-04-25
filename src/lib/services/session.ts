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
            userId,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days expiration
        };

        await this.db.prepare(
            "INSERT INTO session (id, user_id, expires_at) VALUES (?, ?, ?)"
        )
        .bind(
            session.id,
            session.userId,
            Math.floor(session.expiresAt.getTime() / 1000)
        ).run();
        return session;
    }

    async validateSessionToken(token: string): Promise<SessionValidationResult> {
        const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
        const result = await this.db.prepare(
            "SELECT session.id, session.user_id, session.expires_at, user.id FROM session INNER JOIN user ON user.id = session.user_id WHERE session.id = ?"
        )
        .bind(sessionId)
        .first<Session>();

        if (!result) {
            return { session: null, user: null };
        }

        const session: Session = {
            id: result.id,
            userId: result.userId,
            expiresAt: new Date(result.expiresAt as unknown as number * 1000)
        };

        if (Date.now() >= session.expiresAt.getTime()) {
            await this.db.prepare("DELETE FROM session WHERE id = ?")
                .bind(session.id)
                .run();
            return { session: null, user: null };
        }

        if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
            session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
            await this.db.prepare(
                "UPDATE session SET expires_at = ? WHERE id = ?"
            )
            .bind(
                Math.floor(session.expiresAt.getTime() / 1000),
                session.id
            )
            .run();
        }

        const userResults = await this.db.prepare(
            "SELECT id, discord_id, username, email, discord_avatar FROM user WHERE id = ?"
        )
        .bind(result.userId)
        .first<User>();

        if (!userResults) {
            return { session: null, user: null };
        }

        const user: User = {
            id: userResults.id,
            discordId: userResults.discordId,
            username: userResults.username,
            email: userResults.email,
            discordAvatar: userResults.discordAvatar
        };

        return { session, user };
    }

    async invalidateSession(sessionId: string): Promise<void> {
        await this.db.prepare("DELETE FROM session WHERE id = ?")
            .bind(sessionId)
            .run();
    }

    async invalidateAllSessions(userId: number): Promise<void> {
        await this.db.prepare("DELETE FROM session WHERE user_id = ?")
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
