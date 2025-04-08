import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClassroomRatingDto {
    @ApiProperty({
        description: 'Rating from 1 to 5',
        example: 4,
        minimum: 1,
        maximum: 5,
    })
    @IsNumber()
    @IsNotEmpty()
    @Min(1)
    @Max(5)
    @Type(() => Number)
    rating: number;
}
