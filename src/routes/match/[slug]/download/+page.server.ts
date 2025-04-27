import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "../$types";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "$env/dynamic/private";


export const load: PageServerLoad = async ({ platform, params, locals }) => {
    if (!params.slug) {
      throw new Error("Match slug is required");
    }

    if (!await checkMatchExists(platform!, params.slug)) {
      throw new Error("Match not found");
    }

    const url = await generateReplayLink(platform!, params.slug);
    redirect(303, url);
};

async function checkMatchExists(platform: Readonly<App.Platform>, matchHash: string): Promise<boolean> {
  const result = await platform.env.DB.prepare("SELECT COUNT(*) as count FROM matches WHERE file_hash = ?").bind(matchHash).first<{ count: number }>();
  return result != null && result.count > 0;
}

async function generateReplayLink(platform: Readonly<App.Platform>, matchHistory: string): Promise<string> {
  const bucketName = env.R2_BUCKET_NAME;
  const region = "us-east-1";
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;

  const s3 = new S3Client({
    region,
    endpoint: `https://${bucketName}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  const params = {
    Bucket: bucketName,
    Key: matchHistory,
    Expires: 60 * 60, // Link valid for 1 hour
  };

  const command = new GetObjectCommand(params);
  return await getSignedUrl(s3, command, { expiresIn: 3600 });
}
