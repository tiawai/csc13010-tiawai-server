import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateChoiceDto {
    @ApiProperty({ description: 'Choice A text' })
    @IsNotEmpty()
    @IsString()
    A: string;

    @ApiProperty({ description: 'Choice B text' })
    @IsNotEmpty()
    @IsString()
    B: string;

    @ApiProperty({ description: 'Choice C text' })
    @IsNotEmpty()
    @IsString()
    C: string;

    @ApiProperty({ description: 'Choice D text' })
    @IsNotEmpty()
    @IsString()
    D: string;
}
