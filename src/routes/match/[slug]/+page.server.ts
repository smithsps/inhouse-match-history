import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "../$types";
import type { Match } from "../../proxy+page.server";
import type { ROFL } from "$lib/services/parseRofl";
import { DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "$env/dynamic/private";


export const load: PageServerLoad = async ({ platform, params, locals }) => {
    if (!params.slug) {
      redirect(303, '/');
    }

    const match = await retrieveMatch(platform!, params.slug);

    if (!match) {
        redirect(303, '/');
    }

    return {
        match,
        user: locals.user
    };
};

async function retrieveMatch(platform: Readonly<App.Platform>, matchHash: string): Promise<Match | null> {
  const result = await platform.env.DB.prepare("SELECT * FROM matches WHERE file_hash = ?").bind(matchHash).first<Match>();

  if (!result) {
    return null;
  }

  const match = {
    ...result,
    data: JSON.parse(result.data as any) as ROFL,
  }

  return match;
}
