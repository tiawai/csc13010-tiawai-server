import { Module } from '@nestjs/common';
import { VectorStoreService } from './vector-store.service';
import { VectorStoreController } from './vector-store.controller';

@Module({
    controllers: [VectorStoreController],
    providers: [VectorStoreService],
    exports: [VectorStoreService],
})
export class VectorStoreModule {}
