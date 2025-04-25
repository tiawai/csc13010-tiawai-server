import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../../users/users.repository';
import { TestsRepository } from '../repositories/tests.repository';

@Injectable()
export class TestTrackingService {
    private readonly logger = new Logger(TestTrackingService.name);

    constructor(
        @InjectRedis() private readonly redisClient: Redis,
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => UsersRepository))
        private readonly usersRepository: UsersRepository,
        @Inject(forwardRef(() => TestsRepository))
        private readonly testsRepository: TestsRepository,
    ) {}

    async trackAbandonedTest(
        userId: string,
        testId: string,
        timeLeft?: number,
    ): Promise<void> {
        const key = `abandoned_test:${userId}:${testId}`;
        const data = {
            userId,
            testId,
            timestamp: Date.now(),
            timeLeft: timeLeft || null,
            notified: false,
        };

        await this.redisClient.set(key, JSON.stringify(data), 'EX', 86400);
        this.logger.log(`User ${userId} abandoned test ${testId}`);
    }

    async isUserInActiveTest(userId: string, testId: string): Promise<boolean> {
        const key = `abandoned_test:${userId}:${testId}`;
        const data = await this.redisClient.get(key);
        return !!data;
    }

    async clearAbandonedTest(userId: string, testId: string): Promise<void> {
        const key = `abandoned_test:${userId}:${testId}`;
        await this.redisClient.del(key);
        this.logger.log(`User ${userId} returned to test ${testId}`);
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async checkAbandonedTests() {
        this.logger.log('Running abandoned test check');

        const keys = await this.redisClient.keys('abandoned_test:*');

        if (keys.length === 0) {
            this.logger.log('No abandoned tests found');
            return;
        }

        this.logger.log(`Found ${keys.length} abandoned tests`);

        for (const key of keys) {
            const data = await this.redisClient.get(key);
            console.log(data);
            if (!data) continue;

            const abandonedTest = JSON.parse(data);

            // Skip if already notified
            if (abandonedTest.notified) continue;

            // Only notify if abandoned for at least 5 minutes
            const abandonedTime = Date.now() - abandonedTest.timestamp;
            console.log(abandonedTime);
            if (abandonedTime < 1 * 60 * 1000) continue; // Less than 5 minutes

            try {
                await this.sendAbandonedTestNotification(
                    abandonedTest.userId,
                    abandonedTest.testId,
                    abandonedTest.timeLeft,
                );

                // Mark as notified
                abandonedTest.notified = true;
                await this.redisClient.set(
                    key,
                    JSON.stringify(abandonedTest),
                    'KEEPTTL', // Keep the existing TTL
                );

                this.logger.log(`Notification sent for abandoned test: ${key}`);
            } catch (error) {
                this.logger.error(
                    `Failed to send notification: ${error.message}`,
                );
            }
        }
    }

    private async sendAbandonedTestNotification(
        userId: string,
        testId: string,
        timeLeft?: number,
    ): Promise<void> {
        // Get user info
        const user = await this.usersRepository.findOneById(userId);
        if (!user || !user.email) {
            throw new Error(`User ${userId} not found or has no email`);
        }

        // Get test info
        const test = await this.testsRepository.findById(testId);
        if (!test) {
            throw new Error(`Test ${testId} not found`);
        }

        const baseUrl = this.configService.get<string>('FRONTEND_URL');
        const testUrl = `${baseUrl}/tests/${testId}`;

        let timeLeftText = '';
        if (timeLeft) {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timeLeftText = `You have ${minutes} minutes and ${seconds} seconds left to complete the test.`;
        }

        await this.mailerService.sendMail({
            to: user.email,
            subject: `[support@tiawai.co] Let's continue your test: ${test.title}`,
            text: `
Hello ${user.username},

We noticed that you recently started the test "${test.title}" but didn't complete it.

${timeLeftText ? `You still have ${timeLeftText} to finish the test.` : ''}

Don't worry, your progress has been saved, and you can continue right where you left off.

You can resume your test by clicking on this link:
${testUrl}

If you're having any technical difficulties or need assistance, please contact our support team.

Best regards,
The tiawai support team

---
This is an automated message. Please do not reply to this email.
If you did not start this test, please ignore this email.
            `,
        });
    }
}
