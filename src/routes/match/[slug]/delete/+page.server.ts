import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "../$types";
import { DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "$env/dynamic/private";


export const load: PageServerLoad = async ({ platform, params, locals }) => {
    if (!locals.user || !locals.user.is_admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    if (!params.slug) {
      throw new Error("Match slug is required");
    }

    if (!await checkMatchExists(platform!, params.slug)) {
      throw new Error("Match not found");
    }

    const url = await deleteMatch(platform!, params.slug);
    redirect(303, '/');
};

async function checkMatchExists(platform: Readonly<App.Platform>, matchHash: string): Promise<boolean> {
  const result = await platform.env.DB.prepare("SELECT COUNT(*) as count FROM matches WHERE file_hash = ?").bind(matchHash).first<{ count: number }>();
  return result != null && result.count > 0;
}

async function deleteMatch(platform: Readonly<App.Platform>, matchHash: string): Promise<void> {
  await platform.env.DB.prepare("DELETE FROM matches WHERE file_hash = ?").bind(matchHash).run();

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

  const deleteParams = {
    Bucket: "inhouse-replay-files",
    Key: `${matchHash}`,
  };

  await s3.send(new DeleteObjectCommand(deleteParams));
}