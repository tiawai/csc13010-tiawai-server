import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FlashcardEntity } from './entities/flashcard.entity';
import { FlashcardController } from './flashcard.controller';
import { FlashcardService } from './flashcard.service';
import { FlashcardRepository } from './flashcard.repository';

@Module({
    imports: [SequelizeModule.forFeature([FlashcardEntity])],
    controllers: [FlashcardController],
    providers: [FlashcardService, FlashcardRepository],
    exports: [FlashcardService],
})
export class FlashcardModule {}
