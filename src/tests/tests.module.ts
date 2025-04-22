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
import { ClassroomTests } from './entities/classroom-tests.model';
import { ClassroomModule } from 'src/classrooms/classroom.module';

@Module({
    imports: [
        SequelizeModule.forFeature([
            Test,
            Question,
            Choice,
            Submission,
            Answer,
        ]),
        forwardRef(() => ClassroomModule),
    ],
    controllers: [TestsController],
    providers: [
        TestsService,
        TestsRepository,
        QuestionsService,
        QuestionsRepository,
        ChoicesRepository,
        SubmissionsRepository,
        AnswerRepository,
        AccessControlService,
        UploadService,
    ],
    exports: [
        TestsService,
        TestsRepository,
        QuestionsService,
        SubmissionsRepository,
    ],
})
export class TestsModule {}
