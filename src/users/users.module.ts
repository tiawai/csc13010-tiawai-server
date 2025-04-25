import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersController } from './users.controller';
import { AccessControlService } from '../ac/ac.service';
import { UsersRepository } from './users.repository';
import { UploadService } from '../uploader/upload.service';
import { TestsModule } from 'src/tests/tests.module';
@Module({
    imports: [SequelizeModule.forFeature([User]), TestsModule],
    controllers: [UsersController],
    providers: [
        UsersService,
        UsersRepository,
        AccessControlService,
        UploadService,
    ],
    exports: [UsersService, UsersRepository],
})
export class UsersModule {}
