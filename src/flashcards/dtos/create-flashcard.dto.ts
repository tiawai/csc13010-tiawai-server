import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsArray,
    ValidateNested,
    IsNotEmpty,
    IsInt,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CardDto {
    @ApiProperty({ example: 'apple', description: 'The word to learn' })
    @IsString()
    @IsNotEmpty()
    word: string;

    @ApiProperty({ example: 'táo', description: 'The meaning of the word' })
    @IsString()
    @IsNotEmpty()
    meaning: string;

    @ApiProperty({ example: 'noun', description: 'The type of the word' })
    @IsString()
    @IsNotEmpty()
    wordType: string;
}

export class CreateFlashcardDto {
    @ApiProperty({
        example: 'Science',
        description: 'The topic of the flashcard batch',
    })
    @IsString()
    @IsNotEmpty()
    topic: string;

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
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CardDto)
    flashcards: CardDto[];

    @ApiProperty({
        example: 10,
        description: 'Total number of flashcards in the batch',
        minimum: 1,
    })
    @IsInt()
    @Min(1)
    totalFlashcards: number;
}
