import {
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { TestsRepository } from '../repositories/tests.repository';
import { Test } from '../entities/test.model';
import { CreateTestDto } from '../dtos/create-test.dto';
import { CreateQuestionDto } from '../dtos/create-question.dto';
import { QuestionsService } from './questions.service';
import { Question } from '../entities/question.model';
import { AnswerSheetDto } from '../dtos/create-answer.dto';
import { SubmissionsRepository } from '../repositories/submissions.repository';
import { AnswerRepository } from '../repositories/answer.repository';
@Injectable()
export class TestsService {
    constructor(
        private readonly testsRepository: TestsRepository,
        private readonly questionsService: QuestionsService,
        private readonly submissionsRepository: SubmissionsRepository,
        private readonly answerRepository: AnswerRepository,
    ) {}

    async getAllTests(): Promise<Test[]> {
        try {
            return await this.testsRepository.findAll();
        } catch (error) {
            throw new InternalServerErrorException(
                'Error getting tests',
                error.message,
            );
        }
    }

    async submitTest(
        testId: string,
        userId: string,
        answerSheet: AnswerSheetDto,
    ) {
        const test = await this.testsRepository.findById(testId);
        if (!test) {
            throw new NotFoundException('Test not found');
        }
        const { answers, timeConsumed } = answerSheet;
        const questions =
            await this.questionsService.getQuestionsByTestId(testId);

        let score: number = 0;
        let correctAnswers: number = 0;
        let incorrectAnswers: number = 0;
        for (const answer of answers) {
            const question = questions.find(
                (question) => question.questionOrder === answer.questionOrder,
            );
            if (!question) {
                throw new NotFoundException('Question not found');
            }

            if (question.correctAnswer === answer.answer) {
                score = score + Number(question.points);
                correctAnswers = correctAnswers + 1;
            } else {
                incorrectAnswers = incorrectAnswers + 1;
            }
        }
        const answersWithQuestionId = answers.map((answer) => ({
            ...answer,
            questionId: questions.find(
                (question) => question.questionOrder === answer.questionOrder,
            )?.id,
        }));

        const submission = await this.submissionsRepository.createSubmission(
            testId,
            userId,
            score,
            timeConsumed,
        );

        const createdAnswers = await this.answerRepository.createAnswers(
            submission.id,
            answersWithQuestionId,
        );

        if (!createdAnswers) {
            throw new InternalServerErrorException(
                'Error occurs when creating answers',
            );
        }

        return {
            submissionId: submission.id,
            score,
            correctAnswers: correctAnswers,
            incorrectAnswers: incorrectAnswers,
            emptyAnswers: questions.length - correctAnswers - incorrectAnswers,
        };
    }

    async getTestById(
        id: string,
    ): Promise<{ test: Test; questions: Question[] }> {
        const test = await this.testsRepository.findById(id);
        if (!test) {
            throw new NotFoundException('Test not found');
        }

        const questions = await this.questionsService.getQuestionsByTestId(id);
        return { test: test, questions: questions };
    }

    async createNationalTest(
        createTestDto: CreateTestDto,
        createQuestionsDto: CreateQuestionDto[],
        authorId: string,
    ): Promise<Test> {
        try {
            const test = await this.testsRepository.createTest(
                createTestDto,
                authorId,
            );

            await this.questionsService.createNationalTestBatchQuestions(
                test.id,
                createTestDto.totalQuestions,
                createQuestionsDto,
            );

            return test;
        } catch (error) {
            throw new InternalServerErrorException(
                'Error creating test',
                error.message,
            );
        }
    }

    async createToeicListeningTest(
        createTestDto: CreateTestDto,
        authorId: string,
        audioUrl: string,
    ): Promise<Test> {
        try {
            const test = await this.testsRepository.createTest(
                createTestDto,
                authorId,
                audioUrl,
            );

            return test;
        } catch (error) {
            throw new InternalServerErrorException(
                'Error creating test',
                error.message,
            );
        }
    }

    async createToeicReadingTest(
        createTestDto: CreateTestDto,
        authorId: string,
    ): Promise<Test> {
        try {
            const test = await this.testsRepository.createTest(
                createTestDto,
                authorId,
            );

            return test;
        } catch (error) {
            throw new InternalServerErrorException(
                'Error creating test',
                error.message,
            );
        }
    }
}
