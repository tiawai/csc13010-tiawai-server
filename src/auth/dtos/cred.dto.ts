import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CredDto {
    @ApiProperty()
    @IsString()
    username: string;

    @ApiProperty()
    @IsString()
    email: string;
}

export class ProfileDto {
    @ApiProperty()
    @IsString()
    email: string;

    @ApiProperty()
    @IsString()
    username: string;

    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    role: string;
}
