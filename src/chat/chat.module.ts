import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ChatSession } from './session/entities/chat-session.entity';
import { Message } from './message/entities/message.entity';
import { ChatSessionService } from './session/chat-session.service';
import { MessageService } from './message/message.service';
import { ChatSessionController } from './session/chat-session.controller';
import { MessageController } from './message/message.controller';
import { VectorStoreModule } from '../vector-store/vector-store.module';
import { AccessControlModule } from '../ac/ac.module';
import { JwtService } from '@nestjs/jwt';

@Module({
    imports: [
        SequelizeModule.forFeature([ChatSession, Message]),
        VectorStoreModule,
        AccessControlModule,
    ],
    controllers: [ChatSessionController, MessageController],
    providers: [ChatSessionService, MessageService, JwtService],
    exports: [ChatSessionService, MessageService],
})
export class ChatModule {}
