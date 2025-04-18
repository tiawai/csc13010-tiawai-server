import { InjectModel } from '@nestjs/sequelize';
import { Report, ReportStatus } from './entities/report.model';
import { User } from 'src/users/entities/user.model';

export class ReportsRepository {
    constructor(
        @InjectModel(User)
        private userModel: typeof User,
        @InjectModel(Report)
        private reportModel: typeof Report,
    ) {}

    async findAll() {
        const reports = await this.reportModel.findAll({
            order: [['createdAt', 'ASC']],
        });

        return await Promise.all(
            reports.map(async (report) => {
                const plainReport = report.get({ plain: true });

                if (plainReport.manageBy) {
                    const user = await this.userModel.findOne({
                        where: { id: plainReport.manageBy },
                    });
                    return {
                        ...plainReport,
                        manageBy: {
                            username: user.dataValues.username,
                            profileImage: user.dataValues.profileImage,
                        },
                    };
                }

                return plainReport;
            }),
        );
    }

    async findById(id: string): Promise<Report | null> {
        return this.reportModel.findOne({ where: { id } });
    }

    async create(report: Partial<Report>): Promise<Report> {
        return this.reportModel.create(report);
    }

    async delete(id: string): Promise<void> {
        const report = await this.findById(id);
        if (report) {
            await report.destroy();
        }
    }

    async update(
        id: string,
        reportData: Partial<Report>,
    ): Promise<Report | null> {
        const report = await this.findById(id);
        if (report) {
            return report.update(reportData);
        }
        return null;
    }

    async updateReportStatus(userId: string, id: string, status: ReportStatus) {
        const updated = await this.reportModel.update(
            { status, manageBy: userId },
            { where: { id } },
        );
        return updated;
    }
}
