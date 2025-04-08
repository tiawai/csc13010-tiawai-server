import { Injectable } from '@nestjs/common';
import { FlashcardRepository } from './flashcard.repository';
import { FlashcardEntity } from './entities/flashcard.entity';
import { CreateFlashcardDto } from './dtos/create-flashcard.dto';
import { UpdateFlashcardDto } from './dtos/update-flashcard.dto';

@Injectable()
export class FlashcardService {
    constructor(private readonly flashcardRepository: FlashcardRepository) {}

    create(
        userId: string,
        createFlashcardDto: CreateFlashcardDto,
    ): Promise<FlashcardEntity> {
        const createDto = {
            ...createFlashcardDto,
            totalFlashcards: createFlashcardDto.flashcards.length,
        };

        return this.flashcardRepository.create(userId, createDto);
    }

    findAll(userId: string): Promise<FlashcardEntity[]> {
        return this.flashcardRepository.findAll(userId);
    }

    findOne(id: string, userId: string): Promise<FlashcardEntity> {
        return this.flashcardRepository.findOne(id, userId);
    }

    update(
        id: string,
        userId: string,
        updateFlashcardDto: UpdateFlashcardDto,
    ): Promise<FlashcardEntity> {
        return this.flashcardRepository.update(id, userId, updateFlashcardDto);
    }

    remove(id: string, userId: string): Promise<void> {
        return this.flashcardRepository.remove(id, userId);
    }
}
