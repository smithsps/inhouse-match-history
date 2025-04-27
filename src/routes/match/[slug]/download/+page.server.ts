import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "../$types";
import { GetObjectCommand, S3Client, type GetObjectCommandInput } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "$env/dynamic/private";
import type { Match } from "$lib/models/match";


export const load: PageServerLoad = async ({ platform, params, locals }) => {
    if (!params.slug) {
      throw new Error("Match slug is required");
    }

    const match = await getMatch(platform!, params.slug);
    if (!match) {
      redirect(404, '/');
    }

    const url = await generateReplayLink(platform!, match);
    redirect(303, url);
};

async function getMatch(platform: Readonly<App.Platform>, slug: string): Promise<Match | null> {
  return await platform.env.DB.prepare("SELECT * FROM matches WHERE file_hash = ?").bind(slug).first<Match>();
}

async function generateReplayLink(platform: Readonly<App.Platform>, match: Match): Promise<string> {
  const bucketName = env.R2_BUCKET_NAME;
  const region = "us-east-1";
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;

  const s3 = new S3Client({
    region,
    endpoint: `https://${env.R2_BUCKET_DOMAIN}`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED"
  });

  const params: GetObjectCommandInput = {
    Bucket: undefined,
    Key: match.file_hash,
    ResponseContentDisposition: `attachment; filename="${match.file_name}"`,
  };

  const command = new GetObjectCommand(params);
  return await getSignedUrl(s3, command, { expiresIn: 3600  });
}
