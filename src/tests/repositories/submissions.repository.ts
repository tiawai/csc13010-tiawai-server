import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Submission } from '../entities/submission.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SubmissionsRepository {
    constructor(
        @InjectModel(Submission)
        private readonly submissionModel: typeof Submission,
    ) {}

    async createSubmission(
        testId: string,
        userId: string,
        score: number,
        timeConsumed: number,
    ): Promise<Submission> {
        try {
            const submission = await this.submissionModel.create({
                id: uuidv4(),
                testId,
                userId,
                score,
                timeConsumed,
                submitAt: new Date(),
            });

            if (!submission) {
                throw new InternalServerErrorException(
                    'Error occurs when creating submission',
                );
            }

            return submission.dataValues as Submission;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }
}
