import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { PaymentController } from './payment.controller';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { Payment } from './entities/payment.model';
import { AccessControlModule } from '../ac/ac.module';
import { UsersModule } from '../users/users.module';
import { BankAccount } from './entities/bank-account.model';
import { ClassroomModule } from 'src/classrooms/classroom.module';

@Module({
    imports: [
        ConfigModule,
        SequelizeModule.forFeature([Payment, BankAccount]),
        AccessControlModule,
        UsersModule,
        ClassroomModule,
    ],
    controllers: [PaymentController],
    providers: [PaymentService, PaymentRepository],
    exports: [PaymentService, PaymentRepository],
})
export class PaymentModule {}
