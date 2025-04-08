import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { Classroom } from './entities/classroom.model';
import { CreateClassroomDto } from './dtos/create-classroom.dto';
import { CreateClassroomRatingDto } from './dtos/create-classroom-rating.dto';
import { Sequelize } from 'sequelize-typescript';
import { ClassroomRepository } from './repositories/classroom.repository';
import { ClassroomRatingRepository } from './repositories/classroom-rating.repository';

@Injectable()
export class ClassroomService {
    constructor(
        private classroomRepository: ClassroomRepository,
        private classroomRatingRepository: ClassroomRatingRepository,
        private sequelize: Sequelize,
    ) {}

    async create(
        teacherId: string,
        createClassroomDto: CreateClassroomDto,
        backgroundImageUrl?: string,
    ): Promise<Classroom> {
        // Generate a 6-letter class code
        const classCode = this.generateClassCode();

        return this.classroomRepository.create(
            teacherId,
            createClassroomDto,
            classCode,
            backgroundImageUrl,
        );
    }

    async findAll(): Promise<Classroom[]> {
        return this.classroomRepository.findAll();
    }

    async findOne(id: string): Promise<Classroom> {
        return this.classroomRepository.findOne(id);
    }

    async findByTeacher(teacherId: string): Promise<Classroom[]> {
        return this.classroomRepository.findByTeacher(teacherId);
    }

    async update(
        id: string,
        updateData: Partial<CreateClassroomDto>,
        backgroundImageUrl?: string,
    ): Promise<Classroom> {
        return this.classroomRepository.update(
            id,
            updateData,
            backgroundImageUrl,
        );
    }

    async remove(id: string): Promise<void> {
        return this.classroomRepository.remove(id);
    }

    async rateClassroom(
        classId: string,
        userId: string,
        createRatingDto: CreateClassroomRatingDto,
    ): Promise<{ avgRating: number }> {
        // Check if classroom exists
        const classroom = await this.classroomRepository.findOne(classId);

        if (!classroom) {
            throw new NotFoundException(
                `Classroom with ID ${classId} not found`,
            );
        }
        // Use a transaction to ensure data consistency
        const t = await this.sequelize.transaction();

        try {
            // Check if user has already rated this classroom
            const ratingRecord = await this.classroomRatingRepository.findOne(
                classId,
                userId,
                t,
            );

            if (ratingRecord) {
                // Update existing rating
                await this.classroomRatingRepository.update(
                    ratingRecord,
                    createRatingDto.rating,
                    t,
                );
            } else {
                // Create new rating
                await this.classroomRatingRepository.create(
                    classId,
                    userId,
                    createRatingDto,
                    t,
                );
            }

            // Calculate new average rating
            const ratings =
                await this.classroomRatingRepository.findAllByClassId(
                    classId,
                    t,
                );

            const avgRating =
                this.classroomRatingRepository.calculateAverageRating(ratings);

            // Update classroom's average rating
            await this.classroomRepository.updateAvgRating(
                classId,
                avgRating,
                t,
            );

            await t.commit();

            return { avgRating };
        } catch (error: any) {
            await t.rollback();
            throw new BadRequestException(error.message);
        }
    }

    private generateClassCode(): string {
        // Generate a random 6-letter code
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';

        for (let i = 0; i < 6; i++) {
            result += characters.charAt(
                Math.floor(Math.random() * characters.length),
            );
        }

        return result;
    }
}
