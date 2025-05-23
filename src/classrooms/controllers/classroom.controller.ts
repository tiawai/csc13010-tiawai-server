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
    UploadedFile,
    ForbiddenException,
    NotFoundException,
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
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClassroomService } from '../services/classroom.service';
import { CreateClassroomDto } from '../dtos/create-classroom.dto';
import { CreateClassroomRatingDto } from '../dtos/create-classroom-rating.dto';
import { Classroom } from '../entities/classroom.model';
import { ATAuthGuard } from '../../auth/guards/at-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/roles.enum';
import { UploadService } from '../../uploader/upload.service';
import { AddStudentDto } from '../dtos/add-student.dto';
import { ClassroomStudent } from '../entities/classroom-students.model';
import { StudentInfoDto } from '../dtos/student-info.dto';
import {
    CreateTestDto,
    CreateTestResponseDto,
} from 'src/tests/dtos/create-test.dto';
import { TestType } from 'src/tests/enums/test-type.enum';
import { TestsService } from 'src/tests/services/tests.service';
import { CreateNationalTestWithQuestionsDto } from 'src/tests/dtos/create-national-test-with-questions.dto';
import { Test } from 'src/tests/entities/test.model';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('Classrooms')
@Controller('classrooms')
@UseGuards(ATAuthGuard)
@ApiBearerAuth('access-token')
export class ClassroomController {
    constructor(
        private readonly classroomService: ClassroomService,
        private readonly uploadService: UploadService,
        private readonly testsService: TestsService,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Create a new classroom [TEACHER]' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            required: ['className', 'maxStudent', 'description'],
            properties: {
                className: {
                    type: 'string',
                    example: 'Advanced English Grammar',
                },
                maxStudent: { type: 'number', example: 30 },
                price: { type: 'number', example: 199000 },
                description: {
                    type: 'string',
                    example:
                        'Learn advanced English grammar with experienced teachers',
                },
                image: {
                    type: 'string',
                    format: 'binary',
                    description: 'Classroom background image',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'The classroom has been successfully created',
        type: Classroom,
    })
    @UseGuards(RolesGuard)
    @Roles(Role.TEACHER)
    @UseInterceptors(FileInterceptor('image'))
    async create(
        @Request() req,
        @Body() createClassroomDto: CreateClassroomDto,
        @UploadedFile() file,
    ) {
        let backgroundImageUrl;
        if (file) {
            // Use the uploadService to upload the file
            backgroundImageUrl = await this.uploadService.uploadFile(
                file,
                'classrooms',
            );
        }

        return this.classroomService.create(
            req.user.id,
            createClassroomDto,
            backgroundImageUrl,
        );
    }

    @Get('top-rated')
    @Public()
    @ApiOperation({ summary: 'Get top 3 highest rated classrooms [PUBLIC]' })
    @ApiResponse({
        status: 200,
        description: 'Return top 3 highest rated classrooms',
        type: [Classroom],
    })
    async getTopRatedClassrooms() {
        return this.classroomService.getTopRatedClassrooms(3);
    }

    @Get()
    @ApiOperation({ summary: 'Get all classrooms [ADMIN, STUDENT]' })
    @ApiResponse({
        status: 200,
        description: 'Return all classrooms',
        type: [Classroom],
    })
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.STUDENT)
    findAll() {
        return this.classroomService.findAll();
    }

    @Get('teacher')
    @ApiOperation({
        summary: 'Get all classrooms created by the current teacher [TEACHER]',
    })
    @ApiResponse({
        status: 200,
        description: 'Return all classrooms for the teacher',
        type: [Classroom],
    })
    @UseGuards(RolesGuard)
    @Roles(Role.TEACHER)
    findByTeacher(@Request() req) {
        return this.classroomService.findByTeacher(req.user.id);
    }

    @ApiOperation({ summary: 'Get all tests [TEACHER, STUDENT]' })
    @ApiBearerAuth('access-token')
    @Get('tests')
    @ApiResponse({
        status: 200,
        description: 'Tests retrieved successfully',
        type: [Test],
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.TEACHER)
    async getAllTestsInAllClassrooms(@Request() req: any) {
        return this.classroomService.getAllTestsInAllClassrooms(req.user.id);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get a classroom by ID [STUDENT, TEACHER, ADMIN]',
    })
    @ApiParam({ name: 'id', description: 'Classroom ID' })
    @ApiResponse({
        status: 200,
        description: 'Return the classroom',
        type: Classroom,
    })
    @ApiResponse({
        status: 404,
        description: 'Classroom not found',
    })
    findOne(@Request() req, @Param('id') id: string) {
        return this.classroomService.findOne(id, req.user);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a classroom [TEACHER]' })
    @ApiParam({ name: 'id', description: 'Classroom ID' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                className: {
                    type: 'string',
                    example: 'Updated English Grammar',
                },
                maxStudent: { type: 'number', example: 25 },
                price: { type: 'number', example: 249000 },
                description: {
                    type: 'string',
                    example: 'Updated description for the classroom',
                },
                image: {
                    type: 'string',
                    format: 'binary',
                    description: 'Classroom background image',
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'The classroom has been successfully updated',
        type: Classroom,
    })
    @ApiResponse({
        status: 404,
        description: 'Classroom not found',
    })
    @UseGuards(RolesGuard)
    @Roles(Role.TEACHER)
    @UseInterceptors(FileInterceptor('image'))
    async update(
        @Param('id') id: string,
        @Body() updateClassroomDto: Partial<CreateClassroomDto>,
        @UploadedFile() file,
        @Request() req,
    ) {
        // Verify teacher owns this classroom
        const classrooms = await this.classroomService.findByTeacher(
            req.user.id,
        );
        const isOwner = classrooms.some((classroom) => classroom.id === id);

        if (!isOwner) {
            throw new ForbiddenException(
                'You do not have permission to update this classroom',
            );
        }

        let backgroundImageUrl;
        if (file) {
            // Use the uploadService to upload the file
            backgroundImageUrl = await this.uploadService.uploadFile(
                file,
                'classrooms',
            );
        }

        return this.classroomService.update(
            id,
            updateClassroomDto,
            backgroundImageUrl,
        );
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a classroom [TEACHER, ADMIN]' })
    @ApiParam({ name: 'id', description: 'Classroom ID' })
    @ApiResponse({
        status: 200,
        description: 'The classroom has been successfully deleted',
    })
    @ApiResponse({
        status: 404,
        description: 'Classroom not found',
    })
    @UseGuards(RolesGuard)
    @Roles(Role.TEACHER, Role.ADMIN)
    async remove(@Param('id') id: string, @Request() req) {
        // Skip ownership check for admins
        if (req.user.role === Role.ADMIN) {
            return this.classroomService.remove(id);
        }

        // For teachers, verify ownership
        const classrooms = await this.classroomService.findByTeacher(
            req.user.id,
        );
        const isOwner = classrooms.some((classroom) => classroom.id === id);

        if (!isOwner) {
            throw new ForbiddenException(
                'You do not have permission to delete this classroom',
            );
        }

        return this.classroomService.remove(id);
    }

    @Post(':id/rate')
    @ApiOperation({ summary: 'Rate a classroom [STUDENT]' })
    @ApiParam({ name: 'id', description: 'Classroom ID' })
    @ApiBody({ type: CreateClassroomRatingDto })
    @ApiResponse({
        status: 200,
        description: 'The classroom has been successfully rated',
        schema: {
            type: 'object',
            properties: {
                avgRating: { type: 'number', example: 4.5 },
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Classroom not found',
    })
    @UseGuards(RolesGuard)
    @Roles(Role.STUDENT)
    rateClassroom(
        @Param('id') id: string,
        @Body() createRatingDto: CreateClassroomRatingDto,
        @Request() req,
    ) {
        return this.classroomService.rateClassroom(
            id,
            req.user.id,
            createRatingDto,
        );
    }

    @Post(':id/student')
    @ApiOperation({ summary: 'Add a student to a classroom [TEACHER]' })
    @ApiParam({ name: 'id', description: 'Classroom ID' })
    @ApiBody({
        type: AddStudentDto,
        description: 'Student to add to the classroom',
    })
    @ApiResponse({
        status: 201,
        description: 'Student added to classroom successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Classroom or student not found',
    })
    @ApiResponse({
        status: 403,
        description: 'Teacher does not own this classroom',
    })
    @ApiResponse({
        status: 409,
        description: 'Student is already in this classroom',
    })
    @UseGuards(RolesGuard)
    @Roles(Role.TEACHER)
    async addStudentToClassroom(
        @Param('id') classId: string,
        @Body() addStudentDto: AddStudentDto,
        @Request() req,
    ) {
        return this.classroomService.addStudentToClassroom(
            req.user.id,
            classId,
            addStudentDto.studentId,
        );
    }

    @Get(':id/students')
    @ApiOperation({ summary: 'Get all students in a classroom [TEACHER]' })
    @ApiParam({ name: 'id', description: 'Classroom ID' })
    @ApiResponse({
        status: 200,
        description: 'Returns list of students with their information',
        type: [StudentInfoDto],
    })
    @ApiResponse({
        status: 403,
        description: 'Teacher does not own this classroom',
    })
    @ApiResponse({
        status: 404,
        description: 'Classroom not found',
    })
    @UseGuards(RolesGuard)
    @Roles(Role.TEACHER)
    async getStudentsByClassroom(@Param('id') classId: string, @Request() req) {
        return this.classroomService.getStudentsByClassroom(
            classId,
            req.user.id,
        );
    }

    @Get('student/:studentId/classrooms')
    @ApiOperation({
        summary: 'Get all classrooms a student is enrolled in [STUDENT]',
    })
    @ApiParam({ name: 'studentId', description: 'Student ID' })
    @ApiResponse({
        status: 200,
        description: 'Returns list of classrooms the student is enrolled in',
        type: [ClassroomStudent],
    })
    @UseGuards(RolesGuard)
    @Roles(Role.STUDENT)
    async getClassroomsByStudent(
        @Param('studentId') studentId: string,
        @Request() req,
    ) {
        // For students, only allow them to see their own classrooms
        if (req.user.role === Role.STUDENT && req.user.id !== studentId) {
            throw new ForbiddenException(
                'You can only view your own enrolled classrooms',
            );
        }

        return this.classroomService.getClassroomsByStudent(studentId);
    }

    @Delete(':id/student/:studentId')
    @ApiOperation({ summary: 'Remove a student from a classroom [TEACHER]' })
    @ApiParam({ name: 'id', description: 'Classroom ID' })
    @ApiParam({ name: 'studentId', description: 'Student ID to remove' })
    @ApiResponse({
        status: 200,
        description: 'Student removed from classroom successfully',
    })
    @ApiResponse({
        status: 403,
        description: 'Teacher does not own this classroom',
    })
    @ApiResponse({
        status: 404,
        description: 'Classroom or student not found',
    })
    @UseGuards(RolesGuard)
    @Roles(Role.TEACHER)
    async removeStudentFromClassroom(
        @Param('id') classId: string,
        @Param('studentId') studentId: string,
        @Request() req,
    ) {
        const result = await this.classroomService.removeStudentFromClassroom(
            req.user.id,
            classId,
            studentId,
        );

        if (!result) {
            throw new NotFoundException('Student not found in this classroom');
        }

        return { message: 'Student removed from classroom successfully' };
    }

    @ApiOperation({ summary: 'Create a new national test [TEACHER]' })
    @ApiBearerAuth('access-token')
    @Post(':id/tests/national-test')
    @ApiResponse({
        status: 201,
        description: 'Test created successfully',
        type: CreateTestResponseDto,
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.TEACHER)
    async createNationalTestForClassroom(
        @Request() req: any,
        @Param('id') id: string,
        @Body()
        createNationalTestWithQuestions: CreateNationalTestWithQuestionsDto,
    ) {
        createNationalTestWithQuestions.test.type = TestType.NATIONAL_TEST;
        const test = await this.testsService.createNationalTest(
            createNationalTestWithQuestions.test,
            createNationalTestWithQuestions.questions,
            req.user.id,
        );

        await this.classroomService.createClassroomTest(id, test.id);

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

    @ApiOperation({ summary: 'Create a new TOEIC listening test [TEACHER]' })
    @ApiBearerAuth('access-token')
    @Post(':id/tests/toeic-listening-test')
    @ApiResponse({
        status: 201,
        description: 'Test created successfully',
        type: CreateTestResponseDto,
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.TEACHER)
    async createToeicListeningTestForTeacher(
        @Request() req: any,
        @Param('id') id: string,
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

        await this.classroomService.createClassroomTest(id, test.id);

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

    // create toeic reading test teacher
    @ApiOperation({ summary: 'Create a new TOEIC reading test [TEACHER]' })
    @ApiBearerAuth('access-token')
    @Post(':id/tests/toeic-reading-test')
    @ApiResponse({
        status: 201,
        description: 'Test created successfully',
        type: CreateTestResponseDto,
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.TEACHER)
    async createToeicReadingTestForTeacher(
        @Request() req: any,
        @Param('classroomId') classroomId: string,
        @Body() createTestDto: CreateTestDto,
    ) {
        createTestDto.type = TestType.TOEIC_READING;
        const test = await this.testsService.createToeicReadingTest(
            createTestDto,
            req.user.id,
        );

        await this.classroomService.createClassroomTest(classroomId, test.id);

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

    @ApiOperation({ summary: 'Get tests by classroom ID [TEACHER, STUDENT]' })
    @ApiBearerAuth('access-token')
    @Get(':id/tests')
    @ApiResponse({
        status: 200,
        description: 'Tests retrieved successfully',
        type: [Test],
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.TEACHER, Role.STUDENT)
    async getTestsByClassroomId(@Request() req: any, @Param('id') id: string) {
        return this.classroomService.getTestsByClassroomId(id, req.user);
    }

    @Delete(':id/tests/:testId')
    @ApiOperation({
        summary: 'Remove a test from a classroom [TEACHER]',
    })
    @ApiParam({ name: 'id', description: 'Classroom ID' })
    @ApiParam({ name: 'testId', description: 'Test ID to remove' })
    @ApiResponse({
        status: 200,
        description: 'Test removed from classroom successfully',
    })
    @ApiResponse({
        status: 403,
        description: 'Teacher does not own this classroom',
    })
    @ApiResponse({
        status: 404,
        description: 'Classroom or test not found',
    })
    @UseGuards(RolesGuard)
    @Roles(Role.TEACHER)
    async removeTestFromClassroom(
        @Param('id') classId: string,
        @Param('testId') testId: string,
        @Request() req,
    ) {
        return await this.classroomService.removeTestFromClassroom(
            req.user.id,
            classId,
            testId,
        );
    }
}
