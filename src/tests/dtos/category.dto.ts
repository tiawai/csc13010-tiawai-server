import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Category } from '../enums/category.enum';

export class CategoryDto {
    @ApiProperty({
        example: 'Phát âm',
        enum: Category,
    })
    @IsNotEmpty()
    @IsEnum(Category, {
        message:
            'Category must be one of the predefined values in the Category enum.',
    })
    category: Category;
}
