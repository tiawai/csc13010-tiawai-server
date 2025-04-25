import { Module, forwardRef } from '@nestjs/common';
import { TestsController } from './tests.controller';
import { TestsService } from './services/tests.service';
import { TestsRepository } from './repositories/tests.repository';
import { QuestionsService } from './services/questions.service';
import { QuestionsRepository } from './repositories/questions.repository';
import { ChoicesRepository } from './repositories/choices.repository';
import { SubmissionsRepository } from './repositories/submissions.repository';
import { AnswerRepository } from './repositories/answer.repository';
import { SequelizeModule } from '@nestjs/sequelize';
import { Test } from './entities/test.model';
import { Question } from './entities/question.model';
import { Choice } from './entities/choice.model';
import { Submission } from './entities/submission.model';
import { Answer } from './entities/answer.model';
import { AccessControlService } from '../ac/ac.service';
import { UploadService } from '../uploader/upload.service';
import { ClassroomModule } from 'src/classrooms/classroom.module';
import { PracticeService } from './services/practice.service';
import { MessageService } from 'src/chat/services/message.service';
import { ChatSession } from 'src/chat/entities/chat-session.entity';
import { Message } from 'src/chat/entities/message.entity';
import { VectorStoreService } from 'src/vector-store/vector-store.service';
import { TestTrackingService } from './services/test-tracking.service';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from 'src/users/users.module';

@Module({
    imports: [
        SequelizeModule.forFeature([
            Test,
            Question,
            Choice,
            Submission,
            Answer,
            ChatSession,
            Message,
        ]),
        forwardRef(() => ClassroomModule),
        forwardRef(() => UsersModule),
        ScheduleModule.forRoot(),
    ],
    controllers: [TestsController],
    providers: [
        TestsService,
        VectorStoreService,
        TestsRepository,
        QuestionsService,
        QuestionsRepository,
        ChoicesRepository,
        SubmissionsRepository,
        AnswerRepository,
        AccessControlService,
        UploadService,
        PracticeService,
        MessageService,
        TestTrackingService,
    ],
    exports: [
        TestsService,
        TestsRepository,
        QuestionsService,
        SubmissionsRepository,
        PracticeService,
        TestTrackingService,
    ],
})
export class TestsModule {}
