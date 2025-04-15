import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Answer } from '../entities/answer.model';
import { CreateAnswerWithQuestionIdDto } from '../dtos/create-answer.dto';

@Injectable()
export class AnswerRepository {
    constructor(
        @InjectModel(Answer)
        private readonly answerModel: typeof Answer,
    ) {}

    async createAnswers(
        submissionId: string,
        answers: CreateAnswerWithQuestionIdDto[],
    ): Promise<Answer[]> {
        const createdAnswers = await Promise.all(
            answers.map(async (answer) => {
                const createdAnswer = await this.answerModel.create({
                    id: uuidv4(),
                    submissionId,
                    questionId: answer.questionId,
                    answer: answer.answer,
                    createdAt: new Date(),
                });

                return createdAnswer.dataValues as Answer;
            }),
        );

        if (!createdAnswers) {
            return null;
        }

        return createdAnswers;
    }
}
