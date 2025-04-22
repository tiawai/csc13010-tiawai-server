import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { v4 as uuidv4 } from 'uuid';
import { ClassroomTests } from '../../tests/entities/classroom-tests.model';
import { Classroom } from '../entities/classroom.model';
import { Test } from 'src/tests/entities/test.model';

@Injectable()
export class ClassroomTestsRepository {
    constructor(
        @InjectModel(Test)
        private readonly testsModel: typeof Test,
        @InjectModel(Classroom)
        private readonly classroomModel: typeof Classroom,
        @InjectModel(ClassroomTests)
        private readonly ClassroomTestsModel: typeof ClassroomTests,
    ) {}

    async createClassroomTest(
        classroomId: string,
        testId: string,
    ): Promise<ClassroomTests> {
        try {
            const classroomTest = await this.ClassroomTestsModel.create({
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
            const classroomTests = await this.ClassroomTestsModel.findAll({
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

    async getAllTestsInAllClassrooms(teacherId: string): Promise<Test[]> {
        try {
            const classrooms = await this.classroomModel.findAll({
                where: { teacherId: teacherId },
                raw: true,
            });
            console.log('classrooms', classrooms);

            const classroomTests = await Promise.all(
                classrooms.map(async (classroom) => {
                    return await this.ClassroomTestsModel.findAll({
                        where: { classroomId: classroom.id },
                        raw: true,
                    });
                }),
            ).then((classroomTests) => classroomTests.flat());
            console.log('classroomTests', classroomTests);

            return await Promise.all(
                classroomTests.map(async (classroomTest) => {
                    return await this.testsModel.findOne({
                        where: { id: classroomTest.testId },
                        raw: true,
                    });
                }),
            ).then((tests) => tests.flat());
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async isPrivateTest(testId: string): Promise<boolean> {
        try {
            const classroomTest = await this.ClassroomTestsModel.findOne({
                where: { testId },
            });
            return !!classroomTest;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async removeTestFromClassroom(classroomId: string, testId: string) {
        try {
            const classroomTest = await this.ClassroomTestsModel.findOne({
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
