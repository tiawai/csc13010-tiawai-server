import { Module } from '@nestjs/common';
import { TestsController } from './tests.controller';
import { TestsService } from './services/tests.service';
import { TestsRepository } from './repositories/tests.repository';
import { QuestionsService } from './services/questions.service';
import { QuestionsRepository } from './repositories/questions.repository';
import { ChoicesRepository } from './repositories/choices.repository';
import { SequelizeModule } from '@nestjs/sequelize';
import { Test } from './entities/test.model';
import { Question } from './entities/question.model';
import { Choice } from './entities/choice.model';
import { AccessControlService } from '../ac/ac.service';
import { UploadService } from '../uploader/upload.service';
@Module({
    imports: [SequelizeModule.forFeature([Test, Question, Choice])],
    controllers: [TestsController],
    providers: [
        TestsService,
        TestsRepository,
        QuestionsService,
        QuestionsRepository,
        ChoicesRepository,
        AccessControlService,
        UploadService,
    ],
    exports: [TestsService, QuestionsService],
})
export class TestsModule {}
