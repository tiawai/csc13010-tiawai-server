import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    IsNumber,
    IsUUID,
    Min,
    IsArray,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAnswerDto {
    @ApiProperty({ description: 'Question Order' })
    @IsNotEmpty()
    @IsNumber()
    questionOrder: number;

    @ApiProperty({ description: 'Answer' })
    @IsNotEmpty()
    @IsString()
    answer: string;
}

export class AnswerSheetDto {
    @ApiProperty({
        description: 'Real time consumed for taking the test in seconds',
        example: 2850,
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    timeConsumed: number;

    @ApiProperty({
        description: 'Answers',
        type: [CreateAnswerDto],
        isArray: true,
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateAnswerDto)
    answers: CreateAnswerDto[];
}

export class CreateAnswerWithQuestionIdDto {
    @ApiProperty({ description: 'Question ID' })
    @IsNotEmpty()
    @IsString()
    @IsUUID()
    questionId: string;

    @ApiProperty({ description: 'Answer' })
    @IsNotEmpty()
    @IsString()
    answer: string;
}
