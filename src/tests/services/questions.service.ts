import {
    Injectable,
    InternalServerErrorException,
    BadRequestException,
} from '@nestjs/common';
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

    async createNationalTestBatchQuestions(
        testId: string,
        totalQuestions: number,
        questions: CreateQuestionDto[],
    ): Promise<Question[]> {
        try {
            const createdQuestions: Question[] = [];

            for (let i = 0; i < totalQuestions; i++) {
                const question = {
                    ...questions[i],
                    explanation: null,
                    points: Number((10 / totalQuestions).toFixed(2)),
                };
                const questionId = uuidv4();

                const choice = await this.choicesRepository.createChoice(
                    questionId,
                    question.choices,
                );

                const createdQuestion =
                    await this.questionsRepository.createQuestion(
                        testId,
                        questionId,
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

    private parseImageUrlsToQuestions(
        imageUrls: string[],
    ): Map<number, { url: string; sequence: number }[]> {
        // Create a map to store question order -> image urls
        const questionImagesMap = new Map<
            number,
            {
                url: string;
                sequence: number;
            }[]
        >();

        // First, group images by question order
        imageUrls.forEach((url) => {
            const match = url.match(/question-(\d{3})(\d)\.(?:jpg|png|jpeg)/i);
            if (!match) {
                throw new BadRequestException(
                    `Invalid image name format: ${url}`,
                );
            }

            const [, questionOrderStr, sequenceStr] = match;
            const questionOrder = parseInt(questionOrderStr, 10);
            const sequence = parseInt(sequenceStr, 10);

            // Get existing images for this question
            const existingUrls = questionImagesMap.get(questionOrder) || [];

            // Handle single image case (sequence = 0)
            if (sequence === 0) {
                if (existingUrls.length > 1) {
                    throw new BadRequestException(
                        `Question ${questionOrder} has a single image marker (0) but multiple images were found`,
                    );
                }
                questionImagesMap.set(questionOrder, [{ url, sequence: 1 }]);
                return;
            }

            // Handle multiple images case (sequence 1-9)
            if (sequence < 1 || sequence > 9) {
                throw new BadRequestException(
                    `Invalid image sequence number (${sequence}) for question ${questionOrder}. Must be 0 for single image or 1-9 for multiple images.`,
                );
            }

            if (
                existingUrls.length === 1 &&
                existingUrls[0].sequence === 1 &&
                existingUrls[0].url.includes(`${questionOrder}0`)
            ) {
                throw new BadRequestException(
                    `Question ${questionOrder} already has a single image marked with 0, cannot add more images`,
                );
            }

            questionImagesMap.set(questionOrder, [
                ...existingUrls,
                { url, sequence },
            ]);
        });

        // Validate and sort images for each question
        for (const [questionOrder, imageData] of questionImagesMap) {
            // If it's a single image (originally marked with 0), we've already handled it
            if (
                imageData.length === 1 &&
                imageData[0].url.includes(`${questionOrder}0`)
            ) {
                questionImagesMap.set(questionOrder, [
                    { url: imageData[0].url, sequence: 1 },
                ]);
                continue;
            }

            // Sort by sequence number
            imageData.sort((a, b) => a.sequence - b.sequence);

            // Validate sequence continuity for multiple images
            for (let i = 0; i < imageData.length; i++) {
                const expectedSequence = i + 1;
                if (imageData[i].sequence !== expectedSequence) {
                    throw new BadRequestException(
                        `Missing or invalid sequence for question ${questionOrder}. ` +
                            `Expected sequence ${expectedSequence}, found ${imageData[i].sequence}`,
                    );
                }
            }

            // Replace the array with just URLs in correct order
            questionImagesMap.set(
                questionOrder,
                imageData.map((item) => ({
                    url: item.url,
                    sequence: item.sequence,
                })),
            );
        }

        return questionImagesMap;
    }

    public async createFirstPartQuestions(
        testId: string,
        totalQuestions: number,
        questions: CreateQuestionDto[],
        imagesUrls: string[],
    ): Promise<Question[]> {
        try {
            const urls: Map<number, { url: string; sequence: number }[]> =
                this.parseImageUrlsToQuestions(imagesUrls);
            const createdQuestions: Question[] = [];

            for (let i = 0; i < 6; i++) {
                const question = {
                    ...questions[i],
                    images: urls.get(i + 1).map((item) => item.url),
                    paragraph: null,
                    content: null,
                    explanation: null,
                    points: Number((10 / totalQuestions).toFixed(2)),
                };
                const questionId = uuidv4();
                const emptyChoice = {
                    A: '',
                    B: '',
                    C: '',
                    D: '',
                };

                const createdQuestion =
                    await this.questionsRepository.createQuestion(
                        testId,
                        questionId,
                        question,
                        null,
                        i + 1,
                    );

                const choice = await this.choicesRepository.createChoice(
                    questionId,
                    emptyChoice,
                );

                await this.questionsRepository.updateChoice(
                    questionId,
                    choice.id,
                );
                createdQuestions.push(createdQuestion);
            }

            return createdQuestions;
        } catch (error) {
            throw new InternalServerErrorException(
                'Error creating first part questions for TOEIC listening test',
                error.message,
            );
        }
    }

    public async createFirstPartQuestionsForToeicReadingTest(
        testId: string,
        totalQuestions: number,
        questions: CreateQuestionDto[],
    ): Promise<Question[]> {
        try {
            const createdQuestions: Question[] = [];

            for (let i = 0; i < 30; ++i) {
                const question = {
                    ...questions[i],
                    images: [],
                    paragraph: null,
                    content: questions[i].content,
                    explanation: null,
                    points: Number((10 / totalQuestions).toFixed(2)),
                };
                const questionId = uuidv4();

                const createdQuestion =
                    await this.questionsRepository.createQuestion(
                        testId,
                        questionId,
                        question,
                        null,
                        i + 1,
                    );

                const choice = await this.choicesRepository.createChoice(
                    questionId,
                    questions[i].choices,
                );

                await this.questionsRepository.updateChoice(
                    questionId,
                    choice.id,
                );
                createdQuestions.push(createdQuestion);
            }

            return createdQuestions;
        } catch (error) {
            throw new InternalServerErrorException(
                'Error creating first part questions for TOEIC reading test',
                error.message,
            );
        }
    }

    public async createVisualSecondPartQuestionsForToeicReadingTest(
        testId: string,
        totalQuestions: number,
        questions: CreateQuestionDto[],
        imagesUrls: string[],
        batch: number[],
    ): Promise<Question[]> {
        try {
            const urls: Map<number, { url: string; sequence: number }[]> =
                this.parseImageUrlsToQuestions(imagesUrls);

            // check if the batch is valid
            let startingIndex = 30;
            for (let i = 0; i < batch.length; i++) {
                const step = batch[i];
                startingIndex = startingIndex + step;
            }
            if (startingIndex != 46) {
                throw new BadRequestException('Invalid batch');
            }

            const createdQuestions: Question[] = [];
            startingIndex = 30;
            for (let i = 0; i < batch.length; i++) {
                const step = batch[i];
                const image = urls.get(startingIndex + 1);
                for (
                    let idx = startingIndex;
                    idx < startingIndex + step;
                    ++idx
                ) {
                    const question = {
                        ...questions[idx],
                        images:
                            idx === startingIndex
                                ? image.map((item) => item.url)
                                : [],
                        paragraph: null,
                        content: questions[idx].content,
                        explanation: null,
                        points: Number((10 / totalQuestions).toFixed(2)),
                    };
                    const questionId = uuidv4();
                    const createdQuestion =
                        await this.questionsRepository.createQuestion(
                            testId,
                            questionId,
                            question,
                            null,
                            i + 1,
                        );

                    const choice = await this.choicesRepository.createChoice(
                        questionId,
                        questions[idx].choices,
                    );

                    await this.questionsRepository.updateChoice(
                        questionId,
                        choice.id,
                    );
                    createdQuestions.push(createdQuestion);
                }
                startingIndex = startingIndex + step;
            }

            return createdQuestions;
        } catch (error) {
            throw new InternalServerErrorException(
                'Error creating second part questions for TOEIC reading test',
                error.message,
            );
        }
    }

    public async createTextSecondPartQuestionsForToeicReadingTest(
        testId: string,
        totalQuestions: number,
        questions: CreateQuestionDto[],
    ): Promise<Question[]> {
        try {
            const createdQuestions: Question[] = [];
            const offset = 30;
            for (let i = 30; i < 46; ++i) {
                const question = {
                    ...questions[i - offset],
                    images: [],
                    paragraph: null,
                    content: questions[i - offset].content,
                    explanation: null,
                    points: Number((10 / totalQuestions).toFixed(2)),
                };
                const questionId = uuidv4();

                const createdQuestion =
                    await this.questionsRepository.createQuestion(
                        testId,
                        questionId,
                        question,
                        null,
                        i + 1,
                    );

                const choice = await this.choicesRepository.createChoice(
                    questionId,
                    questions[i - offset].choices,
                );

                await this.questionsRepository.updateChoice(
                    questionId,
                    choice.id,
                );
                createdQuestions.push(createdQuestion);
            }

            return createdQuestions;
        } catch (error) {
            throw new InternalServerErrorException(
                'Error creating text second part questions for TOEIC reading test',
                error.message,
            );
        }
    }

    public async createSecondPartQuestions(
        testId: string,
        totalQuestions: number,
        questions: CreateQuestionDto[],
    ): Promise<Question[]> {
        try {
            const createdQuestions: Question[] = [];
            const offset = 6;
            for (let i = 6; i < 31; i++) {
                const question = {
                    ...questions[i - offset],
                    paragraph: null,
                    content: null,
                    explanation: null,
                    points: Number((10 / totalQuestions).toFixed(2)),
                };
                const questionId = uuidv4();
                const emptyChoice = {
                    A: '',
                    B: '',
                    C: '',
                    D: '',
                };

                const createdQuestion =
                    await this.questionsRepository.createQuestion(
                        testId,
                        questionId,
                        question,
                        null,
                        i + 1,
                    );

                const choice = await this.choicesRepository.createChoice(
                    questionId,
                    emptyChoice,
                );

                await this.questionsRepository.updateChoice(
                    questionId,
                    choice.id,
                );
                createdQuestions.push(createdQuestion);
            }

            return createdQuestions;
        } catch (error) {
            throw new InternalServerErrorException(
                'Error creating second part questions for TOEIC listening test',
                error.message,
            );
        }
    }

    public async createTextThirdPartQuestionsForToeicReadingTest(
        testId: string,
        totalQuestions: number,
        questions: CreateQuestionDto[],
    ): Promise<Question[]> {
        try {
            const createdQuestions: Question[] = [];
            const offset = 46;
            for (let i = 46; i < 100; i++) {
                const question = {
                    ...questions[i - offset],
                    images: [],
                    paragraph: null,
                    content: questions[i - offset].content,
                    explanation: null,
                    points: Number((10 / totalQuestions).toFixed(2)),
                };
                const questionId = uuidv4();

                const createdQuestion =
                    await this.questionsRepository.createQuestion(
                        testId,
                        questionId,
                        question,
                        null,
                        i + 1,
                    );

                const choice = await this.choicesRepository.createChoice(
                    questionId,
                    questions[i - offset].choices,
                );

                await this.questionsRepository.updateChoice(
                    questionId,
                    choice.id,
                );
                createdQuestions.push(createdQuestion);
            }

            return createdQuestions;
        } catch (error) {
            throw new InternalServerErrorException(
                'Error creating text third part questions for TOEIC reading test',
                error.message,
            );
        }
    }

    public async createVisualThirdPartQuestionsForToeicReadingTest(
        testId: string,
        totalQuestions: number,
        questions: CreateQuestionDto[],
        imagesUrls: string[],
        batch: number[],
    ): Promise<Question[]> {
        try {
            const urls: Map<number, { url: string; sequence: number }[]> =
                this.parseImageUrlsToQuestions(imagesUrls);

            // check if the batch is valid
            let startingIndex = 47;
            for (let i = 0; i < batch.length; i++) {
                const step = batch[i];
                startingIndex = startingIndex + step;
            }
            if (startingIndex != 100) {
                throw new BadRequestException('Invalid batch');
            }

            const createdQuestions: Question[] = [];
            startingIndex = 46;
            const offset = 46;
            for (let i = 0; i < batch.length; i++) {
                const step = batch[i];
                const image = urls.get(startingIndex + 1);
                for (
                    let idx = startingIndex;
                    idx < startingIndex + step;
                    idx++
                ) {
                    const question = {
                        ...questions[idx - offset],
                        images:
                            idx === startingIndex
                                ? image.map((item) => item.url)
                                : [],
                        paragraph: null,
                        content: questions[idx - offset].content,
                        explanation: null,
                        points: Number((10 / totalQuestions).toFixed(2)),
                    };
                    const questionId = uuidv4();
                    const createdQuestion =
                        await this.questionsRepository.createQuestion(
                            testId,
                            questionId,
                            question,
                            null,
                            idx + 1,
                        );

                    const choice = await this.choicesRepository.createChoice(
                        questionId,
                        questions[idx - offset].choices,
                    );

                    await this.questionsRepository.updateChoice(
                        questionId,
                        choice.id,
                    );
                    createdQuestions.push(createdQuestion);
                }
                startingIndex = startingIndex + step;
            }

            return createdQuestions;
        } catch (error) {
            throw new InternalServerErrorException(
                'Error creating visual third part questions for TOEIC reading test',
                error.message,
            );
        }
    }

    public async createTextThirdPartQuestions(
        testId: string,
        totalQuestions: number,
        questions: CreateQuestionDto[],
    ): Promise<Question[]> {
        try {
            const createdQuestions: Question[] = [];
            const offset = 31;
            for (let i = 31; i < 70; i++) {
                const question = {
                    ...questions[i - offset],
                    paragraph: null,
                    images: [],
                    content: questions[i - offset].content,
                    explanation: null,
                    points: Number((10 / totalQuestions).toFixed(2)),
                };

                const questionId = uuidv4();
                const createdQuestion =
                    await this.questionsRepository.createQuestion(
                        testId,
                        questionId,
                        question,
                        null,
                        i + 1,
                    );

                const choice = await this.choicesRepository.createChoice(
                    questionId,
                    questions[i - offset].choices,
                );

                await this.questionsRepository.updateChoice(
                    questionId,
                    choice.id,
                );

                createdQuestions.push(createdQuestion);
            }

            return createdQuestions;
        } catch (error) {
            throw new InternalServerErrorException(
                'Error creating text third part questions for TOEIC listening test',
                error.message,
            );
        }
    }

    public async createVisualThirdPartQuestions(
        testId: string,
        totalQuestions: number,
        questions: CreateQuestionDto[],
        imagesUrls: string[],
        batch: number[],
    ): Promise<Question[]> {
        try {
            const urls: Map<number, { url: string; sequence: number }[]> =
                this.parseImageUrlsToQuestions(imagesUrls);

            // check if the batch is valid
            let startingIndex = 32;
            for (let i = 0; i < batch.length; i++) {
                const step = batch[i];
                startingIndex = startingIndex + step;
            }
            if (startingIndex != 70) {
                throw new BadRequestException('Invalid batch');
            }

            const createdQuestions: Question[] = [];
            startingIndex = 31;
            const offset = 31;
            for (let i = 0; i < batch.length; i++) {
                const step = batch[i];
                const image = urls.get(startingIndex + 1);
                for (
                    let idx = startingIndex;
                    idx < startingIndex + step;
                    idx++
                ) {
                    const question = {
                        ...questions[idx - offset],
                        images:
                            idx === startingIndex
                                ? image.map((item) => item.url)
                                : [],
                        paragraph: null,
                        content: questions[idx - offset].content,
                        explanation: null,
                        points: Number((10 / totalQuestions).toFixed(2)),
                    };
                    const questionId = uuidv4();

                    const createdQuestion =
                        await this.questionsRepository.createQuestion(
                            testId,
                            questionId,
                            question,
                            null,
                            idx + 1,
                        );

                    const choice = await this.choicesRepository.createChoice(
                        questionId,
                        questions[idx - offset].choices,
                    );

                    await this.questionsRepository.updateChoice(
                        questionId,
                        choice.id,
                    );
                    createdQuestions.push(createdQuestion);
                }
                startingIndex = startingIndex + step;
            }

            return createdQuestions;
        } catch (error) {
            throw new InternalServerErrorException(
                'Error creating visual third part questions for TOEIC listening test',
                error.message,
            );
        }
    }

    public async createTextFourthPartQuestions(
        testId: string,
        totalQuestions: number,
        questions: CreateQuestionDto[],
    ): Promise<Question[]> {
        try {
            const createdQuestions: Question[] = [];
            const offset = 70;
            for (let i = 70; i < 100; i++) {
                const question = {
                    ...questions[i - offset],
                    paragraph: null,
                    content: questions[i - offset].content,
                    explanation: null,
                    points: Number((10 / totalQuestions).toFixed(2)),
                };

                const questionId = uuidv4();

                const createdQuestion =
                    await this.questionsRepository.createQuestion(
                        testId,
                        questionId,
                        question,
                        null,
                        i + 1,
                    );

                const choice = await this.choicesRepository.createChoice(
                    questionId,
                    questions[i - offset].choices,
                );

                await this.questionsRepository.updateChoice(
                    questionId,
                    choice.id,
                );
                createdQuestions.push(createdQuestion);
            }

            return createdQuestions;
        } catch (error) {
            throw new InternalServerErrorException(
                'Error creating text fourth part questions',
                error.message,
            );
        }
    }

    public async createVisualFourthPartQuestions(
        testId: string,
        totalQuestions: number,
        questions: CreateQuestionDto[],
        imagesUrls: string[],
        batch: number[],
    ): Promise<Question[]> {
        try {
            const urls: Map<number, { url: string; sequence: number }[]> =
                this.parseImageUrlsToQuestions(imagesUrls);

            // check if the batch is valid
            let startingIndex = 71;
            for (let i = 0; i < batch.length; i++) {
                const step = batch[i];
                startingIndex = startingIndex + step;
            }
            if (startingIndex != 100) {
                throw new BadRequestException('Invalid batch');
            }

            const createdQuestions: Question[] = [];
            startingIndex = 70;
            const offset = 70;
            for (let i = 0; i < batch.length; i++) {
                const step = batch[i];
                const image = urls.get(startingIndex + 1);
                for (
                    let idx = startingIndex;
                    idx < startingIndex + step;
                    idx++
                ) {
                    const question = {
                        ...questions[idx - offset],
                        images:
                            idx === startingIndex
                                ? image.map((item) => item.url)
                                : [],
                        paragraph: null,
                        content: questions[idx - offset].content,
                        explanation: null,
                        points: Number((10 / totalQuestions).toFixed(2)),
                    };
                    const questionId = uuidv4();

                    const createdQuestion =
                        await this.questionsRepository.createQuestion(
                            testId,
                            questionId,
                            question,
                            null,
                            idx + 1,
                        );

                    const choice = await this.choicesRepository.createChoice(
                        questionId,
                        questions[idx - offset].choices,
                    );

                    await this.questionsRepository.updateChoice(
                        questionId,
                        choice.id,
                    );
                    createdQuestions.push(createdQuestion);
                }
                startingIndex = startingIndex + step;
            }

            return createdQuestions;
        } catch (error) {
            throw new InternalServerErrorException(
                'Error creating visual fourth part questions',
                error.message,
            );
        }
    }
}
