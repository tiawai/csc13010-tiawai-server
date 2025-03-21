import { ApiProperty } from '@nestjs/swagger';
import {
    IsDateString,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsPhoneNumber,
    IsString,
} from 'class-validator';
import { Role } from '../enums/roles.enum';
export class UserSignUpDto {
    @ApiProperty()
    @IsNotEmpty({ message: 'Username cannot be empty' })
    @IsString()
    username: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'Email cannot be empty' })
    @IsEmail({}, { message: 'Invalid email' })
    email: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'Password cannot be empty' })
    @IsString()
    password: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'Phone cannot be empty' })
    @IsPhoneNumber('VN', { message: 'Invalid phone number' })
    phone: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'Birthdate cannot be empty' })
    @IsDateString()
    birthdate: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'Role cannot be empty' })
    @IsEnum(Role)
    role: Role;
}
