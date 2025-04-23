import { fail, type Actions  } from "@sveltejs/kit";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "$env/dynamic/private";
import { parseRofl } from "$lib/services/parseRofl";

export const actions = {
    default: async ({ request, platform }) => {
        const data = await request.formData();
        const file = data.get("file");
        const date = new Date(data.get("match-date") as string);

        try {
            if (!file || !(file instanceof File)) {
                throw new Error("Invalid file");
            }

            // Grab match id from filename (NA1-5270847442.rofl => NA1_5270847442)
            const matchId = file.name.replace(/\.rofl$/, '').replace(/-/, '_');

            const fileBuffer = await file.arrayBuffer();
            const hash = await crypto.subtle.digest("SHA-1", fileBuffer);
            const hashArray = Array.from(new Uint8Array(hash));
            const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");

            if (await isMatchStored(platform!, hashHex)) {
                return fail(400, { error: "Match already has been uploaded." });
            }

            const parsedData = await parseRofl(file);

            await storeMatch(
                platform!,
                matchId,
                file.name,
                file.size,
                hashHex,
                date,
                parsedData
            );

            await storeFile(hashHex, fileBuffer);

            return { success: true, hash: hashHex };
        } catch (error) {
            console.error("Error processing file:", error);
            return fail(500, { error: "Failed to process file" });
        }
    }
} satisfies Actions;

async function isMatchStored(platform: Readonly<App.Platform>, hashHex: string): Promise<boolean> {
    const query = `
        SELECT COUNT(*) as count
        FROM matches
        WHERE file_hash = ?;
    `;
    const result = await platform.env.DB.prepare(query).bind(hashHex).first<{ count: number }>();
    return result?.count > 0;
}

async function storeMatch(platform: Readonly<App.Platform>, matchId: string, fileName: string, fileSize: number, fileHash: string, matchDate: Date, data: object): Promise<void> {
    const query = `
        INSERT INTO matches (match_id, file_name, file_size, file_hash, match_date, data)
        VALUES (?, ?, ?, ?, ?, ?);
    `;
    await platform.env.DB.prepare(query).bind(matchId, fileName, fileSize, fileHash, matchDate.toISOString(), JSON.stringify(data)).run();
}

async function storeFile(hashHex: string, fileBuffer: Buffer<ArrayBuffer>) {
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

    const uploadParams = {
        Bucket: "inhouse-replay-files",
        Key: `${hashHex}`,
        Body: fileBuffer
    };

    await s3.send(new PutObjectCommand(uploadParams));
}
