import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { v4 as uuidv4 } from 'uuid';
import { ClassroomTests } from '../../tests/entities/classroom-tests.model';

@Injectable()
export class ClassroomTestsRepository {
    constructor(
        @InjectModel(ClassroomTests)
        private readonly choiceModel: typeof ClassroomTests,
    ) {}

    async createClassroomTest(
        classroomId: string,
        testId: string,
    ): Promise<ClassroomTests> {
        try {
            const classroomTest = await this.choiceModel.create({
                id: uuidv4(),
                classroomId: classroomId,
                testId: testId,
            });

            if (!classroomTest) {
                throw new InternalServerErrorException(
                    'Error occurs when creating classroom test',
                );
            }

            return classroomTest.dataValues as ClassroomTests;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async findByClassroomId(classroomId: string): Promise<ClassroomTests[]> {
        try {
            const classroomTests = await this.choiceModel.findAll({
                where: { classroomId },
            });

            if (!classroomTests) {
                throw new InternalServerErrorException(
                    'Error occurs when finding classroom test',
                );
            }

            return classroomTests.map((classroomTest) => {
                return classroomTest.dataValues as ClassroomTests;
            });
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async isPrivateTest(testId: string): Promise<boolean> {
        try {
            const classroomTest = await this.choiceModel.findOne({
                where: { testId },
            });
            return !!classroomTest;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async removeTestFromClassroom(classroomId: string, testId: string) {
        try {
            const classroomTest = await this.choiceModel.findOne({
                where: {
                    classroomId: classroomId,
                    testId: testId,
                },
            });

            if (!classroomTest) {
                throw new InternalServerErrorException(
                    'Classroom test not found',
                );
            }

            await classroomTest.destroy();
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }
}
