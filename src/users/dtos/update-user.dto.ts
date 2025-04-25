import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsEnum,
    IsOptional,
    IsPhoneNumber,
    IsString,
    MinLength,
} from 'class-validator';
import { Gender } from '../../auth/enums/gender.enum';

export class UpdateUserDto {
    @ApiProperty({ description: 'User name', required: false })
    @IsOptional()
    @IsString()
    @MinLength(3)
    username?: string;

    @ApiProperty({ description: 'User email', required: false })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({ description: 'User phone number', required: false })
    @IsOptional()
    @IsPhoneNumber()
    phone?: string;

    @ApiProperty({ description: 'User birthdate', required: false })
    @IsOptional()
    @IsString()
    birthdate?: string;

    @ApiProperty({ description: 'User gender', required: false })
    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @ApiProperty({ description: 'User address', required: false })
    @IsOptional()
    @IsString()
    address?: string;
}
