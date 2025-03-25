import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { QuestionsRepository } from '../repositories/questions.repository';
import { ChoicesRepository } from '../repositories/choices.repository';
import { Question } from '../entities/question.model';
import { CreateQuestionDto } from '../dtos/create-question.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QuestionsService {
    constructor(
        private readonly questionsRepository: QuestionsRepository,
        private readonly choicesRepository: ChoicesRepository,
    ) {}

    async createBatchQuestions(
        testId: string,
        totalQuestions: number,
        questions: CreateQuestionDto[],
    ): Promise<Question[]> {
        try {
            const createdQuestions: Question[] = [];

            for (let i = 0; i < totalQuestions; i++) {
                const question = questions[i];
                const questionId = uuidv4();

                const choice = await this.choicesRepository.createChoice(
                    questionId,
                    question.choices,
                );

                const createdQuestion =
                    await this.questionsRepository.createQuestion(
                        testId,
                        question,
                        choice.id,
                        i + 1,
                    );

                createdQuestions.push(createdQuestion);
            }

            return createdQuestions;
        } catch (error) {
            throw new InternalServerErrorException(
                'Error creating batch questions',
                error.message,
            );
        }
    }
}
