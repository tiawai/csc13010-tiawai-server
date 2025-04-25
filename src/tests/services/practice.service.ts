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
            const parseMsg = JSON.parse(msg);
            for (let i = 0; i < parseMsg.length; ++i) {
                const question: CreateQuestionDto = {
                    content: parseMsg[i].content,
                    choices: parseMsg[i].choices,
                    correctAnswer: parseMsg[i].correctAnswer,
                    points: 0.1,
                };
                newQuestions.push(question);
            }
            return newQuestions;
        } catch (error) {
            throw new InternalServerErrorException(
                'Failed to generate practice questions',
                error.message,
            );
        }
    }
}
