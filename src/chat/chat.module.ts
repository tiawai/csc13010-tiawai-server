import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ChatSession } from './entities/chat-session.entity';
import { Message } from './entities/message.entity';
import { ChatSessionService } from './services/chat-session.service';
import { MessageService } from './services/message.service';
import { ChatSessionController } from './controllers/chat-session.controller';
import { MessageController } from './controllers/message.controller';
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
