import { ApiProperty } from '@nestjs/swagger';
import {
    IsDateString,
    IsNumber,
    IsPhoneNumber,
    IsString,
} from 'class-validator';

export class CreateUserDto {
    @ApiProperty()
    @IsString()
    username: string;

    @ApiProperty()
    @IsString()
    email: string;

    @ApiProperty()
    @IsPhoneNumber('VN')
    phone: string;

    @ApiProperty()
    @IsDateString()
    birthdate: string;

    @ApiProperty()
    @IsNumber()
    balance: number;
}
