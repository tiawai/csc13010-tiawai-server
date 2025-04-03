import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { Payment } from './entities/payment.model';
import { ScheduleModule } from '@nestjs/schedule';
import { AccessControlModule } from '../ac/ac.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        ConfigModule,
        SequelizeModule.forFeature([Payment]),
        ScheduleModule.forRoot(),
        AccessControlModule,
        UsersModule,
    ],
    controllers: [PaymentController],
    providers: [PaymentService],
    exports: [PaymentService],
})
export class PaymentModule {}
