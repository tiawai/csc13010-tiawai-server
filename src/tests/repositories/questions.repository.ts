import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Question } from '../entities/question.model';
import { CreateQuestionDto } from '../dtos/create-question.dto';

@Injectable()
export class QuestionsRepository {
    constructor(
        @InjectModel(Question)
        private readonly questionModel: typeof Question,
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
}
