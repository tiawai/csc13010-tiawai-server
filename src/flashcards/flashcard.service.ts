import {
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { FlashcardRepository } from './flashcard.repository';
import { Card, FlashcardEntity } from './entities/flashcard.entity';
import { CreateFlashcardDto } from './dtos/create-flashcard.dto';
import { UpdateFlashcardDto } from './dtos/update-flashcard.dto';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { UserLoginDto } from 'src/auth/dtos/user-signin.dto';
import { ExtractFlashcardDto } from './dtos/extract-flashcard.dto';
import { TEMPLATES } from './prompts/extracting.prompt';

@Injectable()
export class FlashcardService {
    constructor(
        private readonly flashcardRepository: FlashcardRepository,
        private readonly configService: ConfigService,
    ) {}

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

    async findOne(id: string, userId: string): Promise<FlashcardEntity> {
        console.log('id', id);
        const { dataValues: flashcard } =
            await this.flashcardRepository.findOne(id, userId);

        if (!flashcard) {
            throw new NotFoundException(`Flashcard with ID ${id} not found`);
        }

        if (flashcard.userId !== userId) {
            throw new ForbiddenException(
                'You are not authorized to access this flashcard',
            );
        }
        return flashcard;
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

    async extract(
        extractFlashcardDto: ExtractFlashcardDto,
        user: UserLoginDto,
    ) {
        try {
            const { paragraph } = extractFlashcardDto;
            const response = await axios.post(
                `${this.configService.get('OPENAI_ENDPOINT')}`,
                {
                    model: this.configService.get('OPENAI_ADVANCED_MODEL'),
                    messages: [
                        {
                            role: 'system',
                            content: TEMPLATES.CONTEXT_AWARE,
                        },
                        {
                            role: 'user',
                            content: `${TEMPLATES.CONSTANT_REQUEST} + ${paragraph}`,
                        },
                    ],
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.configService.get('OPENAI_API_KEY')}`,
                    },
                },
            );

            const msg: string = response.data.choices[0]?.message?.content;

            if (!msg) {
                throw new InternalServerErrorException(
                    'Failed to extract vocabulary',
                );
            }
            const topic = msg.split('\n')[0];
            const vocabularies: {
                word: string;
                meaning: string;
                wordType: string;
            }[] = msg.split('\n').map((vocabulary: string) => {
                if (!vocabulary || vocabulary === topic) {
                    return {
                        word: '',
                        meaning: '',
                        wordType: '',
                    };
                }
                const [word, meaning, wordType] = vocabulary.split(', ');
                return {
                    word,
                    meaning,
                    wordType,
                };
            });
            const filteredVocabularies = vocabularies.filter(
                (vocabulary) =>
                    vocabulary.word.length > 0 &&
                    vocabulary.meaning.length > 0 &&
                    vocabulary.wordType.length > 0,
            );

            const flashCards: Card[] = filteredVocabularies.map((flashcard) => {
                return {
                    word: flashcard.word,
                    meaning: flashcard.meaning,
                    wordType: flashcard.wordType,
                };
            });

            const createDto: CreateFlashcardDto = {
                topic,
                flashcards: flashCards,
                totalFlashcards: flashCards.length,
            };
            const flashcardBatch = await this.flashcardRepository.create(
                user.id,
                createDto,
            );
            if (!flashcardBatch) {
                throw new InternalServerErrorException(
                    'Failed to save flashcard',
                );
            }
            return flashcardBatch;
        } catch (error) {
            throw new InternalServerErrorException(
                'Flashcard not extracted',
                error.response?.data?.error || error.message,
            );
        }
    }
}
