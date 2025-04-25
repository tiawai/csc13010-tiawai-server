import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsArray,
    ValidateNested,
    IsNotEmpty,
    IsInt,
    Min,
    IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CardDto } from './create-flashcard.dto';

export class UpdateFlashcardDto {
    @ApiProperty({
        example: 'Science',
        description: 'The topic of the flashcard batch',
        required: false,
    })
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    topic?: string;

    @ApiProperty({
        type: [CardDto],
        description: 'Array of flashcards',
        example: [
            {
                word: 'apple',
                meaning: 'táo',
                wordType: 'noun',
            },
            {
                word: 'book',
                meaning: 'sách',
                wordType: 'noun',
            },
        ],
        required: false,
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CardDto)
    @IsOptional()
    flashcards?: CardDto[];

    @ApiProperty({
        example: 10,
        description: 'Total number of flashcards in the batch',
        minimum: 1,
        required: false,
    })
    @IsInt()
    @Min(1)
    @IsOptional()
    totalFlashcards?: number;
}
