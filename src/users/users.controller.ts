import {
    BadRequestException,
    Controller,
    Get,
    HttpCode,
    Query,
    Request,
    Res,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Put,
    Patch,
    Body,
} from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from './users.service';
import {
    ApiOperation,
    ApiBearerAuth,
    ApiResponse,
    ApiQuery,
    ApiConsumes,
    ApiBody,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { ATAuthGuard } from '../auth/guards/at-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ProfileDto } from '../auth/dtos/cred.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Multer } from 'multer';
import { UpdateUserDto } from './dtos/update-user.dto';
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @ApiOperation({ summary: 'Get profiles by role [ADMIN]' })
    @ApiBearerAuth('access-token')
    @Get()
    @ApiQuery({
        name: 'role',
        enum: Role,
        required: false,
        description: `Filter by role. Allowed values: ${Object.values(Role).join(', ')}`,
    })
    @ApiResponse({
        status: 200,
        description: 'Get profiles successfully',
        type: [ProfileDto],
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @ApiBearerAuth('access-token')
    @Roles(Role.ADMIN)
    @HttpCode(200)
    async getProfiles(@Query('role') role: Role, @Res() res: Response) {
        if (role && !Object.values(Role).includes(role)) {
            throw new BadRequestException(
                `Invalid role. Allowed values: ${Object.values(Role).join(', ')}`,
            );
        }

        const foundUsers = await this.usersService.getProfiles(role);
        res.send(foundUsers);
    }

    @ApiOperation({ summary: 'Get profile with credentials [USER]' })
    @ApiBearerAuth('access-token')
    @Get('user')
    @ApiResponse({
        status: 200,
        description: 'Get profile successfully',
        type: ProfileDto,
    })
    @UseGuards(ATAuthGuard)
    async getMyProfile(@Request() req: any, @Res() res: Response) {
        const foundUser: {
            email: string;
            username: string;
            id: string;
            role: string;
            phone: string;
            birthdate: string;
            profileImage: string;
            gender: string;
            address: string;
        } = await this.usersService.getMyProfile(req.user);
        res.send(foundUser);
    }

    /*
    @ApiOperation({ summary: 'Create admin [ADMIN]' })
    @ApiBearerAuth('access-token')
    @Post('employee')
    @ApiResponse({
        status: 200,
        description: 'Create employee successfully',
        type: ProfileDto,
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async createEmployee(@Body() createEmployeeDto: CreateEmployeeDto) {
        return this.usersService.createEmployee(createEmployeeDto);
    }

    @ApiOperation({ summary: 'Update admin [ADMIN]' })
    @ApiBearerAuth('access-token')
    @Patch('employee/:id')
    @ApiResponse({
        status: 200,
        description: 'Update employee successfully',
        type: ProfileDto,
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async updateEmployee(
        @Param('id') id: string,
        @Body() updateEmployeeDto: UpdateEmployeeDto,
    ) {
        return this.usersService.updateEmployee(id, updateEmployeeDto);
    }


    @ApiOperation({ summary: 'Delete employee [ADMIN]' })
    @ApiBearerAuth('access-token')
    @Delete('employee/:id')
    @ApiResponse({
        status: 200,
        description: 'Delete employee successfully',
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async deleteEmployee(@Param('id') id: string) {
        return this.usersService.deleteEmployee(id);
    }
    */

    @ApiOperation({ summary: 'Update user profile [USER]' })
    @ApiBearerAuth('access-token')
    @Patch('user')
    @ApiResponse({
        status: 200,
        description: 'Update profile successfully',
        type: ProfileDto,
    })
    @UseGuards(ATAuthGuard)
    async updateUserProfile(
        @Request() req: any,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        return this.usersService.updateUserProfile(req.user.id, updateUserDto);
    }

    @ApiOperation({ summary: 'Upload profile image [USER]' })
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                image: { type: 'string', format: 'binary' },
            },
            required: ['image'],
        },
    })
    @Put('user/image')
    @UseGuards(ATAuthGuard)
    @UseInterceptors(FileInterceptor('image'))
    async uploadProfileImage(
        @Request() req: any,
        @UploadedFile() file: Multer.File,
    ) {
        return this.usersService.updateProfileImage(req.user.id, file);
    }
}
