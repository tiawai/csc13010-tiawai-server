import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Test } from '../entities/test.model';
import { CreateTestDto } from '../dtos/create-test.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TestsRepository {
    constructor(
        @InjectModel(Test)
        private readonly testModel: typeof Test,
    ) {}

    async findAll(): Promise<Test[]> {
        try {
            const tests = await this.testModel.findAll<Test>();
            return tests.map((test) => test.dataValues) as Test[];
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async createTest(
        createTestDto: CreateTestDto,
        authorId: string,
        audioUrl?: string,
    ): Promise<Test> {
        try {
            const test = await this.testModel.create({
                id: uuidv4(),
                title: createTestDto.title,
                type: createTestDto.type,
                startDate: createTestDto.startDate,
                endDate: createTestDto.endDate,
                isGenerated: false,
                author: authorId,
                audioUrl: audioUrl || null,
                totalQuestions: createTestDto.totalQuestions || 100,
                timeLength: createTestDto.timeLength || 120,
            });

            if (!test) {
                throw new InternalServerErrorException(
                    'Error occurs when creating test',
                );
            }

            return test.dataValues as Test;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }
}
