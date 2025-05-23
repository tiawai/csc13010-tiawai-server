import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    HttpCode,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody,
    ApiParam,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { FlashcardService } from './flashcard.service';
import { CreateFlashcardDto } from './dtos/create-flashcard.dto';
import { UpdateFlashcardDto } from './dtos/update-flashcard.dto';
import { FlashcardEntity } from './entities/flashcard.entity';
import { ATAuthGuard } from '../auth/guards/at-auth.guard';
import { Role } from 'src/auth/enums/roles.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ExtractFlashcardDto } from './dtos/extract-flashcard.dto';

@ApiTags('Flashcards')
@Controller('flashcards')
@UseGuards(ATAuthGuard)
@ApiBearerAuth('access-token')
@Roles(Role.STUDENT, Role.TEACHER)
export class FlashcardController {
    constructor(private readonly flashcardService: FlashcardService) {}

    @ApiOperation({
        summary: 'Extract flashcards from a text [STUDENT, TEACHER]',
    })
    @ApiBody({
        type: ExtractFlashcardDto,
    })
    @ApiResponse({
        status: 200,
        description: 'Extract flashcards successfully',
        type: FlashcardEntity,
    })
    @HttpCode(200)
    @Post('extract')
    async extract(
        @Body() extractFlashcardDto: ExtractFlashcardDto,
        @Request() req: any,
    ) {
        return this.flashcardService.extract(extractFlashcardDto, req.user);
    }

    @Post()
    @ApiOperation({
        summary: 'Create a new flashcard batch [STUDENT, TEACHER]',
    })
    @ApiResponse({
        status: 201,
        description: 'The flashcard batch has been successfully created.',
        type: FlashcardEntity,
    })
    create(@Request() req, @Body() createFlashcardDto: CreateFlashcardDto) {
        return this.flashcardService.create(req.user.id, createFlashcardDto);
    }

    @Get()
    @ApiOperation({
        summary:
            'Get all flashcard batches for the current user [STUDENT, TEACHER]',
    })
    @ApiResponse({
        status: 200,
        description: 'Returns all flashcard batches for the current user',
        type: [FlashcardEntity],
    })
    findAll(@Request() req) {
        return this.flashcardService.findAll(req.user.id);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get a specific flashcard batch by ID [STUDENT, TEACHER]',
    })
    @ApiParam({ name: 'id', description: 'Flashcard batch ID' })
    @ApiResponse({
        status: 200,
        description: 'Returns the flashcard batch',
        type: FlashcardEntity,
    })
    @ApiResponse({
        status: 404,
        description: 'Flashcard batch not found',
    })
    findOne(@Param('id') id: string, @Request() req) {
        return this.flashcardService.findOne(id, req.user.id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a flashcard batch [STUDENT, TEACHER]' })
    @ApiParam({ name: 'id', description: 'Flashcard batch ID' })
    @ApiResponse({
        status: 200,
        description: 'The flashcard batch has been successfully updated',
        type: FlashcardEntity,
    })
    @ApiResponse({
        status: 404,
        description: 'Flashcard batch not found',
    })
    update(
        @Param('id') id: string,
        @Body() updateFlashcardDto: UpdateFlashcardDto,
        @Request() req,
    ) {
        return this.flashcardService.update(
            id,
            req.user.id,
            updateFlashcardDto,
        );
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a flashcard batch [STUDENT, TEACHER]' })
    @ApiParam({ name: 'id', description: 'Flashcard batch ID' })
    @ApiResponse({
        status: 200,
        description: 'The flashcard batch has been successfully deleted',
    })
    @ApiResponse({
        status: 404,
        description: 'Flashcard batch not found',
    })
    remove(@Param('id') id: string, @Request() req) {
        return this.flashcardService.remove(id, req.user.id);
    }
}
