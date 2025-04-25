import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Submission } from '../entities/submission.model';
import { v4 as uuidv4 } from 'uuid';
import { TestType } from '../enums/test-type.enum';
import { Test } from '../entities/test.model';

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

    async countSubmissionsByTestId(testId: string): Promise<number> {
        try {
            const count = await this.submissionModel.count({
                where: { testId },
            });

            return count;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async getSubmissionsById(id: string): Promise<Submission> {
        try {
            const submission =
                await this.submissionModel.findByPk<Submission>(id);
            if (!submission) {
                throw new InternalServerErrorException(
                    'Error occurs when finding submission',
                );
            }
            return submission.dataValues as Submission;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async getTestSubmissionsByUserId(testId: string, userId: string) {
        try {
            return await this.submissionModel.findAll({
                where: { testId, userId },
                raw: true,
                nest: true,
            });
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async getSubmissionStatisticsByUserId(userId: string) {
        try {
            const submissions = await this.submissionModel.findAll({
                where: { userId },
                include: [
                    {
                        model: Test,
                        attributes: ['type'],
                    },
                ],
                raw: true,
                nest: true,
            });

            let toeicTestCompleted = 0;
            let nationalTestCompleted = 0;

            submissions.forEach((submission) => {
                if (submission.test.type === TestType.NATIONAL_TEST) {
                    nationalTestCompleted++;
                }
            });

            toeicTestCompleted = submissions.length - nationalTestCompleted;

            return {
                toeicTestCompleted,
                nationalTestCompleted,
            };
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async getTestRankings(testId: string): Promise<any[]> {
        try {
            const submissions = await this.submissionModel.findAll({
                where: { testId },
            });
            return submissions;
        } catch (error: any) {
            throw new InternalServerErrorException(
                `Error fetching test rankings: ${(error as Error).message}`,
            );
        }
    }
}
