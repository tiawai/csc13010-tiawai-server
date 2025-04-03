import {
    Controller,
    Get,
    Post,
    HttpCode,
    Body,
    Param,
    UseGuards,
    Patch,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { ChatSessionService } from './chat-session.service';
import { CreateChatSessionDto } from './dtos/create-chat-session.dto';
import { ChatSessionResponseDto } from './dtos/chat-session-response.dto';
import { ATAuthGuard } from '../../auth/guards/at-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/roles.enum';
@ApiTags('ChatSession')
@Controller('chat-sessions')
export class ChatSessionController {
    constructor(private readonly chatSessionService: ChatSessionService) {}

    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Create a new chat session' })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.STUDENT)
    @HttpCode(200)
    @ApiResponse({ type: ChatSessionResponseDto })
    @Post()
    async create(
        @Body() createChatSessionDto: CreateChatSessionDto,
    ): Promise<ChatSessionResponseDto> {
        return this.chatSessionService.create(createChatSessionDto);
    }

    @ApiBearerAuth('access-token')
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.STUDENT)
    @HttpCode(200)
    @ApiOperation({ summary: 'Retrieve all chat sessions' })
    @ApiResponse({ type: [ChatSessionResponseDto] })
    @Get()
    async findAll(): Promise<ChatSessionResponseDto[]> {
        return this.chatSessionService.findAll();
    }

    @ApiBearerAuth('access-token')
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.STUDENT)
    @HttpCode(200)
    @ApiOperation({ summary: 'Retrieve a specific chat session by ID' })
    @ApiResponse({ type: ChatSessionResponseDto })
    @Get(':id')
    async findById(@Param('id') id: string): Promise<ChatSessionResponseDto> {
        return this.chatSessionService.findById(id);
    }

    @ApiBearerAuth('access-token')
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.STUDENT)
    @HttpCode(200)
    @ApiOperation({ summary: 'Disable a specific chat session by ID' })
    @Patch(':id')
    async disable(@Param('id') id: string): Promise<ChatSessionResponseDto> {
        return this.chatSessionService.disable(id);
    }
}
