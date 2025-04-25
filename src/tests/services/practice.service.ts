import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { InjectModel } from '@nestjs/sequelize';
import { Test } from '../entities/test.model';
import { TEMPLATES_GENERATOR } from '../prompts/practice.prompt';
import { Category } from '../enums/category.enum';
import { User } from '../../users/entities/user.model';
import { MessageService } from '../../chat/services/message.service';
import { CreateMessageDto } from '../../chat/dtos/create-message.dto';
import { CreateQuestionDto } from '../dtos/create-question.dto';
import { ConfigService } from '@nestjs/config';
import { Question } from '../entities/question.model';
@Injectable()
export class PracticeService {
    constructor(
        @InjectModel(Test)
        private readonly testModel: typeof Test,
        @InjectModel(Question)
        private readonly questionModel: typeof Question,
        private readonly messageService: MessageService,
        private readonly configService: ConfigService,
    ) {}

    async generatePracticeQuestions(
        user: User,
        category: Category,
    ): Promise<CreateQuestionDto[]> {
        try {
            const chosenTestId = this.configService.get('CHOSEN_TEST_ID');
            const newQuestions: CreateQuestionDto[] = [];

            const sessionId = uuidv4();
            await this.messageService.createChatSession({
                id: sessionId,
                userId: user.id,
                isActive: true,
                topic: `generate practice questions for ${category}`,
            });

            const request =
                `Cho phân loại sau: ${category},` +
                TEMPLATES_GENERATOR.CONSTANT_REQUEST;
            const chosenTest = await this.questionModel.findAll({
                where: { id: chosenTestId },
            });
            const testRequest = `Cho đề mẫu như sau:
                ${chosenTest.map((question) => question.content).join('\n')}
            `;

            const message: CreateMessageDto = {
                sessionId: sessionId,
                content: testRequest + '\n' + request,
                isBot: false,
            };

            const response = await this.messageService.receiveAndReply(
                message,
                TEMPLATES_GENERATOR,
            );
            const msg: string = response?.content;
            if (!msg) {
                throw new InternalServerErrorException(
                    'Failed to generate questions',
                );
            }

            let parseMsg;
            try {
                parseMsg = JSON.parse(msg);
            } catch (jsonError: any) {
                console.log(
                    `Initial JSON parsing failed, attempting to fix malformed JSON...${jsonError.message}`,
                );
                const fixedJson = this.sanitizeJsonString(msg);

                try {
                    parseMsg = JSON.parse(fixedJson);
                    console.log('Successfully parsed JSON after fixing');
                } catch (fixedJsonError) {
                    console.error(
                        'Failed to parse even after fixing JSON:',
                        fixedJsonError,
                    );

                    try {
                        parseMsg = this.tryJSONRepair(msg);
                    } catch (lastError) {
                        throw new InternalServerErrorException(
                            'Failed to parse AI-generated content as JSON',
                            lastError.message,
                        );
                    }
                }
            }

            // Validate the structure before proceeding
            if (!Array.isArray(parseMsg)) {
                throw new InternalServerErrorException(
                    'AI did not return an array of questions',
                );
            }

            for (let i = 0; i < parseMsg.length; ++i) {
                // Validate each item
                if (!this.isValidQuestionFormat(parseMsg[i])) {
                    console.warn(
                        `Skipping question ${i + 1} due to invalid format`,
                    );
                    continue;
                }

                const question: CreateQuestionDto = {
                    content: parseMsg[i].content,
                    choices: parseMsg[i].choices,
                    correctAnswer: parseMsg[i].correctAnswer,
                    points: 0.1,
                };
                newQuestions.push(question);
            }

            if (newQuestions.length === 0) {
                throw new InternalServerErrorException(
                    'No valid questions were generated',
                );
            }

            return newQuestions;
        } catch (error) {
            throw new InternalServerErrorException(
                'Failed to generate practice questions',
                error.message,
            );
        }
    }

    private sanitizeJsonString(jsonString: string): string {
        let startIndex = jsonString.indexOf('[');
        let endIndex = jsonString.lastIndexOf(']');

        if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
            // Fallback to looking for curly braces if array brackets not found
            startIndex = jsonString.indexOf('{');
            endIndex = jsonString.lastIndexOf('}');

            if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
                throw new Error(
                    'No valid JSON array or object found in the string',
                );
            }
        }

        let jsonContent = jsonString.substring(startIndex, endIndex + 1);

        jsonContent = jsonContent.replace(/'/g, '"');

        jsonContent = jsonContent.replace(
            /(\s*?{\s*?|\s*?,\s*?)(['"])?([a-zA-Z0-9_]+)(['"])?:/g,
            '$1"$3":',
        );

        jsonContent = jsonContent.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

        jsonContent = jsonContent.replace(/\/\/.*?(\r\n|\n|$)/g, '');
        jsonContent = jsonContent.replace(/\/\*[\s\S]*?\*\//g, '');

        return jsonContent;
    }

    private tryJSONRepair(jsonString: string): any {
        let cleaned = jsonString
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const arrayMatch = cleaned.match(/\[.*\]/);
        if (arrayMatch) {
            cleaned = arrayMatch[0];
        }

        cleaned = cleaned
            .replace(/'/g, '"')
            .replace(/(\w+):/g, '"$1":')
            .replace(/,\s*[}\]]/g, '$&'.replace(',', ''));

        try {
            return JSON.parse(cleaned);
        } catch (error: any) {
            throw new Error(
                `Failed to repair malformed JSON. Consider using a proper JSON repair library. ${error.message}`,
            );
        }
    }

    private isValidQuestionFormat(question: any): boolean {
        return (
            question &&
            typeof question === 'object' &&
            typeof question.content === 'string' &&
            question.choices &&
            typeof question.choices === 'object' &&
            typeof question.correctAnswer === 'string'
        );
    }
}
