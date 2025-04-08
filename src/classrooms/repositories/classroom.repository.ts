import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Classroom } from '../entities/classroom.model';
import { CreateClassroomDto } from '../dtos/create-classroom.dto';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class ClassroomRepository {
    constructor(
        @InjectModel(Classroom)
        private classroomModel: typeof Classroom,
        private sequelize: Sequelize,
    ) {}

    async create(
        teacherId: string,
        createClassroomDto: CreateClassroomDto,
        classCode: string,
        backgroundImageUrl?: string,
    ): Promise<Classroom> {
        return this.classroomModel.create({
            ...createClassroomDto,
            teacherId,
            classCode,
            price: createClassroomDto.price || 0,
            backgroundImage: backgroundImageUrl,
            totalLessons: 0,
            avgRating: 0,
        });
    }

    async findAll(): Promise<Classroom[]> {
        return this.classroomModel.findAll();
    }

    async findOne(id: string): Promise<Classroom> {
        return this.classroomModel.findByPk(id);
    }

    async findByTeacher(teacherId: string): Promise<Classroom[]> {
        return this.classroomModel.findAll({
            where: { teacherId },
        });
    }

    async update(
        id: string,
        updateData: Partial<CreateClassroomDto>,
        backgroundImageUrl?: string,
    ): Promise<Classroom> {
        const classroom = await this.findOne(id);

        const dataToUpdate = { ...updateData };
        if (backgroundImageUrl) {
            dataToUpdate['backgroundImage'] = backgroundImageUrl;
        }

        await classroom.update(dataToUpdate);

        return classroom;
    }

    async remove(id: string): Promise<void> {
        const classroom = await this.findOne(id);
        await classroom.destroy();
    }

    async updateAvgRating(
        classId: string,
        avgRating: number,
        transaction?: any,
    ): Promise<Classroom> {
        const classroom = await this.classroomModel.findByPk(classId, {
            transaction,
        });

        if (!classroom) {
            throw new NotFoundException(
                `Classroom with ID ${classId} not found`,
            );
        }

        await classroom.update({ avgRating }, { transaction });
        return classroom;
    }
}
