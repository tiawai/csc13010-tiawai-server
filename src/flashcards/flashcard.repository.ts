import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FlashcardEntity } from './entities/flashcard.entity';
import { CreateFlashcardDto } from './dtos/create-flashcard.dto';
import { UpdateFlashcardDto } from './dtos/update-flashcard.dto';

@Injectable()
export class FlashcardRepository {
    constructor(
        @InjectModel(FlashcardEntity)
        private flashcardModel: typeof FlashcardEntity,
    ) {}

    async create(
        userId: string,
        createFlashcardDto: CreateFlashcardDto,
    ): Promise<FlashcardEntity> {
        return this.flashcardModel.create({
            userId,
            ...createFlashcardDto,
        });
    }

    async findAll(userId: string): Promise<FlashcardEntity[]> {
        return this.flashcardModel.findAll({
            where: { userId },
        });
    }

    async findOne(id: string, userId: string): Promise<FlashcardEntity> {
        const flashcard = await this.flashcardModel.findOne({
            where: { id, userId },
        });
        return flashcard;
    }

    async update(
        id: string,
        userId: string,
        updateFlashcardDto: UpdateFlashcardDto,
    ): Promise<FlashcardEntity> {
        const flashcard = await this.findOne(id, userId);

        if (updateFlashcardDto.flashcards) {
            updateFlashcardDto.totalFlashcards =
                updateFlashcardDto.flashcards.length;
        }

        await flashcard.update(updateFlashcardDto);
        return flashcard;
    }

    async remove(id: string, userId: string): Promise<void> {
        const flashcard = await this.findOne(id, userId);
        await flashcard.destroy();
    }
}
