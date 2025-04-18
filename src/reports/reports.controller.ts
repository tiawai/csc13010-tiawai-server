import {
    Body,
    Controller,
    Delete,
    Param,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ATAuthGuard } from '../auth/guards/at-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { Get } from '@nestjs/common';
import { ReportStatus } from './entities/report.model';

interface RequestWithUser extends Request {
    user: {
        id: string;
    };
}

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) {}

    @Get()
    @Roles(Role.ADMIN)
    @UseGuards(ATAuthGuard, RolesGuard)
    async getAllReports() {
        return this.reportsService.getAllReports();
    }

    @Post()
    @Roles(Role.STUDENT, Role.TEACHER)
    @UseGuards(ATAuthGuard, RolesGuard)
    async createReport(@Body() body: Partial<Report>) {
        return this.reportsService.createReport(body);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    @UseGuards(ATAuthGuard, RolesGuard)
    async deleteReport(@Body('id') id: string) {
        return this.reportsService.deleteReport(id);
    }

    @Patch('status/:id')
    @Roles(Role.ADMIN)
    @UseGuards(ATAuthGuard, RolesGuard)
    async updateReportStatus(
        @Req() req: RequestWithUser,
        @Param('id') id: string,
        @Body('status') status: ReportStatus,
    ) {
        return this.reportsService.updateReportStatus(req.user.id, id, status);
    }
}
