import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './entities/user.model';
import bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { UserSignUpDto } from '../auth/dtos/user-signup.dto';
import { Role } from '../auth/enums/roles.enum';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class UsersRepository {
    constructor(
        @InjectModel(User) private readonly userModel: typeof User,
        private readonly configService: ConfigService,
        @InjectRedis() private readonly redisClient: Redis,
    ) {}

    async validatePassword(password: string, user: User): Promise<boolean> {
        try {
            return await bcrypt.compare(password, user.password);
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async hashPassword(password: string): Promise<string> {
        try {
            const salt: string = await bcrypt.genSalt(
                parseInt(this.configService.get('SALT'), 10),
            );

            const hashedPassword: string = await bcrypt.hash(password, salt);

            return hashedPassword;
        } catch (error) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }
    /*
    async createAdmin(CreateDto: CreateUserDto): Promise<User> {
        const { username, email, phone, birthdate } = CreateDto;

        //TBD: email this password to the admin
        const password = this.configService.get('DEFAULT_ADMIN_PASSWORD');
        const hashedPassword = await this.hashPassword(password);

        const user = await this.userModel.create({
            id: uuidv4(),
            username: username,
            email: email,
            phone: phone,
            birthdate: birthdate,
            password: hashedPassword,
            otp: null,
            otpExpiry: null,
            role: Role.ADMIN,
        });

        if (!user) {
            throw new InternalServerErrorException(
                'Error occurs when creating admin',
            );
        }
        return user;
    }
    */

    async createUser(CreateDto: UserSignUpDto): Promise<User> {
        const { username, email, password, phone, birthdate, role } = CreateDto;
        const hashedPassword = await this.hashPassword(password);

        const user = await this.userModel.create({
            id: uuidv4(),
            username: username,
            email: email,
            phone: phone,
            birthdate: birthdate,
            password: hashedPassword,
            otp: null,
            otpExpiry: null,
            balance: 0,
            role: role,
        });
        if (!user) {
            throw new InternalServerErrorException(
                'Error occurs when creating user',
            );
        }
        return user;
    }

    async findAllByRole(role: Role): Promise<User[]> {
        try {
            const projects = await this.userModel.findAll<User>({
                where: { role },
            });
            return projects.map((project) => project.dataValues) as User[];
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async findOneByEmail(email: string): Promise<User> {
        try {
            const project = await this.userModel.findOne<User>({
                where: { email },
            });

            return project.dataValues as User;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async findOneByUsername(username: string): Promise<User> {
        try {
            const project = await this.userModel.findOne<User>({
                where: { username },
            });

            return project.dataValues as User;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async findOneById(id: string): Promise<User> {
        try {
            const project = await this.userModel.findOne<User>({
                where: { id },
            });
            return project.dataValues as User;
        } catch (error) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    /*
    async updateEmployee(
        id: string,
        updateEmployeeDto: Partial<CreateEmployeeDto>,
    ): Promise<User> {
        try {
            const [updatedCount, updatedUsers] = await this.userModel.update(
                updateEmployeeDto,
                {
                    where: { id },
                    returning: true,
                },
            );

            if (updatedCount === 0) {
                throw new NotFoundException(`Employee with id ${id} not found`);
            }

            return updatedUsers[0].dataValues as User;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async deleteEmployee(id: string): Promise<{ message: string }> {
        const employee = await this.userModel.findByPk(id);
        if (!employee) {
            throw new NotFoundException(`Employee with ID ${id} not found`);
        }

        await employee.destroy();
        return { message: 'Employee deleted successfully' };
    }
    */

    async updateRefreshToken(id: string, refreshToken: string): Promise<void> {
        if (refreshToken !== 'null') {
            await this.redisClient.set(
                `refreshToken:${refreshToken}`,
                id,
                'EX',
                7 * 24 * 60 * 60,
            ); // 7 days expiration
        } else {
            await this.redisClient.del(`refreshToken:${id}`);
        }
    }

    async updatePassword(email: string, password: string): Promise<void> {
        try {
            await this.userModel.update(
                { password: password, otp: null, otpExpiry: null },
                { where: { email: email } },
            );
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async updateOtp(
        email: string,
        otp: string,
        otpExpiry: Date,
    ): Promise<void> {
        try {
            await this.userModel.update(
                { otp: otp, otpExpiry: otpExpiry },
                { where: { email: email } },
            );
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async findOneByRefreshToken(refreshToken: string): Promise<User> {
        const id = await this.redisClient.get(`refreshToken:${refreshToken}`);
        if (!id) {
            throw new NotFoundException('Refresh token not found');
        }
        return this.findOneById(id);
    }

    async deleteByRefreshToken(refreshToken: string): Promise<void> {
        await this.redisClient.del(`refreshToken:${refreshToken}`);
    }

    async findOneByOtp(email: string, otp: string): Promise<User> {
        try {
            const project = await this.userModel.findOne<User>({
                where: { email, otp },
            });
            return project.dataValues as User;
        } catch (error) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async findByOtpOnly(email: string, otp: string): Promise<User> {
        const project = await this.userModel.findOne<User>({
            where: { email, otp },
        });
        if (!project) {
            throw new InternalServerErrorException(
                `User ${email} with the OTP not found`,
            );
        }
        return project.dataValues as User;
    }

    async updateProfileImage(id: string, imageUrl: string): Promise<void> {
        try {
            await this.userModel.update(
                { profileImage: imageUrl },
                { where: { id } },
            );
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async updateUserProfile(
        id: string,
        updateData: Partial<User>,
    ): Promise<User> {
        try {
            const [updatedCount, updatedUsers] = await this.userModel.update(
                updateData,
                {
                    where: { id },
                    returning: true,
                },
            );

            if (updatedCount === 0) {
                throw new NotFoundException(`User with id ${id} not found`);
            }

            return updatedUsers[0].dataValues as User;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }
}
