import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ClassroomController } from './controllers/classroom.controller';
import { ClassroomService } from './services/classroom.service';
import { Classroom } from './entities/classroom.model';
import { ClassroomRating } from './entities/classroom-rating.model';
import { Lesson } from './entities/lesson.model';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadModule } from '../uploader/upload.module';
import { ClassroomRepository } from './repositories/classroom.repository';
import { ClassroomRatingRepository } from './repositories/classroom-rating.repository';
import { AccessControlService } from '../ac/ac.service';

@Module({
    imports: [
        SequelizeModule.forFeature([Classroom, ClassroomRating, Lesson]),
        MulterModule.register({
            storage: memoryStorage(),
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB limit
            },
        }),
        UploadModule,
    ],
    controllers: [ClassroomController],
    providers: [
        ClassroomService,
        ClassroomRepository,
        ClassroomRatingRepository,
        AccessControlService,
    ],
    exports: [ClassroomService],
})
export class ClassroomModule {}
