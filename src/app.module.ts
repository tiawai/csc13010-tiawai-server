import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersModule } from './users/users.module';
import pg from 'pg';
import { User } from './users/entities/user.model';
import { MailerModule } from '@nestjs-modules/mailer';
import { AuthModule } from './auth/auth.module';
import { TestsModule } from './tests/tests.module';
import { PaymentModule } from './payment/payment.module';
import { Payment } from './payment/entities/payment.model';
import { ChatModule } from './chat/chat.module';
import { ChatSession } from './chat/entities/chat-session.entity';
import { Message } from './chat/entities/message.entity';
import { FlashcardModule } from './flashcards/flashcard.module';
import { FlashcardEntity } from './flashcards/entities/flashcard.entity';
import { ClassroomModule } from './classrooms/classroom.module';
import { Classroom } from './classrooms/entities/classroom.model';
import { ClassroomRating } from './classrooms/entities/classroom-rating.model';
import { ReportsModule } from './reports/reports.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),

        MailerModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                transport: {
                    host: configService.get('MAIL_HOST'),
                    port: configService.get('MAIL_PORT'),
                    auth: {
                        user: configService.get('MAIL_USER'),
                        pass: configService.get('MAIL_PASSWORD'),
                    },
                },
                defaults: {
                    from: `"tiawai - Learning English with AI" <support@tiawai.co>`, // Sender's email address
                },
            }),
            inject: [ConfigService],
        }),

        SequelizeModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
                const isDevelopment =
                    configService.get('ENV') === 'development';

                return {
                    dialect: 'postgres',
                    host: configService.get('DATABASE'),
                    port: configService.get('DB_PORT'),
                    username: configService.get('DB_USERNAME'),
                    password: configService.get('DB_PASSWORD'),
                    database: configService.get('DB_NAME'),
                    dialectModule: pg,
                    autoLoadModels: true,
                    synchronize: true,
                    models: [
                        User,
                        Payment,
                        ChatSession,
                        Message,
                        FlashcardEntity,
                        Classroom,
                        ClassroomRating,
                    ],
                    dialectOptions: isDevelopment
                        ? { ssl: { require: true, rejectUnauthorized: false } }
                        : { ssl: false },
                };
            },
            inject: [ConfigService],
        }),
        AuthModule,
        UsersModule,
        TestsModule,
        PaymentModule,
        ChatModule,
        FlashcardModule,
        ClassroomModule,
        ReportsModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
