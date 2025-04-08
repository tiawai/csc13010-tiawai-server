import { ApiProperty } from '@nestjs/swagger';
import { Column, Model, Table, DataType } from 'sequelize-typescript';

export interface Card {
    word: string;
    meaning: string;
    wordType: string;
}

@Table({
    tableName: 'flashcard',
})
export class FlashcardEntity extends Model {
    @ApiProperty({ description: 'UUID of the flashcard batch' })
    @Column({
        type: DataType.UUID,
        primaryKey: true,
        allowNull: false,
        unique: true,
        defaultValue: DataType.UUIDV4,
    })
    declare id: string;

    @ApiProperty()
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    userId: string;

    @ApiProperty({ example: 'Khoa học' })
    @Column({
        allowNull: false,
        type: DataType.STRING,
    })
    topic: string;

    @ApiProperty({
        example: [
            {
                word: 'apple',
                meaning: 'táo',
                wordType: 'danh từ',
            },
        ],
    })
    @Column({
        type: DataType.ARRAY(DataType.JSONB),
        allowNull: false,
    })
    flashcards: Array<Card>;

    @ApiProperty({ example: 50 })
    @Column({
        allowNull: false,
        type: DataType.INTEGER,
    })
    totalFlashcards: number;
}
