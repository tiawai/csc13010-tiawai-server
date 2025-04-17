import {
    Injectable,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ClassroomStudent } from '../entities/classroom-students.model';
import { Classroom } from '../entities/classroom.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ClassroomStudentRepository {
    constructor(
        @InjectModel(ClassroomStudent)
        private classroomStudentModel: typeof ClassroomStudent,
        @InjectModel(Classroom)
        private classroomModel: typeof Classroom,
    ) {}

    async addStudentToClassroom(
        classId: string,
        studentId: string,
    ): Promise<ClassroomStudent> {
        // Check if the class exists
        const classroom = await this.classroomModel.findByPk(classId);
        if (!classroom) {
            throw new NotFoundException(
                `Classroom with ID ${classId} not found`,
            );
        }

        // Check if student is already in the classroom
        const existingEntry = await this.classroomStudentModel.findOne({
            where: {
                classId,
                userId: studentId,
            },
        });

        if (existingEntry) {
            throw new ConflictException('Student is already in this classroom');
        }

        // Create the new student-classroom relationship
        return this.classroomStudentModel.create({
            id: uuidv4(),
            classId,
            userId: studentId,
        });
    }

    async getStudentsByClassroom(classId: string): Promise<ClassroomStudent[]> {
        return this.classroomStudentModel.findAll({
            where: {
                classId,
            },
        });
    }

    async getClassroomsByStudent(
        studentId: string,
    ): Promise<ClassroomStudent[]> {
        return this.classroomStudentModel.findAll({
            where: {
                userId: studentId,
            },
        });
    }

    async removeStudentFromClassroom(
        classId: string,
        studentId: string,
    ): Promise<boolean> {
        const result = await this.classroomStudentModel.destroy({
            where: {
                classId,
                userId: studentId,
            },
        });

        return result > 0;
    }
}
