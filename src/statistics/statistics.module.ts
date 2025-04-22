import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { StatisticsRepository } from './statistics.repository';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { ScheduleModule } from '@nestjs/schedule';
import { AccessControlModule } from '../ac/ac.module';
import { User } from 'src/users/entities/user.model';
import { Test } from 'src/tests/entities/test.model';
import { Classroom } from 'src/classrooms/entities/classroom.model';
import { Report } from 'src/reports/entities/report.model';

@Module({
    imports: [
        ConfigModule,
        SequelizeModule.forFeature([User, Test, Classroom, Report]),
        ScheduleModule.forRoot(),
        AccessControlModule,
    ],
    providers: [StatisticsService, StatisticsRepository],
    controllers: [StatisticsController],
})
export class StatisticsModule {}
