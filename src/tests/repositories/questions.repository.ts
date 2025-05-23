import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Question } from '../entities/question.model';
import { CreateQuestionDto } from '../dtos/create-question.dto';
import { Choice } from '../entities/choice.model';

@Injectable()
export class QuestionsRepository {
    constructor(
        @InjectModel(Question)
        private readonly questionModel: typeof Question,
        @InjectModel(Choice)
        private readonly choiceModel: typeof Choice,
    ) {}

    async createQuestion(
        testId: string,
        questionId: string,
        questionData: CreateQuestionDto,
        choiceId: string,
        questionOrder: number,
    ): Promise<Question> {
        try {
            const question = await this.questionModel.create({
                id: questionId,
                questionOrder: questionOrder,
                paragraph: questionData.paragraph,
                content: questionData.content,
                images: questionData.images || [],
                correctAnswer: questionData.correctAnswer,
                explanation: questionData.explanation,
                choices: choiceId,
                points: questionData.points,
                testId: testId,
            });

            if (!question) {
                throw new InternalServerErrorException(
                    'Error occurs when creating question',
                );
            }

            return question.dataValues as Question;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async getQuestionsByTestId(testId: string) {
        try {
            const questions = await this.questionModel.findAll({
                where: { testId },
            });

            return await Promise.all(
                questions.map(async (question) => {
                    const choices = await this.choiceModel.findByPk(
                        question.dataValues.choices,
                    );
                    return {
                        ...question.dataValues,
                        choices: { ...choices.dataValues },
                    };
                }),
            );
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async updateChoice(
        questionId: string,
        choiceId: string,
    ): Promise<Question> {
        try {
            await this.questionModel.update(
                { choices: choiceId },
                {
                    where: { id: questionId },
                },
            );

            const updatedQuestion =
                await this.questionModel.findByPk(questionId);

            if (!updatedQuestion) {
                throw new InternalServerErrorException(
                    'Error occurs when retrieving updated question',
                );
            }

            return updatedQuestion.dataValues as Question;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }
}
