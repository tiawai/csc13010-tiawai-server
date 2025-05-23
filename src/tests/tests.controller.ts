import {
    Controller,
    Get,
    Post,
    Body,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFiles,
    Param,
    UploadedFile,
    Query,
    ParseBoolPipe,
    BadRequestException,
    HttpCode,
    ValidationPipe,
    Delete,
} from '@nestjs/common';
import { TestsService } from './services/tests.service';
import { UploadService } from '../uploader/upload.service';
import { CreateTestDto } from './dtos/create-test.dto';
import {
    ApiOperation,
    ApiBearerAuth,
    ApiResponse,
    ApiConsumes,
    ApiBody,
    ApiQuery,
} from '@nestjs/swagger';
import { Test } from './entities/test.model';
import { ATAuthGuard } from '../auth/guards/at-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { CreateNationalTestWithQuestionsDto } from './dtos/create-national-test-with-questions.dto';
import { CreateTestResponseDto } from './dtos/create-test.dto';
import { TestType } from './enums/test-type.enum';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Multer } from 'multer';
import { UpdateToeicQuestionsDto } from './dtos/update-toeic-questions.dto';
import { QuestionsService } from './services/questions.service';
import { AnswerSheetDto } from './dtos/create-answer.dto';
import { PracticeService } from './services/practice.service';
import { CategoryDto } from './dtos/category.dto';
import { CreateQuestionDto } from './dtos/create-question.dto';
import { TestTrackingService } from './services/test-tracking.service';
import { TestRankingResponseDto } from './dtos/test-ranking.dto';
@Controller('tests')
export class TestsController {
    constructor(
        private readonly testsService: TestsService,
        private readonly questionsService: QuestionsService,
        private readonly uploadService: UploadService,
        private readonly practiceService: PracticeService,
        private readonly testTrackingService: TestTrackingService,
    ) {}

    @ApiOperation({ summary: 'Get explanation for test [STUDENT]' })
    @ApiBearerAuth('access-token')
    @Get('test/:id/explanation/:order')
    @ApiResponse({
        status: 200,
        description: 'Explanation retrieved successfully',
        type: Test,
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.STUDENT)
    async getExplanationForTest(
        @Param('id') id: string,
        @Param('order') order: number,
    ) {
        return this.testsService.getExplanationForTest(id, order);
    }

    @ApiOperation({ summary: 'Get all tests [ADMIN]' })
    @ApiBearerAuth('access-token')
    @Get('admin')
    @ApiResponse({
        status: 200,
        description: 'Get all tests successfully',
        type: [Test],
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.TEACHER, Role.ADMIN)
    async getAllTests() {
        return this.testsService.getAllTests();
    }

    @ApiOperation({ summary: 'Get test submissions by user ID [STUDENT]' })
    @ApiBearerAuth('access-token')
    @Get('test/:id/submission')
    @ApiResponse({
        status: 200,
        description: 'Test submissions retrieved successfully',
        type: [Test],
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.STUDENT)
    async getTestSubmissionsByUserId(
        @Request() req: any,
        @Param('id') id: string,
    ) {
        return this.testsService.getTestSubmissionsByUserId(id, req.user.id);
    }

    @ApiOperation({
        summary: 'Get test submission details by submission ID [STUDENT]',
    })
    @ApiBearerAuth('access-token')
    @Get('test/:id/submission/:submissionId')
    @ApiResponse({
        status: 200,
        description: 'Test submissions retrieved successfully',
        type: [Test],
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.STUDENT)
    async getSubmissionResult(
        @Param('id') id: string,
        @Param('submissionId') submissionId: string,
    ) {
        return this.testsService.getSubmissionResult(id, submissionId);
    }

    @ApiOperation({ summary: 'Submit a test by ID [STUDENT]' })
    @ApiBearerAuth('access-token')
    @Post('test/:id/submission')
    @ApiResponse({
        status: 200,
        description: 'Test submitted successfully',
    })
    @ApiBody({
        type: AnswerSheetDto,
        examples: {
            example1: {
                value: {
                    timeConsumed: 2850,
                    answers: [
                        { questionOrder: 1, answer: 'A' },
                        { questionOrder: 2, answer: 'C' },
                        { questionOrder: 3, answer: 'B' },
                        { questionOrder: 4, answer: 'D' },
                        { questionOrder: 5, answer: 'A' },
                        { questionOrder: 6, answer: 'B' },
                        { questionOrder: 7, answer: 'C' },
                        { questionOrder: 8, answer: 'A' },
                        { questionOrder: 9, answer: 'D' },
                        { questionOrder: 10, answer: 'B' },
                    ],
                },
            },
        },
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.STUDENT)
    async submitTest(
        @Request() req: any,
        @Param('id') id: string,
        @Body() body: AnswerSheetDto,
    ) {
        return this.testsService.submitTest(id, req.user.id, body);
    }

    @ApiOperation({ summary: 'Get test by id [ADMIN]' })
    @ApiBearerAuth('access-token')
    @Get('test/:id')
    @ApiResponse({
        status: 200,
        description: 'Test retrieved successfully',
        type: Test,
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.STUDENT)
    async getTestById(@Param('id') id: string) {
        return this.testsService.getTestById(id);
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
    @Roles(Role.TEACHER, Role.ADMIN)
    async createTest(
        @Request() req: any,
        @Body()
        createNationalTestWithQuestions: CreateNationalTestWithQuestionsDto,
    ) {
        createNationalTestWithQuestions.test.type = TestType.NATIONAL_TEST;
        const test = await this.testsService.createNationalTest(
            createNationalTestWithQuestions.test,
            createNationalTestWithQuestions.questions,
            req.user.id,
        );

        const result = {
            id: test.id,
            title: test.title,
            type: test.type,
            startDate: test.startDate,
            endDate: test.endDate,
            totalQuestions: test.totalQuestions,
            timeLength: test.timeLength,
        };

        return result;
    }

    @ApiOperation({ summary: 'Create a new TOEIC listening test [ADMIN]' })
    @ApiBearerAuth('access-token')
    @Post('admin/toeic-listening-test')
    @ApiResponse({
        status: 201,
        description: 'Test created successfully',
        type: CreateTestResponseDto,
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.TEACHER, Role.ADMIN)
    async createToeicListeningTest(
        @Request() req: any,
        @Query('audioUrl') audioUrl: string,
        @Body()
        createTestDto: CreateTestDto,
    ) {
        createTestDto.type = TestType.TOEIC_LISTENING;
        const test = await this.testsService.createToeicListeningTest(
            createTestDto,
            req.user.id,
            audioUrl,
        );

        const result = {
            id: test.id,
            title: test.title,
            type: test.type,
            startDate: test.startDate,
            endDate: test.endDate,
            totalQuestions: test.totalQuestions,
            timeLength: test.timeLength,
        };

        return result;
    }

    @ApiOperation({ summary: 'Upload audio for TOEIC listening test [ADMIN]' })
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                audio: {
                    type: 'string',
                    format: 'binary',
                    description: 'Audio file (MP3, WAV, OGG)',
                },
            },
            required: ['audio'],
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Audio uploaded successfully',
        schema: {
            type: 'object',
            properties: {
                audioUrl: { type: 'string' },
                message: { type: 'string' },
            },
        },
    })
    @Post('admin/toeic-listening-test/audio')
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.TEACHER, Role.ADMIN)
    @UseInterceptors(FileInterceptor('audio'))
    async uploadAudio(@UploadedFile() file: Multer.File) {
        const audioUrl = await this.uploadService.uploadAudio(file);
        return {
            audioUrl: audioUrl,
            message: 'Audio uploaded successfully',
        };
    }

    @ApiOperation({ summary: 'Upload images for TOEIC listening test [ADMIN]' })
    @ApiBearerAuth('access-token')
    @Post('admin/toeic-listening-test/images')
    @ApiQuery({
        name: 'testId',
        required: true,
        description: 'ID of the TOEIC listening test',
        type: String,
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                images: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                    description:
                        'Array of image files (supports .jpg, .jpeg, .png)',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Images uploaded successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                imageUrls: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of uploaded image URLs',
                },
            },
        },
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.TEACHER, Role.ADMIN)
    @UseInterceptors(
        FilesInterceptor('images', 20, {
            fileFilter: (req, file, cb) => {
                if (!file.mimetype.match(/^image\/(jpg|jpeg|png)$/)) {
                    cb(
                        new BadRequestException(
                            'Only .jpg, .jpeg, and .png files are allowed',
                        ),
                        false,
                    );
                }
                cb(null, true);
            },
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
            },
        }),
    )
    async uploadImagesForToeicListeningTest(
        @Query('testId') testId: string,
        @UploadedFiles() files: Multer.File[],
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No images uploaded');
        }

        const imageUrls = await this.uploadService.uploadTestImages(
            files,
            testId,
            'toeic-listening-test',
        );

        return {
            message: 'Images uploaded successfully',
            imageUrls,
        };
    }

    @ApiOperation({
        summary: 'Create questions part 1 for TOEIC listening test [ADMIN]',
    })
    @ApiBearerAuth('access-token')
    @Post('admin/toeic-listening-test/part-1')
    @ApiQuery({
        name: 'testId',
        required: true,
        description: 'ID of the TOEIC listening test',
        type: String,
    })
    @ApiResponse({
        status: 201,
        description: 'Questions part 1 created successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                questions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            questionOrder: { type: 'number' },
                            images: {
                                type: 'array',
                                items: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.TEACHER, Role.ADMIN)
    async createFirstPartQuestions(
        @Query('testId') testId: string,
        @Body() updateDto: UpdateToeicQuestionsDto,
    ) {
        const questions = await this.questionsService.createFirstPartQuestions(
            testId,
            100,
            updateDto.questions,
            updateDto.imageUrls,
        );

        return {
            message: 'Questions created successfully',
            questions: questions.map((q) => ({
                id: q.id,
                questionOrder: q.questionOrder,
                images: q.images,
                content: q.content,
                choices: q.choices,
            })),
        };
    }

    @ApiOperation({
        summary: 'Create questions part 2 for TOEIC listening test [ADMIN]',
    })
    @ApiBearerAuth('access-token')
    @Post('admin/toeic-listening-test/part-2')
    @ApiQuery({
        name: 'testId',
        required: true,
        description: 'ID of the TOEIC listening test',
        type: String,
    })
    @ApiResponse({
        status: 201,
        description: 'Questions part 2 created successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                questions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            questionOrder: { type: 'number' },
                        },
                    },
                },
            },
        },
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.TEACHER, Role.ADMIN)
    async createSecondPartQuestions(
        @Query('testId') testId: string,
        @Body() updateDto: UpdateToeicQuestionsDto,
    ) {
        const questions = await this.questionsService.createSecondPartQuestions(
            testId,
            100,
            updateDto.questions,
        );

        return {
            message: 'Questions created successfully',
            questions: questions.map((q) => ({
                id: q.id,
                questionOrder: q.questionOrder,
                images: q.images,
                content: q.content,
                choices: q.choices,
            })),
        };
    }

    @ApiOperation({
        summary: 'Create questions part 3 for TOEIC listening test [ADMIN]',
    })
    @ApiBearerAuth('access-token')
    @Post('admin/toeic-listening-test/part-3')
    @ApiQuery({
        name: 'testId',
        required: true,
        description: 'ID of the TOEIC listening test',
        type: String,
    })
    @ApiQuery({
        name: 'hasImages',
        required: true,
        description: 'Flag to indicate if questions have images',
        type: Boolean,
    })
    @ApiResponse({
        status: 201,
        description: 'Questions part 3 created successfully',
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.TEACHER, Role.ADMIN)
    async createThirdPartQuestions(
        @Query('testId') testId: string,
        @Query('hasImages', ParseBoolPipe) hasImages: boolean,
        @Body() updateDto: UpdateToeicQuestionsDto,
    ) {
        const questions = hasImages
            ? await this.questionsService.createVisualThirdPartQuestions(
                  testId,
                  100,
                  updateDto.questions,
                  updateDto.imageUrls,
                  updateDto.batch,
              )
            : await this.questionsService.createTextThirdPartQuestions(
                  testId,
                  100,
                  updateDto.questions,
              );

        return {
            message: 'Questions created successfully',
            questions: questions.map((q) => ({
                id: q.id,
                questionOrder: q.questionOrder,
                images: q.images,
                content: q.content,
                choices: q.choices,
            })),
        };
    }

    @ApiOperation({
        summary: 'Create questions part 4 for TOEIC listening test [ADMIN]',
    })
    @ApiBearerAuth('access-token')
    @Post('admin/toeic-listening-test/part-4')
    @ApiQuery({
        name: 'testId',
        required: true,
        description: 'ID of the TOEIC listening test',
        type: String,
    })
    @ApiQuery({
        name: 'hasImages',
        required: true,
        description: 'Flag to indicate if questions have images',
        type: Boolean,
    })
    @ApiResponse({
        status: 201,
        description: 'Questions part 4 created successfully',
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.TEACHER, Role.ADMIN)
    async createFourthPartQuestions(
        @Query('testId') testId: string,
        @Query('hasImages', ParseBoolPipe) hasImages: boolean,
        @Body() updateDto: UpdateToeicQuestionsDto,
    ) {
        const questions = hasImages
            ? await this.questionsService.createVisualFourthPartQuestions(
                  testId,
                  100,
                  updateDto.questions,
                  updateDto.imageUrls,
                  updateDto.batch,
              )
            : await this.questionsService.createTextFourthPartQuestions(
                  testId,
                  100,
                  updateDto.questions,
              );

        return {
            message: 'Questions created successfully',
            questions: questions.map((q) => ({
                questionOrder: q.questionOrder,
                images: q.images,
                content: q.content,
                choices: q.choices,
            })),
        };
    }

    @ApiOperation({
        summary: 'Create a new TOEIC reading test [ADMIN]',
    })
    @ApiBearerAuth('access-token')
    @Post('admin/toeic-reading-test')
    @ApiResponse({
        status: 201,
        description: 'TOEIC reading test created successfully',
        type: CreateTestResponseDto,
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.TEACHER, Role.ADMIN)
    async createToeicReadingTest(
        @Request() req: any,
        @Body() createTestDto: CreateTestDto,
    ) {
        createTestDto.type = TestType.TOEIC_READING;
        const test = await this.testsService.createToeicReadingTest(
            createTestDto,
            req.user.id,
        );

        const result = {
            id: test.id,
            title: test.title,
            type: test.type,
            startDate: test.startDate,
            endDate: test.endDate,
            totalQuestions: test.totalQuestions,
            timeLength: test.timeLength,
        };

        return result;
    }

    @ApiOperation({
        summary: 'Upload images for TOEIC reading test [ADMIN]',
    })
    @ApiBearerAuth('access-token')
    @Post('admin/toeic-reading-test/images')
    @ApiQuery({
        name: 'testId',
        required: true,
        description: 'ID of the TOEIC reading test',
        type: String,
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                images: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                    description:
                        'Array of image files (supports .jpg, .jpeg, .png)',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Images uploaded successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                imageUrls: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of uploaded image URLs',
                },
            },
        },
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.TEACHER, Role.ADMIN)
    @UseInterceptors(
        FilesInterceptor('images', 20, {
            fileFilter: (req, file, cb) => {
                if (!file.mimetype.match(/^image\/(jpg|jpeg|png)$/)) {
                    cb(
                        new BadRequestException(
                            'Only .jpg, .jpeg, and .png files are allowed',
                        ),
                        false,
                    );
                }
                cb(null, true);
            },
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
            },
        }),
    )
    async uploadImagesForToeicReadingTest(
        @Query('testId') testId: string,
        @UploadedFiles() files: Multer.File[],
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No images uploaded');
        }

        const imageUrls = await this.uploadService.uploadTestImages(
            files,
            testId,
            'toeic-reading-test',
        );

        return {
            message: 'Images uploaded successfully',
            imageUrls,
        };
    }

    @ApiOperation({
        summary: 'Create questions part 1 for TOEIC reading test [ADMIN]',
    })
    @ApiBearerAuth('access-token')
    @Post('admin/toeic-reading-test/part-1')
    @ApiQuery({
        name: 'testId',
        required: true,
        description: 'ID of the TOEIC reading test',
        type: String,
    })
    @ApiResponse({
        status: 201,
        description: 'Questions part 1 created successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                questions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            questionOrder: { type: 'number' },
                            images: {
                                type: 'array',
                                items: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.TEACHER, Role.ADMIN)
    async createFirstPartQuestionsForToeicReadingTest(
        @Query('testId') testId: string,
        @Body() updateDto: UpdateToeicQuestionsDto,
    ) {
        const questions =
            await this.questionsService.createFirstPartQuestionsForToeicReadingTest(
                testId,
                100,
                updateDto.questions,
            );

        return {
            message: 'Questions created successfully',
            questions: questions.map((q) => ({
                id: q.id,
                questionOrder: q.questionOrder,
                images: q.images,
                content: q.content,
                choices: q.choices,
            })),
        };
    }

    @ApiOperation({
        summary: 'Create questions part 2 for TOEIC reading test [ADMIN]',
    })
    @ApiBearerAuth('access-token')
    @Post('admin/toeic-reading-test/part-2')
    @ApiQuery({
        name: 'testId',
        required: true,
        description: 'ID of the TOEIC reading test',
        type: String,
    })
    @ApiQuery({
        name: 'hasImages',
        required: true,
        description: 'Flag to indicate if questions have images',
        type: Boolean,
    })
    @ApiResponse({
        status: 201,
        description: 'Questions part 2 created successfully',
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.TEACHER, Role.ADMIN)
    async createSecondPartQuestionsForToeicReadingTest(
        @Query('testId') testId: string,
        @Query('hasImages', ParseBoolPipe) hasImages: boolean,
        @Body() updateDto: UpdateToeicQuestionsDto,
    ) {
        const questions = hasImages
            ? await this.questionsService.createVisualSecondPartQuestionsForToeicReadingTest(
                  testId,
                  100,
                  updateDto.questions,
                  updateDto.imageUrls,
                  updateDto.batch,
              )
            : await this.questionsService.createTextSecondPartQuestionsForToeicReadingTest(
                  testId,
                  100,
                  updateDto.questions,
              );

        return {
            message: 'Questions created successfully',
            questions: questions.map((q) => ({
                questionOrder: q.questionOrder,
                images: q.images,
                content: q.content,
                choices: q.choices,
            })),
        };
    }

    @ApiOperation({
        summary: 'Create questions part 3 for TOEIC reading test [ADMIN]',
    })
    @ApiBearerAuth('access-token')
    @Post('admin/toeic-reading-test/part-3')
    @ApiQuery({
        name: 'testId',
        required: true,
        description: 'ID of the TOEIC reading test',
        type: String,
    })
    @ApiQuery({
        name: 'hasImages',
        required: true,
        description: 'Flag to indicate if questions have images',
        type: Boolean,
    })
    @ApiResponse({
        status: 201,
        description: 'Questions part 2 created successfully',
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.TEACHER, Role.ADMIN)
    async createThirdPartQuestionsForToeicReadingTest(
        @Query('testId') testId: string,
        @Query('hasImages', ParseBoolPipe) hasImages: boolean,
        @Body() updateDto: UpdateToeicQuestionsDto,
    ) {
        const questions = hasImages
            ? await this.questionsService.createVisualThirdPartQuestionsForToeicReadingTest(
                  testId,
                  100,
                  updateDto.questions,
                  updateDto.imageUrls,
                  updateDto.batch,
              )
            : await this.questionsService.createTextThirdPartQuestionsForToeicReadingTest(
                  testId,
                  100,
                  updateDto.questions,
              );

        return {
            message: 'Questions created successfully',
            questions: questions.map((q) => ({
                questionOrder: q.questionOrder,
                images: q.images,
                content: q.content,
                choices: q.choices,
            })),
        };
    }

    @ApiOperation({ summary: 'Get tests by type [ANYONE]' })
    @Get()
    @ApiQuery({
        name: 'type',
        required: true,
        description: 'Type of test to filter by',
        enum: TestType,
        enumName: 'TestType',
    })
    @ApiResponse({
        status: 200,
        description: 'Tests retrieved successfully',
        type: [Test],
    })
    async getTestsByType(@Query('type') type: TestType) {
        return this.testsService.getTestsByType(type);
    }

    @ApiOperation({ summary: 'Generate practice questions [TEACHER]' })
    @ApiResponse({
        status: 200,
        description: 'Practice questions generated successfully',
        type: Test,
    })
    @HttpCode(200)
    @UseGuards(ATAuthGuard, RolesGuard)
    @ApiBearerAuth('access-token')
    @Roles(Role.TEACHER)
    @Post('practice-test')
    async generatePracticeQuestions(
        @Request() req: any,
        @Query(new ValidationPipe()) query: CategoryDto,
    ): Promise<CreateQuestionDto[]> {
        return await this.practiceService.generatePracticeQuestions(
            req.user,
            query.category,
        );
    }

    @ApiOperation({ summary: 'Track abandoned test' })
    @ApiBearerAuth('access-token')
    @Post('test/:id/abandoned')
    @ApiResponse({
        status: 200,
        description: 'Test abandonment tracked successfully',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
            },
        },
    })
    @UseGuards(ATAuthGuard)
    async trackAbandonedTest(
        @Request() req: any,
        @Param('id') testId: string,
        @Body() body: { timeLeft?: number },
    ) {
        await this.testTrackingService.trackAbandonedTest(
            req.user.id,
            testId,
            body.timeLeft,
        );

        return {
            success: true,
            message:
                'Abandonment tracked successfully. You will receive a reminder email.',
        };
    }

    @ApiOperation({ summary: 'Clear abandoned test status' })
    @ApiBearerAuth('access-token')
    @Delete('test/:id/abandoned')
    @ApiResponse({
        status: 200,
        description: 'Test abandonment status cleared successfully',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
            },
        },
    })
    @UseGuards(ATAuthGuard)
    async clearAbandonedTest(@Request() req: any, @Param('id') testId: string) {
        await this.testTrackingService.clearAbandonedTest(req.user.id, testId);

        return {
            success: true,
            message: 'Abandonment status cleared successfully.',
        };
    }

    @ApiOperation({
        summary: 'Get rankings for a test [ADMIN, TEACHER, STUDENT]',
    })
    @ApiBearerAuth('access-token')
    @Get('test/:id/rankings')
    @ApiResponse({
        status: 200,
        description: 'Test rankings retrieved successfully',
        type: TestRankingResponseDto,
    })
    @UseGuards(ATAuthGuard)
    async getTestRankings(
        @Param('id') id: string,
    ): Promise<TestRankingResponseDto> {
        return this.testsService.getTestRankings(id);
    }
}
