import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from './entities/user.model';
import { Role } from '../auth/enums/roles.enum';
import type { Multer } from 'multer';
import { UploadService } from '../uploader/upload.service';
@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly uploadService: UploadService,
    ) {}

    /*
    async createUser(createUserDto: CreateUserDto): Promise<User> {
        return this.usersRepository.createUser(createUserDto);
    }

    async updateUser(
        id: string,
        updateUserDto: Partial<UpdateUserDto>,
    ): Promise<User> {
        return this.usersRepository.updateUser(id, updateUserDto);
    }

    async deleteUser(id: string): Promise<{ message: string }> {
        return this.usersRepository.deleteUser(id);
    }
    */

    async getProfiles(role?: Role): Promise<
        {
            email: string;
            username: string;
            id: string;
            role: string;
            phone: string;
            birthdate: string;
            balance: number;
        }[]
    > {
        try {
            const users = await this.usersRepository.findAllByRole(role);

            return users.map((user) => ({
                email: user.email,
                username: user.username,
                id: user.id,
                role: user.role,
                phone: user.phone,
                birthdate: user.birthdate,
                balance: user.balance,
            }));
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async getMyProfile(profileUser: User): Promise<{
        email: string;
        username: string;
        id: string;
        role: string;
        phone: string;
        birthdate: string;
        profileImage: string;
        gender: string;
        address: string;
    }> {
        try {
            const { id } = profileUser;
            const user = await this.usersRepository.findOneById(id);

            if (!user) {
                throw new BadRequestException('User not found');
            }

            const newUser = {
                email: user.email,
                username: user.username,
                id: user.id,
                role: user.role,
                phone: user.phone,
                birthdate: user.birthdate,
                profileImage: user.profileImage,
                gender: user.gender,
                address: user.address,
            };
            return newUser;
        } catch (error) {
            throw new InternalServerErrorException(
                'Error getting profile',
                error.message,
            );
        }
    }

    async updateProfileImage(
        userId: string,
        file: Multer.File,
    ): Promise<{ message: string; user: Partial<User> }> {
        const imageUrl = await this.uploadService.uploadFile(file, 'users');
        await this.usersRepository.updateProfileImage(userId, imageUrl);
        const user = await this.usersRepository.findOneById(userId);
        const newUser = {
            id: user.id,
            username: user.username,
            profileImage: user.profileImage,
        };
        return {
            message: 'Profile image uploaded successfully',
            user: newUser,
        };
    }

    async updateUserProfile(
        userId: string,
        updateData: Partial<User>,
    ): Promise<{ message: string; user: Partial<User> }> {
        try {
            const updatedUser = await this.usersRepository.updateUserProfile(
                userId,
                updateData,
            );

            const userResponse = {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                phone: updatedUser.phone,
                birthdate: updatedUser.birthdate,
                profileImage: updatedUser.profileImage,
            };

            return {
                message: 'Profile updated successfully',
                user: userResponse,
            };
        } catch (error) {
            throw new InternalServerErrorException(
                'Error updating profile',
                error.message,
            );
        }
    }
}
