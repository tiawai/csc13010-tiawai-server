import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
    IsDateString,
    IsOptional,
    IsPhoneNumber,
    IsString,
} from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    username?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsPhoneNumber('VN')
    phone?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    birthdate?: string;
}
