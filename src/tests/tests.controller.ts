import {
    Controller,
    Get,
    Post,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { TestsService } from './services/tests.service';
import { ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Test } from './entities/test.model';
import { ATAuthGuard } from '../auth/guards/at-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { CreateTestWithQuestionsDto } from './dtos/create-test-with-questions.dto';
import { CreateTestResponseDto } from './dtos/create-test.dto';

@Controller('tests')
export class TestsController {
    constructor(private readonly testsService: TestsService) {}

    @ApiOperation({ summary: 'Get all tests [ADMIN]' })
    @ApiBearerAuth('access-token')
    @Get('admin')
    @ApiResponse({
        status: 200,
        description: 'Get all tests successfully',
        type: [Test],
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async getAllTests() {
        return this.testsService.getAllTests();
    }

    @ApiOperation({ summary: 'Create a new national test [ADMIN]' })
    @ApiBearerAuth('access-token')
    @Post('admin/national-test')
    @ApiResponse({
        status: 201,
        description: 'Test created successfully',
        type: CreateTestResponseDto,
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async createTest(
        @Request() req: any,
        @Body() createTestWithQuestions: CreateTestWithQuestionsDto,
    ) {
        const test = await this.testsService.createTest(
            createTestWithQuestions.test,
            createTestWithQuestions.questions,
            req.user.id,
        );

        const result = {
            id: test.id,
            title: test.title,
            type: test.type,
            startDate: test.startDate,
            endDate: test.endDate,
        };

        return result;
    }
}
