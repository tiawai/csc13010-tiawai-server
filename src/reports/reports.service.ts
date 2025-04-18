import { Injectable } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import { ReportStatus } from './entities/report.model';

@Injectable()
export class ReportsService {
    constructor(private readonly reportsRepository: ReportsRepository) {}

    async getAllReports() {
        return this.reportsRepository.findAll();
    }

    async getReportById(id: string) {
        const report = await this.reportsRepository.findById(id);
        if (!report) {
            throw new Error('Report not found');
        }
        return report;
    }

    async createReport(report: Partial<Report>) {
        return this.reportsRepository.create(report);
    }

    async deleteReport(id: string) {
        return this.reportsRepository.delete(id);
    }

    async updateReportStatus(userId: string, id: string, status: ReportStatus) {
        const report = await this.reportsRepository.findById(id);
        if (!report) {
            throw new Error('Report not found');
        }
        return await this.reportsRepository.updateReportStatus(
            userId,
            id,
            status,
        );
    }
}
