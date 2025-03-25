import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateChoiceDto } from './create-choice.dto';

export class CreateQuestionDto {
    @ApiProperty({ description: 'Paragraph text for the question' })
    @IsNotEmpty()
    @IsOptional()
    @IsString()
    paragraph?: string;

    @ApiProperty({ description: 'Question content' })
    @IsNotEmpty()
    @IsOptional()
    @IsString()
    content?: string;

    @ApiProperty({ description: 'Array of image URLs', required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];

    @ApiProperty({ description: 'Correct answer for the question' })
    @IsNotEmpty()
    @IsString()
    correctAnswer: string;

    @ApiProperty({ description: 'Explanation for the correct answer' })
    @IsNotEmpty()
    @IsOptional()
    @IsString()
    explanation?: string;

    @ApiProperty({ description: 'Points for this question' })
    @IsNotEmpty()
    @IsOptional()
    @IsNumber()
    points?: number;

    @ApiProperty({ description: 'Choices for this question' })
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => CreateChoiceDto)
    choices: CreateChoiceDto;
}
