import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ClassroomRating } from '../entities/classroom-rating.model';
import { CreateClassroomRatingDto } from '../dtos/create-classroom-rating.dto';
import { Transaction } from 'sequelize';

@Injectable()
export class ClassroomRatingRepository {
    constructor(
        @InjectModel(ClassroomRating)
        private classroomRatingModel: typeof ClassroomRating,
    ) {}

    async findOne(
        classId: string,
        userId: string,
        transaction?: Transaction,
    ): Promise<ClassroomRating | null> {
        return this.classroomRatingModel.findOne({
            where: { classId, userId },
            transaction,
        });
    }

    async create(
        classId: string,
        userId: string,
        createRatingDto: CreateClassroomRatingDto,
        transaction?: Transaction,
    ): Promise<ClassroomRating> {
        return this.classroomRatingModel.create(
            {
                classId,
                userId,
                rating: createRatingDto.rating,
            },
            { transaction },
        );
    }

    async update(
        ratingRecord: ClassroomRating,
        rating: number,
        transaction?: Transaction,
    ): Promise<ClassroomRating> {
        await ratingRecord.update({ rating }, { transaction });
        return ratingRecord;
    }

    async findAllByClassId(
        classId: string,
        transaction?: Transaction,
    ): Promise<ClassroomRating[]> {
        return this.classroomRatingModel.findAll({
            where: { classId },
            transaction,
        });
    }

    calculateAverageRating(ratings: ClassroomRating[]): number {
        if (ratings.length === 0) {
            return 0;
        }

        const totalRating = ratings.reduce(
            (sum, record) => sum + record.rating,
            0,
        );

        return totalRating / ratings.length;
    }
}
