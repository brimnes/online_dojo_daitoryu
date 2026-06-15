import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export const s3 = new S3Client({
  endpoint:        process.env.S3_ENDPOINT,
  region:          process.env.S3_REGION || 'ru-1',
  credentials: {
    accessKeyId:     process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

export const S3_BUCKET       = process.env.S3_BUCKET;
export const S3_PUBLIC_URL   = process.env.NEXT_PUBLIC_S3_PUBLIC_URL;

export async function uploadToS3(buffer, key, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket:      S3_BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: contentType,
    ACL:         'public-read',
  }));
  return `${S3_PUBLIC_URL}/${key}`;
}

export async function deleteFromS3(key) {
  await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
}
