import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dtos/create-message.dto';
import { MessageResponseDto } from './dtos/message-response.dto';
import { ConfigService } from '@nestjs/config';
import { ChatSession } from '../session/entities/chat-session.entity';
import { VectorStoreService } from '../../vector-store/vector-store.service';
import {
    ChatPromptTemplate,
    MessagesPlaceholder,
} from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { BaseChatMessageHistory } from '@langchain/core/dist/chat_history.js';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { ChatMessageHistory } from 'langchain/memory';
import { createHistoryAwareRetriever } from 'langchain/chains/history_aware_retriever';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { createRetrievalChain } from 'langchain/chains/retrieval';
import { CreateChatSessionDto } from '../session/dtos/create-chat-session.dto';

@Injectable()
export class MessageService {
    constructor(
        @InjectModel(ChatSession) private chatSessionModel: typeof ChatSession,
        @InjectModel(Message) private messageModel: typeof Message,
        private vectorStoreService: VectorStoreService,
        private configService: ConfigService,
    ) {}

    async createChatSession(
        createChatSessionDto: CreateChatSessionDto,
    ): Promise<void> {
        await this.chatSessionModel.create(createChatSessionDto);
    }

    async findChatSessionById(id: string): Promise<ChatSession | null> {
        const session = await this.chatSessionModel.findByPk(id);
        if (!session) {
            return null;
        }
        return session;
    }

    async receiveAndReply(
        createMessageDto: CreateMessageDto,
        TEMPLATES: any,
    ): Promise<MessageResponseDto> {
        try {
            const sessionId = createMessageDto.sessionId;
            const session = await this.chatSessionModel.findByPk(sessionId, {
                include: { all: true },
            });
            if (!session) {
                throw new NotFoundException('Chat session not found');
            }
            if (!session.isActive) {
                throw new HttpException('Chat session is not active', 400);
            }

            const chatHistory = new ChatMessageHistory();
            const messages = await this.messageModel.findAll({
                where: { sessionId },
            });

            messages.forEach((message) => {
                if (message.isBot) {
                    chatHistory.addAIMessage(message.content);
                } else {
                    chatHistory.addUserMessage(message.content);
                }
            });

            await this.messageModel.create(createMessageDto);

            const userInput = createMessageDto.content;
            const chain = this.loadRagChain(chatHistory, TEMPLATES);
            const answer = await (
                await chain
            ).invoke(
                { input: userInput },
                { configurable: { sessionId: sessionId } },
            );

            const message = await this.messageModel.create({
                sessionId,
                content: answer.answer,
                isBot: true,
            });

            return this.toMessageResponseDto(message);
        } catch (error) {
            throw new HttpException(error.message, error.status);
        }
    }

    async sendMessage(createMessageDto: CreateMessageDto): Promise<void> {
        await this.messageModel.create(createMessageDto);
    }

    async getResponse(sessionId: string, TEMPLATES: any) {
        try {
            const session = await this.chatSessionModel.findByPk(sessionId, {
                include: { all: true },
            });

            if (!session) {
                throw new NotFoundException('Chat session not found');
            }

            if (!session.isActive) {
                throw new HttpException('Chat session is not active', 400);
            }

            const chatHistory = new ChatMessageHistory();
            const messages = await this.messageModel.findAll({
                where: { sessionId },
                order: [['createdAt', 'ASC']],
            });

            if (messages.length === 0) {
                throw new HttpException(
                    'No messages found for this session',
                    400,
                );
            }

            const lastMessage = messages.pop();
            messages.forEach((message) => {
                if (message.dataValues.isBot) {
                    chatHistory.addAIMessage(message.dataValues.content);
                } else {
                    chatHistory.addUserMessage(message.dataValues.content);
                }
            });

            const chain = this.loadRagChain(chatHistory, TEMPLATES);
            const answer = await (
                await chain
            ).invoke(
                { input: lastMessage.content },
                { configurable: { sessionId: sessionId } },
            );
            const message = await this.messageModel.create({
                sessionId,
                content: answer.answer,
                isBot: true,
            });

            return this.toMessageResponseDto(message.dataValues);
        } catch (error) {
            throw new HttpException(error.message, error.status);
        }
    }

    private async loadRagChain(
        chatHistory: BaseChatMessageHistory,
        TEMPLATES: any,
    ) {
        const retriever = this.vectorStoreService.asRetriever();
        const gpt4omini = new ChatOpenAI({
            model: this.configService.get('OPENAI_MODEL'),
            temperature: parseFloat(
                this.configService.get<string>('OPENAI_TEMPERATURE'),
            ),
        });

        const contextPrompt = ChatPromptTemplate.fromMessages([
            ['system', TEMPLATES.HISTORY_AWARE],
            new MessagesPlaceholder('chat_history'),
            ['human', '{input}'],
        ]);

        const historyAwareRetriever = await createHistoryAwareRetriever({
            llm: gpt4omini,
            retriever: retriever,
            rephrasePrompt: contextPrompt,
        });

        const qaPrompt = ChatPromptTemplate.fromMessages([
            ['system', TEMPLATES.CONTEXT_AWARE],
            new MessagesPlaceholder('chat_history'),
            ['human', '{input}'],
        ]);

        const qaChain = await createStuffDocumentsChain({
            llm: gpt4omini,
            prompt: qaPrompt,
        });

        const ragChain = await createRetrievalChain({
            retriever: historyAwareRetriever,
            combineDocsChain: qaChain,
        });

        const conversationalRagChain = new RunnableWithMessageHistory({
            runnable: ragChain,
            getMessageHistory: async () => chatHistory,
            inputMessagesKey: 'input',
            historyMessagesKey: 'chat_history',
            outputMessagesKey: 'answer',
        });

        return conversationalRagChain;
    }

    async findBySessionId(
        sessionId: string,
    ): Promise<MessageResponseDto[] | null> {
        const messages = await this.messageModel.findAll({
            where: { sessionId },
        });
        if (messages.length === 0) {
            return null;
        }
        return messages.map((message) =>
            this.toMessageResponseDto(message.dataValues),
        );
    }

    private toMessageResponseDto(message: Message): MessageResponseDto {
        return {
            id: message.id,
            sessionId: message.sessionId,
            content: message.content,
            isBot: message.isBot,
            timestamp: message.timestamp,
        };
    }
}
