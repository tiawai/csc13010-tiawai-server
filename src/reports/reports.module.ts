import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { ScheduleModule } from '@nestjs/schedule';
import { AccessControlModule } from '../ac/ac.module';
import { UsersModule } from '../users/users.module';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './reports.repository';
import { ReportsController } from './reports.controller';
import { Report } from './entities/report.model';
import { User } from 'src/users/entities/user.model';

@Module({
    imports: [
        ConfigModule,
        SequelizeModule.forFeature([User, Report]),
        ScheduleModule.forRoot(),
        AccessControlModule,
        UsersModule,
    ],
    controllers: [ReportsController],
    providers: [ReportsService, ReportsRepository],
    exports: [ReportsService, ReportsRepository],
})
export class ReportsModule {}
