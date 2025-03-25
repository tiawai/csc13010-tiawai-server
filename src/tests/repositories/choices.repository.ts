import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Choice } from '../entities/choice.model';
import { CreateChoiceDto } from '../dtos/create-choice.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChoicesRepository {
    constructor(
        @InjectModel(Choice)
        private readonly choiceModel: typeof Choice,
    ) {}

    async createChoice(
        questionId: string,
        choiceData: CreateChoiceDto,
    ): Promise<Choice> {
        try {
            const choice = await this.choiceModel.create({
                id: uuidv4(),
                questionId: questionId,
                A: choiceData.A,
                B: choiceData.B,
                C: choiceData.C,
                D: choiceData.D,
            });

            if (!choice) {
                throw new InternalServerErrorException(
                    'Error occurs when creating choice',
                );
            }

            return choice.dataValues as Choice;
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }
}
