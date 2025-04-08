import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    HttpCode,
    HttpException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { MessageResponseDto } from './dtos/message-response.dto.js';
import { CreateMessageDto } from './dtos/create-message.dto.js';
import { MessageService } from './message.service.js';
import { ATAuthGuard } from '../../auth/guards/at-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/roles.enum';
import { TEMPLATES } from '../template.constants.js';

@ApiTags('Messages')
@Controller('messages')
export class MessageController {
    constructor(private readonly messageService: MessageService) {}

    @ApiBearerAuth('access-token')
    @HttpCode(200)
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.STUDENT)
    @ApiOperation({ summary: 'Send message' })
    @ApiResponse({ type: MessageResponseDto })
    @Post()
    async sendMessage(
        @Body() createMessageDto: CreateMessageDto,
    ): Promise<{ message: string }> {
        try {
            await this.messageService.sendMessage(createMessageDto);
            return {
                message: 'Message sent successfully',
            };
        } catch (error) {
            throw new HttpException(error.message, error.status);
        }
    }

    @ApiBearerAuth('access-token')
    @HttpCode(200)
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.STUDENT)
    @ApiOperation({
        summary: 'Get bot response',
    })
    @ApiResponse({ type: MessageResponseDto })
    @Post(':id')
    async botResponse(@Param('id') sessionId: string) {
        return this.messageService.getResponse(sessionId, TEMPLATES);
    }

    @ApiBearerAuth('access-token')
    @HttpCode(200)
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.STUDENT)
    @ApiOperation({
        summary: 'Retrieve messages for a specific chat session by session ID',
    })
    @ApiResponse({ type: [MessageResponseDto] })
    @Get(':id')
    async findBySessionId(
        @Param('id') sessionId: string,
    ): Promise<MessageResponseDto[]> {
        return this.messageService.findBySessionId(sessionId);
    }
}
