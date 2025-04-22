import { fail, type Actions } from "@sveltejs/kit";
import { S3Client, PutObjectCommand, ListBucketsCommand } from "@aws-sdk/client-s3";
import { env } from "$env/dynamic/private";

export const actions = {
    default: async ({ request }) => {
        const data = await request.formData();
        const file = data.get("file");
        const date = new Date(data.get("match-date") as string);


        try {
            if (!file || !(file instanceof File)) {
                throw new Error("Invalid file");
            }

            const fileBuffer = Buffer.from(await file.arrayBuffer());
            const hash = await crypto.subtle.digest("SHA-1", fileBuffer);
            const hashArray = Array.from(new Uint8Array(hash));
            const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");

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

            console.log(await s3.send(new ListBucketsCommand({})));

            await s3.send(new PutObjectCommand(uploadParams));

            return { success: true, hash: hashHex };
        } catch (error) {
            console.error("Error processing file:", error);
            return fail(500, { error: "Failed to process file" });
        }
    }
} satisfies Actions;