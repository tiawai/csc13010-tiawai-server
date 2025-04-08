import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ExtractFlashcardDto {
    @ApiProperty({ example: 'This is an example paragraph.' })
    @IsString()
    paragraph: string;
}
