import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Patch,
    Delete,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFiles,
    Query,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBearerAuth,
    ApiConsumes,
    ApiBody,
    ApiQuery,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { LessonService } from '../services/lesson.service';
import { CreateLessonDto } from '../dtos/create-lesson.dto';
import { Lesson } from '../entities/lesson.model';
import { ATAuthGuard } from '../../auth/guards/at-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/roles.enum';

@ApiTags('Lessons')
@Controller('lessons')
@UseGuards(ATAuthGuard)
@ApiBearerAuth('access-token')
export class LessonController {
    constructor(private readonly lessonService: LessonService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new lesson [TEACHER]' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            required: ['title', 'content', 'classId'],
            properties: {
                title: {
                    type: 'string',
                    example: 'Introduction to Grammar',
                },
                content: {
                    type: 'string',
                    example:
                        '<h1>Lesson Content</h1><p>This is some <strong>HTML</strong> content</p>',
                },
                classId: {
                    type: 'string',
                    example: '550e8400-e29b-41d4-a716-446655440000',
                },
                files: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                    description: 'Lesson attachment files (.pdf, .pptx)',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'The lesson has been successfully created',
        type: Lesson,
    })
    @UseGuards(RolesGuard)
    @Roles(Role.TEACHER)
    @UseInterceptors(FilesInterceptor('files', 10)) // Allow up to 10 files
    async create(
        @Request() req,
        @Body() createLessonDto: CreateLessonDto,
        @UploadedFiles() files,
    ) {
        return this.lessonService.create(
            req.user.id,
            createLessonDto,
            files || [],
        );
    }

    @Get()
    @ApiOperation({ summary: 'Get all lessons [TEACHER, STUDENT, ADMIN]' })
    @ApiQuery({
        name: 'classId',
        required: false,
        description: 'Filter lessons by classroom ID',
    })
    @ApiResponse({
        status: 200,
        description: 'Return all lessons, optionally filtered by classroom',
        type: [Lesson],
    })
    findAll(@Query('classId') classId: string) {
        return this.lessonService.findAll(classId);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get a lesson by ID [TEACHER, STUDENT, ADMIN]',
    })
    @ApiParam({ name: 'id', description: 'Lesson ID' })
    @ApiResponse({
        status: 200,
        description: 'Return the lesson',
        type: Lesson,
    })
    @ApiResponse({
        status: 404,
        description: 'Lesson not found',
    })
    findOne(@Param('id') id: string) {
        return this.lessonService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a lesson [TEACHER]' })
    @ApiParam({ name: 'id', description: 'Lesson ID' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                title: {
                    type: 'string',
                    example: 'Updated Lesson Title',
                },
                content: {
                    type: 'string',
                    example:
                        '<h1>Updated Content</h1><p>With <em>formatting</em></p>',
                },
                files: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                    description: 'Lesson attachment files (.pdf, .pptx)',
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'The lesson has been successfully updated',
        type: Lesson,
    })
    @ApiResponse({
        status: 404,
        description: 'Lesson not found',
    })
    @UseGuards(RolesGuard)
    @Roles(Role.TEACHER)
    @UseInterceptors(FilesInterceptor('files', 10)) // Allow up to 10 files
    async update(
        @Param('id') id: string,
        @Body() updateLessonDto: Partial<CreateLessonDto>,
        @UploadedFiles() files,
        @Request() req,
    ) {
        return this.lessonService.update(
            req.user.id,
            id,
            updateLessonDto,
            files || undefined,
        );
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a lesson [TEACHER]' })
    @ApiParam({ name: 'id', description: 'Lesson ID' })
    @ApiResponse({
        status: 200,
        description: 'The lesson has been successfully deleted',
    })
    @ApiResponse({
        status: 404,
        description: 'Lesson not found',
    })
    @UseGuards(RolesGuard)
    @Roles(Role.TEACHER)
    async remove(@Param('id') id: string, @Request() req) {
        const isDeleted = await this.lessonService.remove(req.user.id, id);
        if (isDeleted) {
            return { message: 'Lesson deleted successfully' };
        }
    }
}
