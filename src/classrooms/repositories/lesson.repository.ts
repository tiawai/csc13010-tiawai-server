import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Lesson } from '../entities/lesson.model';
import { CreateLessonDto } from '../dtos/create-lesson.dto';
import { Transaction } from 'sequelize';
import { Classroom } from '../entities/classroom.model';

@Injectable()
export class LessonRepository {
    constructor(
        @InjectModel(Lesson)
        private lessonModel: typeof Lesson,
        @InjectModel(Classroom)
        private classroomModel: typeof Classroom,
    ) {}

    async create(
        createLessonDto: CreateLessonDto,
        attachmentUrls: string[],
        transaction?: Transaction,
    ): Promise<Lesson> {
        const lesson = await this.lessonModel.create(
            {
                ...createLessonDto,
                attachments: attachmentUrls,
            },
            { transaction },
        );

        // Update classroom's totalLessons count
        await this.incrementClassroomLessonCount(
            createLessonDto.classId,
            transaction,
        );

        return lesson;
    }

    async findAll(classId?: string): Promise<Lesson[]> {
        const whereClause = classId ? { classId } : {};
        return this.lessonModel.findAll({ where: whereClause });
    }

    async findOne(id: string): Promise<Lesson> {
        const lesson = await this.lessonModel.findByPk(id);
        if (!lesson) {
            throw new NotFoundException(`Lesson with ID ${id} not found`);
        }
        return lesson;
    }

    async update(
        id: string,
        updateData: Partial<CreateLessonDto>,
        attachmentUrls?: string[],
        transaction?: Transaction,
    ): Promise<Lesson> {
        const lesson = await this.findOne(id);

        const dataToUpdate = { ...updateData };
        if (attachmentUrls) {
            dataToUpdate['attachments'] = attachmentUrls;
        }

        await lesson.update(dataToUpdate, { transaction });
        return lesson;
    }

    async remove(id: string, transaction?: Transaction): Promise<void> {
        const lesson = await this.findOne(id);
        const classId = lesson.dataValues.classId;

        await lesson.destroy({ transaction });

        // Update classroom's totalLessons count
        await this.decrementClassroomLessonCount(classId, transaction);
    }

    private async incrementClassroomLessonCount(
        classId: string,
        transaction?: Transaction,
    ): Promise<void> {
        const classroom = await this.classroomModel.findByPk(classId, {
            transaction,
        });

        if (!classroom) {
            throw new NotFoundException(
                `Classroom with ID ${classId} not found`,
            );
        }

        await classroom.increment('totalLessons', { transaction });
    }

    private async decrementClassroomLessonCount(
        classId: string,
        transaction?: Transaction,
    ): Promise<void> {
        const classroom = await this.classroomModel.findByPk(classId, {
            transaction,
        });

        if (!classroom) {
            throw new NotFoundException(
                `Classroom with ID ${classId} not found`,
            );
        }

        // Only decrement if totalLessons > 0
        if (classroom.totalLessons > 0) {
            await classroom.decrement('totalLessons', { transaction });
        }
    }
}
