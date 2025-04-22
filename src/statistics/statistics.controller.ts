import { Controller, Get } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { ATAuthGuard } from '../auth/guards/at-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { UseGuards } from '@nestjs/common';

@Controller('statistics')
export class StatisticsController {
    constructor(private readonly statisticsService: StatisticsService) {}

    @Get()
    @Roles(Role.ADMIN)
    @UseGuards(ATAuthGuard, RolesGuard)
    async getStatistics() {
        return this.statisticsService.getStatistics();
    }
}
