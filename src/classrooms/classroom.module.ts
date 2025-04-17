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
import { ClassroomStudentRepository } from './repositories/classroom-student.repository';
import { AccessControlService } from '../ac/ac.service';
import { LessonController } from './controllers/lesson.controller';
import { LessonService } from './services/lesson.service';
import { LessonRepository } from './repositories/lesson.repository';
import { ClassroomStudent } from './entities/classroom-students.model';
@Module({
    imports: [
        SequelizeModule.forFeature([
            Classroom,
            ClassroomRating,
            ClassroomStudent,
            Lesson,
        ]),
        MulterModule.register({
            storage: memoryStorage(),
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB limit
            },
        }),
        UploadModule,
    ],
    controllers: [ClassroomController, LessonController],
    providers: [
        ClassroomService,
        ClassroomRepository,
        ClassroomRatingRepository,
        ClassroomStudentRepository,
        LessonService,
        LessonRepository,
        AccessControlService,
    ],
    exports: [ClassroomService, LessonService],
})
export class ClassroomModule {}
