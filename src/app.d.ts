// See https://svelte.dev/docs/kit/types#app.d.ts

import type { Session } from "$lib/models/session";
import type { User } from "$lib/models/user";

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: User | null;
			session: Session | null;
		}

		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				DB: D1Database;
			}
		}
	}
}

export {};
