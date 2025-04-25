import { InjectModel } from '@nestjs/sequelize';
import { Classroom } from 'src/classrooms/entities/classroom.model';
import { Test } from 'src/tests/entities/test.model';
import { User } from 'src/users/entities/user.model';
import { Report } from 'src/reports/entities/report.model';

export class StatisticsRepository {
    constructor(
        @InjectModel(User)
        private userModel: typeof User,
        @InjectModel(Test)
        private testModel: typeof Test,
        @InjectModel(Classroom)
        private classroomModel: typeof Classroom,
        @InjectModel(Report)
        private reportModel: typeof Report,
    ) {}

    async getStatistics() {
        const totalUsers = await this.userModel.count();
        const totalTests = await this.testModel.count();
        const totalReports = await this.reportModel.count();
        const totalClassrooms = await this.classroomModel.count();

        return {
            totalUsers,
            totalReports,
            totalClassrooms,
            totalTests,
        };
    }
}
