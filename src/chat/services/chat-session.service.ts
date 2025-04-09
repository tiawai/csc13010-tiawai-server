import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ChatSession } from '../entities/chat-session.entity';
import { CreateChatSessionDto } from '../dtos/create-chat-session.dto';
import { ChatSessionResponseDto } from '../dtos/chat-session-response.dto';
import { Message } from '../entities/message.entity';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class ChatSessionService {
    constructor(
        @InjectModel(ChatSession) private chatSessionModel: typeof ChatSession,
        @InjectModel(Message) private messageModel: typeof Message,
        private readonly sequelize: Sequelize,
    ) {}

    async create(
        createChatSessionDto: CreateChatSessionDto,
    ): Promise<ChatSessionResponseDto> {
        const session =
            await this.chatSessionModel.create(createChatSessionDto);
        return this.toChatSessionResponseDto(session);
    }

    async findAll(): Promise<ChatSessionResponseDto[]> {
        const sessions = await this.chatSessionModel.findAll({
            include: { all: true },
        });
        return sessions.map((session) =>
            this.toChatSessionResponseDto(session),
        );
    }

    async findById(id: string): Promise<ChatSessionResponseDto> {
        const session = await this.chatSessionModel.findByPk(id, {
            include: { all: true },
        });
        if (!session) {
            throw new NotFoundException('Chat session not found');
        }
        return this.toChatSessionResponseDto(session);
    }

    async remove(id: string): Promise<void> {
        const transaction = await this.sequelize.transaction();
        try {
            const session = await this.chatSessionModel.findByPk(id, {
                transaction,
            });
            if (!session) {
                throw new NotFoundException('Chat session not found');
            }

            await this.messageModel.destroy({
                where: { sessionId: id },
                transaction,
            });
            await this.chatSessionModel.destroy({
                where: { id },
                transaction,
            });
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async disable(id: string): Promise<ChatSessionResponseDto> {
        const session = await this.chatSessionModel.findByPk(id);

        if (!session) {
            throw new NotFoundException('Chat session not found');
        }
        session.isActive = false;
        await session.save();
        return this.toChatSessionResponseDto(session);
    }

    private toChatSessionResponseDto(
        session: ChatSession,
    ): ChatSessionResponseDto {
        return {
            id: session.id,
            userId: session.userId,
            topic: session.topic,
            isActive: session.isActive,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
        };
    }
}
