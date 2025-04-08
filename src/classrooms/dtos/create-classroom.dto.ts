import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNumber,
    IsOptional,
    IsNotEmpty,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClassroomDto {
    @ApiProperty({
        description: 'Name of the classroom',
        example: 'Advanced English Grammar',
    })
    @IsString()
    @IsNotEmpty()
    className: string;

    @ApiProperty({
        description: 'Maximum number of students allowed',
        example: 30,
        minimum: 1,
    })
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    maxStudent: number;

    @ApiProperty({
        description: 'Price of the classroom (0 for free)',
        example: 199000,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Type(() => Number)
    price?: number;

    @ApiProperty({
        description: 'Description of the classroom',
        example: 'Learn advanced English grammar with experienced teachers',
    })
    @IsString()
    @IsNotEmpty()
    description: string;
}
