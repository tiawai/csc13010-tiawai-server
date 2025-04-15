import { Injectable, OnModuleInit } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class AppService implements OnModuleInit {
    constructor(private readonly sequelize: Sequelize) {}

    async onModuleInit() {
        try {
            await this.sequelize.authenticate();
            console.log(
                'Database connection has been established successfully.',
            );
        } catch (error) {
            console.error('Unable to connect to the database:', error);
        }
    }

    async getStatus() {
        try {
            await this.sequelize.authenticate();
            return {
                status: 'ok',
            };
        } catch (error: any) {
            return {
                statusCode: 500,
                error: error.message,
            };
        }
    }
}
