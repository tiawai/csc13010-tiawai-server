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
import { User } from 'src/users/entities/user.model';
import { ClassroomStudentRepository } from '../repositories/classroom-student.repository';
import { Role } from 'src/auth/enums/roles.enum';

@Injectable()
export class LessonService {
    constructor(
        private readonly lessonRepository: LessonRepository,
        private readonly uploadService: UploadService,
        private readonly sequelize: Sequelize,
        private readonly classroomService: ClassroomService,
        private readonly classroomStudentRepository: ClassroomStudentRepository,
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

    async findAll(classId: string, user: User): Promise<Lesson[]> {
        if (user.role === Role.STUDENT) {
            const isEnrolled = await this.classroomStudentRepository.isEnrolled(
                classId,
                user.id,
            );

            if (!isEnrolled) {
                throw new ForbiddenException(
                    'You do not have permission to access this classroom',
                );
            }
        }
        return this.lessonRepository.findAll(classId);
    }

    async findOne(id: string, user: User): Promise<Lesson> {
        if (user.role === Role.STUDENT) {
            const isEnrolled = await this.classroomStudentRepository.isEnrolled(
                id,
                user.id,
            );

            if (!isEnrolled) {
                throw new ForbiddenException(
                    'You do not have permission to access this classroom',
                );
            }
        }
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

    async remove(teacherId: string, id: string): Promise<boolean> {
        // Get the lesson first for ownership verification
        const lesson = await this.lessonRepository.findOne(id);

        // Verify ownership
        await this.verifyLessonOwnership(teacherId, lesson);

        const transaction = await this.sequelize.transaction();

        try {
            await this.lessonRepository.remove(id, transaction);
            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw new BadRequestException(
                error.message || 'Failed to delete lesson',
            );
        }
    }

    private async verifyClassroomOwnership(
        teacherId: string,
        classId: string,
    ): Promise<void> {
        const classrooms = await this.classroomService.findByTeacher(teacherId);
        let isOwner: boolean = false;
        classrooms.forEach((classroom) => {
            if (classroom.dataValues.id === classId) {
                isOwner = true;
            }
        });
        if (!isOwner) {
            throw new ForbiddenException(
                'You do not have permission to access this classroom',
            );
        }
    }

    private async verifyLessonOwnership(
        teacherId: string,
        lesson: Lesson,
    ): Promise<void> {
        await this.verifyClassroomOwnership(
            teacherId,
            lesson.dataValues.classId,
        );
    }
}
