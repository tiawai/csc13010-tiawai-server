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
import { UpdateToeicListeningQuestionsDto } from './dtos/update-toeic-listening-questions.dto';
import { QuestionsService } from './services/questions.service';
@Controller('tests')
export class TestsController {
    constructor(
        private readonly testsService: TestsService,
        private readonly questionsService: QuestionsService,
        private readonly uploadService: UploadService,
    ) {}

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
    @Roles(Role.ADMIN)
    async createToeicListeningTest(
        @Request() req: any,
        @Param('audioUrl') audioUrl: string,
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
    @Roles(Role.ADMIN)
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
    @Roles(Role.ADMIN)
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
    async uploadImages(
        @Query('testId') testId: string,
        @UploadedFiles() files: Multer.File[],
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No images uploaded');
        }

        const imageUrls = await this.uploadService.uploadTestImages(
            files,
            testId,
        );

        return {
            message: 'Images uploaded successfully',
            imageUrls,
        };
    }

    @ApiOperation({
        summary:
            'Create questions and assign images for TOEIC listening test [ADMIN]',
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
    @Roles(Role.ADMIN)
    async createFirstPartQuestions(
        @Query('testId') testId: string,
        @Body() updateDto: UpdateToeicListeningQuestionsDto,
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
    @Roles(Role.ADMIN)
    async createSecondPartQuestions(
        @Query('testId') testId: string,
        @Body() updateDto: UpdateToeicListeningQuestionsDto,
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
    @Roles(Role.ADMIN)
    async createThirdPartQuestions(
        @Query('testId') testId: string,
        @Query('hasImages', ParseBoolPipe) hasImages: boolean,
        @Body() updateDto: UpdateToeicListeningQuestionsDto,
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
    @Roles(Role.ADMIN)
    async createFourthPartQuestions(
        @Query('testId') testId: string,
        @Query('hasImages', ParseBoolPipe) hasImages: boolean,
        @Body() updateDto: UpdateToeicListeningQuestionsDto,
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
}
