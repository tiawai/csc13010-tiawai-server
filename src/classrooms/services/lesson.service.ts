import {
    Injectable,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { LessonRepository } from '../repositories/lesson.repository';
import { CreateLessonDto } from '../dtos/create-lesson.dto';
import { Lesson } from '../entities/lesson.model';
import { UploadService } from '../../uploader/upload.service';
import { Sequelize } from 'sequelize-typescript';
import type { Multer } from 'multer';
import { ClassroomService } from './classroom.service';

@Injectable()
export class LessonService {
    constructor(
        private readonly lessonRepository: LessonRepository,
        private readonly uploadService: UploadService,
        private readonly sequelize: Sequelize,
        private readonly classroomService: ClassroomService,
    ) {}

    async create(
        teacherId: string,
        createLessonDto: CreateLessonDto,
        files: Multer.File[],
    ): Promise<Lesson> {
        // Check ownership first
        await this.verifyClassroomOwnership(teacherId, createLessonDto.classId);

        const transaction = await this.sequelize.transaction();

        try {
            // Upload files if any
            let attachmentUrls: string[] = [];
            if (files && files.length > 0) {
                // Use the new uploadLessonFiles method
                attachmentUrls =
                    await this.uploadService.uploadLessonFiles(files);
            }

            // Create lesson with attachments
            const lesson = await this.lessonRepository.create(
                createLessonDto,
                attachmentUrls,
                transaction,
            );

            await transaction.commit();
            return lesson;
        } catch (error) {
            await transaction.rollback();
            throw new BadRequestException(
                error.message || 'Failed to create lesson',
            );
        }
    }

    async findAll(classId?: string): Promise<Lesson[]> {
        return this.lessonRepository.findAll(classId);
    }

    async findOne(id: string): Promise<Lesson> {
        return this.lessonRepository.findOne(id);
    }

    async update(
        teacherId: string,
        id: string,
        updateData: Partial<CreateLessonDto>,
        files?: Multer.File[],
    ): Promise<Lesson> {
        // Get the lesson first for ownership verification and file upload
        const existingLesson = await this.lessonRepository.findOne(id);

        // Verify ownership of current classroom
        await this.verifyLessonOwnership(teacherId, existingLesson);

        // If trying to change classId, verify ownership of target classroom
        if (
            updateData.classId &&
            updateData.classId !== existingLesson.classId
        ) {
            await this.verifyClassroomOwnership(teacherId, updateData.classId);
        }

        const transaction = await this.sequelize.transaction();

        try {
            // Upload files if any
            let attachmentUrls: string[] | undefined;
            if (files && files.length > 0) {
                // Use the new uploadLessonFiles method with the lesson ID
                attachmentUrls = await this.uploadService.uploadLessonFiles(
                    files,
                    existingLesson.id,
                );
            }

            // Update lesson with attachments if provided
            const lesson = await this.lessonRepository.update(
                id,
                updateData,
                attachmentUrls,
                transaction,
            );

            await transaction.commit();
            return lesson;
        } catch (error) {
            await transaction.rollback();
            throw new BadRequestException(
                error.message || 'Failed to update lesson',
            );
        }
    }

    async remove(teacherId: string, id: string): Promise<void> {
        // Get the lesson first for ownership verification
        const lesson = await this.lessonRepository.findOne(id);

        // Verify ownership
        await this.verifyLessonOwnership(teacherId, lesson);

        const transaction = await this.sequelize.transaction();

        try {
            await this.lessonRepository.remove(id, transaction);
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw new BadRequestException(
                error.message || 'Failed to delete lesson',
            );
        }
    }

    /**
     * Verifies if a teacher owns a classroom
     */
    private async verifyClassroomOwnership(
        teacherId: string,
        classId: string,
    ): Promise<void> {
        const classrooms = await this.classroomService.findByTeacher(teacherId);
        const isOwner = classrooms.some(
            (classroom) => classroom.id === classId,
        );

        if (!isOwner) {
            throw new ForbiddenException(
                'You do not have permission to access this classroom',
            );
        }
    }

    /**
     * Verifies if a teacher owns the classroom a lesson belongs to
     */
    private async verifyLessonOwnership(
        teacherId: string,
        lesson: Lesson,
    ): Promise<void> {
        await this.verifyClassroomOwnership(teacherId, lesson.classId);
    }
}
