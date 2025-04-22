import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
    InternalServerErrorException,
} from '@nestjs/common';
import { Classroom } from '../entities/classroom.model';
import { CreateClassroomDto } from '../dtos/create-classroom.dto';
import { CreateClassroomRatingDto } from '../dtos/create-classroom-rating.dto';
import { Sequelize } from 'sequelize-typescript';
import { ClassroomRepository } from '../repositories/classroom.repository';
import { ClassroomRatingRepository } from '../repositories/classroom-rating.repository';
import { ClassroomStudentRepository } from '../repositories/classroom-student.repository';
import { ClassroomStudent } from '../entities/classroom-students.model';
import { StudentInfoDto } from '../dtos/student-info.dto';
import { User } from 'src/users/entities/user.model';
import { Role } from 'src/auth/enums/roles.enum';
import { ClassroomTestsRepository } from '../repositories/classroom-test.repository';
import { Test } from 'src/tests/entities/test.model';
import { TestsRepository } from 'src/tests/repositories/tests.repository';

@Injectable()
export class ClassroomService {
    constructor(
        private readonly classroomRepository: ClassroomRepository,
        private readonly classroomRatingRepository: ClassroomRatingRepository,
        private readonly classroomStudentRepository: ClassroomStudentRepository,
        private readonly classroomTestsRepository: ClassroomTestsRepository,
        private readonly testsRepository: TestsRepository,
        private sequelize: Sequelize,
    ) {}

    async create(
        teacherId: string,
        createClassroomDto: CreateClassroomDto,
        backgroundImageUrl?: string,
    ): Promise<Classroom> {
        // Generate a 6-letter class code
        const classCode = this.generateClassCode();

        return this.classroomRepository.create(
            teacherId,
            createClassroomDto,
            classCode,
            backgroundImageUrl,
        );
    }

    async findAll(): Promise<Classroom[]> {
        return this.classroomRepository.findAll();
    }

    async findOne(id: string, user: User): Promise<Classroom> {
        if (user.role === Role.STUDENT) {
            // Check if the student is enrolled in the classroom
            const isEnrolled = await this.classroomStudentRepository.isEnrolled(
                id,
                user.id,
            );

            if (!isEnrolled) {
                throw new ForbiddenException(
                    'You do not have permission to access this classroom',
                );
            }
        }
        return this.classroomRepository.findOne(id);
    }

    async findByTeacher(teacherId: string): Promise<Classroom[]> {
        return this.classroomRepository.findByTeacher(teacherId);
    }

    async update(
        id: string,
        updateData: Partial<CreateClassroomDto>,
        backgroundImageUrl?: string,
    ): Promise<Classroom> {
        return this.classroomRepository.update(
            id,
            updateData,
            backgroundImageUrl,
        );
    }

    async remove(id: string): Promise<void> {
        return this.classroomRepository.remove(id);
    }

    async rateClassroom(
        classId: string,
        userId: string,
        createRatingDto: CreateClassroomRatingDto,
    ): Promise<{ avgRating: number }> {
        // Check if classroom exists
        const classroom = await this.classroomRepository.findOne(classId);

        if (!classroom) {
            throw new NotFoundException(
                `Classroom with ID ${classId} not found`,
            );
        }
        // Use a transaction to ensure data consistency
        const t = await this.sequelize.transaction();

        try {
            // Check if user has already rated this classroom
            const ratingRecord = await this.classroomRatingRepository.findOne(
                classId,
                userId,
                t,
            );

            if (ratingRecord) {
                // Update existing rating
                await this.classroomRatingRepository.update(
                    ratingRecord,
                    createRatingDto.rating,
                    t,
                );
            } else {
                // Create new rating
                await this.classroomRatingRepository.create(
                    classId,
                    userId,
                    createRatingDto,
                    t,
                );
            }

            // Calculate new average rating
            const ratings =
                await this.classroomRatingRepository.findAllByClassId(
                    classId,
                    t,
                );

            const avgRating =
                this.classroomRatingRepository.calculateAverageRating(ratings);

            // Update classroom's average rating
            await this.classroomRepository.updateAvgRating(
                classId,
                avgRating,
                t,
            );

            await t.commit();

            return { avgRating };
        } catch (error: any) {
            await t.rollback();
            throw new BadRequestException(error.message);
        }
    }

    private generateClassCode(): string {
        // Generate a random 6-letter code
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';

        for (let i = 0; i < 6; i++) {
            result += characters.charAt(
                Math.floor(Math.random() * characters.length),
            );
        }

        return result;
    }

    async addStudentToClassroom(
        teacherId: string,
        classId: string,
        studentId: string,
    ): Promise<ClassroomStudent> {
        // Verify the teacher owns this classroom
        const classrooms = await this.findByTeacher(teacherId);
        const isOwner = classrooms.some(
            (classroom) => classroom.id === classId,
        );

        if (!isOwner) {
            throw new ForbiddenException(
                'You do not have permission to add students to this classroom',
            );
        }

        // Add the student to the classroom
        return this.classroomStudentRepository.addStudentToClassroom(
            classId,
            studentId,
        );
    }

    async getStudentsByClassroom(
        classId: string,
        teacherId: string,
    ): Promise<StudentInfoDto[]> {
        // Verify the teacher owns this classroom
        const classrooms = await this.findByTeacher(teacherId);
        const isOwner = classrooms.some(
            (classroom) => classroom.id === classId,
        );

        if (!isOwner) {
            throw new ForbiddenException(
                'You do not have permission to view students in this classroom',
            );
        }

        return this.classroomStudentRepository.getStudentsByClassroom(classId);
    }

    async getClassroomsByStudent(studentId: string): Promise<any[]> {
        return this.classroomStudentRepository.getClassroomsByStudent(
            studentId,
        );
    }

    async removeStudentFromClassroom(
        teacherId: string,
        classId: string,
        studentId: string,
    ): Promise<boolean> {
        // Verify the teacher owns this classroom
        const classrooms = await this.findByTeacher(teacherId);
        const isOwner = classrooms.some(
            (classroom) => classroom.id === classId,
        );

        if (!isOwner) {
            throw new ForbiddenException(
                'You do not have permission to remove students from this classroom',
            );
        }

        return this.classroomStudentRepository.removeStudentFromClassroom(
            classId,
            studentId,
        );
    }

    async createClassroomTest(
        classroomId: string,
        testId: string,
    ): Promise<{ classroomId: string; testId: string }> {
        const classroomTest =
            await this.classroomTestsRepository.createClassroomTest(
                classroomId,
                testId,
            );

        if (!classroomTest) {
            throw new InternalServerErrorException(
                'Error occurs when creating classroom test',
            );
        }

        return {
            classroomId: classroomTest.classroomId,
            testId: classroomTest.testId,
        };
    }

    async getAllTestsInAllClassrooms(teacherId: string): Promise<Test[]> {
        return await this.classroomTestsRepository.getAllTestsInAllClassrooms(
            teacherId,
        );
    }

    async getTestsByClassroomId(
        classroomId: string,
        user: User,
    ): Promise<Test[]> {
        if (user.role === Role.STUDENT) {
            const isEnrolled = await this.classroomStudentRepository.isEnrolled(
                classroomId,
                user.id,
            );

            if (!isEnrolled) {
                throw new ForbiddenException(
                    'You do not have permission to access this classroom',
                );
            }
        }

        const tests =
            await this.classroomTestsRepository.findByClassroomId(classroomId);

        if (!tests) {
            throw new NotFoundException('No tests found');
        }

        const testPromises = tests.map(async (test) => {
            const testData = await this.testsRepository.findById(test.testId);
            return testData;
        });

        return await Promise.all(testPromises);
    }

    async removeTestFromClassroom(
        teacherId: string,
        classId: string,
        testId: string,
    ) {
        const classrooms = await this.findByTeacher(teacherId);
        const isOwner = classrooms.some(
            (classroom) => classroom.id === classId,
        );

        if (!isOwner) {
            throw new ForbiddenException(
                'You do not have permission to remove tests from this classroom',
            );
        }

        return this.classroomTestsRepository.removeTestFromClassroom(
            classId,
            testId,
        );
    }
}
