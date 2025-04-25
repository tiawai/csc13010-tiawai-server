import { Body, Controller, Post, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VectorStoreService } from './vector-store.service';
import { SearchQueryDto } from './dto/search-query.dto';

@ApiTags('Chatbot')
@Controller('chatbot')
export class VectorStoreController {
    private readonly logger = new Logger(VectorStoreController.name);

    constructor(private readonly vectorStoreService: VectorStoreService) {}

    @ApiOperation({ summary: 'Search for information based on a query' })
    @ApiResponse({
        status: 200,
        description: 'Search results returned successfully',
    })
    @ApiResponse({
        status: 500,
        description: 'Server error during search',
    })
    @Post('search')
    async searchInformation(@Body() searchQueryDto: SearchQueryDto) {
        const { question, limit, scoreThreshold, filter } = searchQueryDto;

        this.logger.log(`Received search query: "${question}"`);

        try {
            const results = await this.vectorStoreService.similaritySearch(
                question,
                limit,
                scoreThreshold,
                filter,
            );

            return {
                success: true,
                results: results,
                query: question,
                count: results.length,
            };
        } catch (error) {
            this.logger.error(`Search error: ${error.message}`, error.stack);
            return {
                success: false,
                error: error.message,
                query: question,
            };
        }
    }
}
