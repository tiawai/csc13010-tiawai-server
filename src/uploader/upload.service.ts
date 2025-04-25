import {
    Injectable,
    InternalServerErrorException,
    BadRequestException,
} from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import type { Multer } from 'multer';

@Injectable()
export class UploadService {
    private s3: S3;

    constructor(private readonly configService: ConfigService) {
        this.s3 = new S3({
            endpoint: this.configService.get<string>('DO_SPACES_ENDPOINT'),
            accessKeyId: this.configService.get<string>('DO_SPACES_ACCESS_KEY'),
            secretAccessKey: this.configService.get<string>(
                'DO_SPACES_SECRET_KEY',
            ),
        });
    }

    async uploadFile(file: Multer.File, folderName: string): Promise<string> {
        try {
            const bucket = this.configService.get<string>('DO_SPACES_BUCKET');
            if (!bucket)
                throw new InternalServerErrorException(
                    'Bucket name is not configured',
                );

            const fileKey = `${folderName}/${uuidv4()}-${file.originalname}`;

            const params: S3.PutObjectRequest = {
                Bucket: bucket,
                Key: fileKey,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: 'public-read',
            };

            await this.s3.upload(params).promise();

            return `https://${bucket}.${this.configService.get<string>('DO_SPACES_ENDPOINT').replace('https://', '')}/${fileKey}`;
        } catch (error: any) {
            throw new InternalServerErrorException(error.message || error.code);
        }
    }

    async uploadAudio(file: Multer.File): Promise<string> {
        try {
            const bucket = this.configService.get<string>('DO_SPACES_BUCKET');
            if (!bucket) {
                throw new InternalServerErrorException(
                    'Bucket name is not configured',
                );
            }

            // Validate file type
            const allowedMimeTypes = [
                'audio/mpeg',
                'audio/wav',
                'audio/mp3',
                'audio/ogg',
            ];
            if (!allowedMimeTypes.includes(file.mimetype)) {
                throw new BadRequestException(
                    'Invalid file type. Only audio files (MP3, WAV, OGG) are allowed.',
                );
            }

            // Create a specific folder for audio files
            const fileKey = `audio/${uuidv4()}-${file.originalname}`;

            const params: S3.PutObjectRequest = {
                Bucket: bucket,
                Key: fileKey,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: 'public-read',
                // Add audio-specific metadata
                Metadata: {
                    'Content-Type': file.mimetype,
                    'Original-Filename': file.originalname,
                },
            };

            await this.s3.upload(params).promise();

            return `https://${bucket}.${this.configService.get<string>('DO_SPACES_ENDPOINT').replace('https://', '')}/${fileKey}`;
        } catch (error: any) {
            throw new InternalServerErrorException(error.message || error.code);
        }
    }

    async uploadTestImages(
        files: Multer.File[],
        testId: string,
        folderName: string,
    ): Promise<string[]> {
        try {
            const bucket = this.configService.get<string>('DO_SPACES_BUCKET');
            if (!bucket) {
                throw new InternalServerErrorException(
                    'Bucket name is not configured',
                );
            }

            // Validate file types
            const allowedMimeTypes = [
                'image/jpeg',
                'image/png',
                'image/jpg',
                'image/webp',
            ];
            const invalidFiles = files.filter(
                (file) => !allowedMimeTypes.includes(file.mimetype),
            );

            if (invalidFiles.length > 0) {
                throw new BadRequestException(
                    'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
                );
            }

            // Upload all images
            const uploadPromises = files.map(async (file, index) => {
                // Create a specific path for test images
                const fileKey = `tests/${folderName}/${testId}/${file.originalname}`;

                const params: S3.PutObjectRequest = {
                    Bucket: bucket,
                    Key: fileKey,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                    ACL: 'public-read',
                    Metadata: {
                        'Content-Type': file.mimetype,
                        'Original-Filename': file.originalname,
                        'Test-ID': testId,
                        'Image-Index': index.toString(),
                    },
                };

                await this.s3.upload(params).promise();
                return `https://${bucket}.${this.configService.get<string>('DO_SPACES_ENDPOINT').replace('https://', '')}/${fileKey}`;
            });

            // Wait for all uploads to complete
            const uploadedUrls = await Promise.all(uploadPromises);
            return uploadedUrls;
        } catch (error: any) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException(error.message || error.code);
        }
    }

    async uploadLessonFiles(
        files: Multer.File[],
        lessonId?: string,
    ): Promise<string[]> {
        try {
            const bucket = this.configService.get<string>('DO_SPACES_BUCKET');
            if (!bucket) {
                throw new InternalServerErrorException(
                    'Bucket name is not configured',
                );
            }

            // Validate file types
            const allowedMimeTypes = [
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            ];
            const invalidFiles = files.filter(
                (file) => !allowedMimeTypes.includes(file.mimetype),
            );

            if (invalidFiles.length > 0) {
                throw new BadRequestException(
                    'Invalid file type. Only PDF and PPTX files are allowed.',
                );
            }

            // Upload all files
            const uploadPromises = files.map(async (file) => {
                // Create a specific path for lesson files
                const filePrefix = lessonId ? `${lessonId}-` : '';
                const fileKey = `lessons/${filePrefix}${uuidv4()}-${file.originalname}`;

                const params: S3.PutObjectRequest = {
                    Bucket: bucket,
                    Key: fileKey,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                    ACL: 'public-read',
                    Metadata: {
                        'Content-Type': file.mimetype,
                        'Original-Filename': file.originalname,
                        'Lesson-ID': lessonId || 'new',
                        'File-Type': file.mimetype.includes('pdf')
                            ? 'pdf'
                            : 'pptx',
                    },
                };

                await this.s3.upload(params).promise();
                return `https://${bucket}.${this.configService.get<string>('DO_SPACES_ENDPOINT').replace('https://', '')}/${fileKey}`;
            });

            // Wait for all uploads to complete
            const uploadedUrls = await Promise.all(uploadPromises);
            return uploadedUrls;
        } catch (error: any) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException(error.message || error.code);
        }
    }
}
