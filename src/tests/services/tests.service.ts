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
import { SubmissionsRepository } from '../repositories/submissions.repository';
import { AnswerRepository } from '../repositories/answer.repository';
import { TestType } from '../enums/test-type.enum';
import { AnswerSheetDto } from '../dtos/create-answer.dto';
import { ClassroomTestsRepository } from 'src/classrooms/repositories/classroom-test.repository';
@Injectable()
export class TestsService {
    constructor(
        private readonly testsRepository: TestsRepository,
        private readonly questionsService: QuestionsService,
        private readonly submissionsRepository: SubmissionsRepository,
        private readonly answerRepository: AnswerRepository,
        private readonly classroomTestsRepository: ClassroomTestsRepository,
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
                score += Number(question.points);
                correctAnswers++;
            } else if (answer.answer !== null || answer.answer !== undefined) {
                incorrectAnswers++;
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

    async getSubmissionResult(
        testId: string,
        submissionId: string,
    ): Promise<any> {
        try {
            const submission =
                await this.submissionsRepository.getSubmissionsById(
                    submissionId,
                );

            const answers =
                await this.answerRepository.getAnswersBySubmissionId(
                    submissionId,
                );

            const questions =
                await this.questionsService.getQuestionsByTestId(testId);

            let score: number = 0;
            let correctAnswers: number = 0;
            let incorrectAnswers: number = 0;
            answers.forEach((answer) => {
                const question = questions.find(
                    (question) => question.id === answer.questionId,
                );

                if (question.correctAnswer === answer.answer) {
                    score += Number(question.points);
                    correctAnswers++;
                } else if (
                    answer.answer !== null ||
                    answer.answer !== undefined
                ) {
                    incorrectAnswers++;
                }
            });

            return {
                result: {
                    score,
                    correctAnswers,
                    incorrectAnswers,
                    emptyAnswers:
                        questions.length - correctAnswers - incorrectAnswers,
                    timeConsumed: submission.timeConsumed,
                },
                answers,
            };
        } catch (error) {
            throw new InternalServerErrorException(
                'Failed to get submission result',
                error.message,
            );
        }
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

    async getTestsByType(type: TestType) {
        const tests = await this.testsRepository.findByType(type);
        if (!tests) {
            throw new NotFoundException('No tests found');
        }

        const filteredTests = await Promise.all(
            tests.map(async (test) => {
                const isPrivate =
                    await this.classroomTestsRepository.isPrivateTest(test.id);
                if (isPrivate) {
                    return null;
                }
                const submissionCount =
                    await this.submissionsRepository.countSubmissionsByTestId(
                        test.id,
                    );
                return {
                    ...test,
                    submissionCount,
                };
            }),
        );

        return filteredTests.filter((t) => t !== null);
    }

    async getTestSubmissionsByUserId(testId: string, userId: string) {
        return await this.submissionsRepository.getTestSubmissionsByUserId(
            testId,
            userId,
        );
    }
}
