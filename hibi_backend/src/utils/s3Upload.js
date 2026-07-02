// const { S3Client, PutObjectCommand, DeleteObjectCommand, ListBucketsCommand } = require("@aws-sdk/client-s3");
// require("dotenv").config();

// console.log("MINIO_ENDPOINT:", process.env.MINIO_ENDPOINT);
// console.log("MINIO_ACCESS_KEY:", process.env.MINIO_ACCESS_KEY);
// console.log("MINIO_SECRET_KEY:", process.env.MINIO_SECRET_KEY);
// console.log("MINIO_BUCKET_NAME:", process.env.MINIO_BUCKET_NAME);

// // MinIO migration: use endpoint, path-style, and MinIO credentials
// const s3 = new S3Client({
//     region: process.env.MINIO_REGION || "us-east-1",
//     endpoint: process.env.MINIO_ENDPOINT, // e.g., http://localhost:9000
//     forcePathStyle: true, // Required for MinIO
//     credentials: {
//         accessKeyId: process.env.MINIO_ACCESS_KEY,
//         secretAccessKey: process.env.MINIO_SECRET_KEY,
//     },
// });

// const uploadToS3 = async (fileBuffer, originalName, mimetype, folder = "uploads") => {
//     try {
//         console.log("[uploadToS3] Called with:", { originalName, mimetype, folder });
//         const fileName = `${folder}/${Date.now()}_${originalName}`;
//         console.log("[uploadToS3] ENV:", {
//             endpoint: process.env.MINIO_ENDPOINT,
//             accessKeyId: process.env.MINIO_ACCESS_KEY,
//             secretKeyPresent: !!process.env.MINIO_SECRET_KEY,
//             bucket: process.env.MINIO_BUCKET_NAME,
//         });

//         const uploadParams = {
//             Bucket: process.env.MINIO_BUCKET_NAME,
//             Key: fileName,
//             Body: fileBuffer,
//             ContentType: mimetype,
//         };

//         console.log("[uploadToS3] Upload params:", uploadParams);

//         const result = await s3.send(new PutObjectCommand(uploadParams));
//         console.log("[uploadToS3] Upload result:", result);

//         // MinIO: construct file URL using endpoint
//         const endpoint = process.env.MINIO_ENDPOINT.replace(/\/$/, "");
//         const fileUrl = `${endpoint}/${process.env.MINIO_BUCKET_NAME}/${fileName}`;

//         return {
//             fileUrl,
//             s3Key: fileName,
//         };
//     } catch (error) {
//         console.error("[uploadToS3] Error:", error);
//         throw new Error(`MinIO upload failed: ${error.message}`);
//     }
// };

// const deleteFromS3 = async (s3Key) => {
//     try {
//         await s3.send(
//             new DeleteObjectCommand({
//                 Bucket: process.env.MINIO_BUCKET_NAME,
//                 Key: s3Key,
//             })
//         );
//         return true;
//     } catch (error) {
//         throw new Error(`MinIO delete failed: ${error.message}`);
//     }
// };

// async function testMinioConnection() {
//     try {
//         console.log("Testing MinIO connection...");
//         const result = await s3.send(new ListBucketsCommand({}));
//         console.log("MinIO connection successful! Buckets:", result.Buckets);
//     } catch (error) {
//         console.error("MinIO connection failed:", error);
//     }
// }

// testMinioConnection();

// module.exports = {
//     uploadToS3,
//     deleteFromS3,
// };






const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { ListBucketsCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

function testS3Connection() {
    setTimeout(async () => {
        try {
            // List buckets to test connection
            const result = await s3.send(new ListBucketsCommand({}));
            const bucketNames = result.Buckets.map(b => b.Name);
            if (!bucketNames.includes(process.env.S3_BUCKET_NAME)) {
                throw new Error(`Bucket "${process.env.S3_BUCKET_NAME}" not found in S3 account`);
            }
            else {
                console.log(`S3 connection successful! Bucket "${process.env.S3_BUCKET_NAME}" exists.`);
            }
        } catch (error) {
            console.error("S3 connection failed:", error);
        }
    }, 10000);
}

testS3Connection();

const uploadToS3 = async (fileBuffer, originalName, mimetype, folder = "uploads") => {
    try {
        const fileName = `${process.env.NODE_ENV === "staging" || process.env.NODE_ENV === "stagin" ? "staging/" : "production/"}${folder}/${Date.now()}_${originalName}`;

        const uploadParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: fileName,
            Body: fileBuffer,
            ContentType: mimetype,
        };

        await s3.send(new PutObjectCommand(uploadParams));

        // In v3, the response doesn’t give Location directly
        const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

        return {
            fileUrl,
            s3Key: fileName,
        };
    } catch (error) {
        throw new Error(`S3 upload failed: ${error.message}`);
    }
};

const deleteFromS3 = async (s3Key) => {
    try {
        await s3.send(
            new DeleteObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: s3Key,
            })
        );
        return true;
    } catch (error) {
        throw new Error(`S3 delete failed: ${error.message}`);
    }
};

module.exports = {
    uploadToS3,
    deleteFromS3,
};