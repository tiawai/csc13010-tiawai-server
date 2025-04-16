import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchQueryDto {
    @ApiProperty({
        description: 'The search query or question to be processed',
        example: 'What are the operating hours?',
    })
    @IsString()
    @IsNotEmpty()
    question: string;

    @ApiProperty({
        description: 'Maximum number of results to return',
        example: 5,
        required: false,
        default: 5,
    })
    @IsNumber()
    @IsOptional()
    limit?: number = 5;

    @ApiProperty({
        description: 'Minimum similarity score threshold (0-1)',
        example: 0.7,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    scoreThreshold?: number;

    @ApiProperty({
        description: 'Filter results by metadata fields',
        example: { category: 'FAQ', language: 'en' },
        required: false,
    })
    @IsObject()
    @IsOptional()
    filter?: Record<string, any>;
}
