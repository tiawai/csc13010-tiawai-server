import { Injectable } from '@nestjs/common';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { Document } from '@langchain/core/documents';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VectorStoreService {
    private pgvectorStore: PGVectorStore;
    private pool: Pool;

    constructor(private configService: ConfigService) {
        this.pool = new Pool({
            host: this.configService.get('DATABASE'),
            database: this.configService.get('DB_NAME'),
            user: this.configService.get('DB_USERNAME'),
            password: this.configService.get('DB_PASSWORD'),
            port: this.configService.get('DB_PORT'),
            ssl: {
                rejectUnauthorized: false,
            },
        });
    }

    async onModuleInit() {
        await this.ensureDatabaseSchema();

        const pgVectorConfig = {
            pool: this.pool,
            tableName: this.configService.get('VECTOR_TABLE_NAME'),
            columns: {
                idColumnName: 'id',
                vectorColumnName: 'vector',
                contentColumnName: 'content',
                metadataColumnName: 'metadata',
            },
            distanceStrategy: this.configService.get('DISTANCE_STRATEGY'),
        };

        this.pgvectorStore = new PGVectorStore(
            new OpenAIEmbeddings(),
            pgVectorConfig,
        );
    }

    private async ensureDatabaseSchema() {
        const client = await this.pool.connect();
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS ${this.configService.get('VECTOR_TABLE_NAME')} (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                vector VECTOR,
                content TEXT,
                metadata JSONB
                );
            `;
            await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
            await client.query('CREATE EXTENSION IF NOT EXISTS vector');
            await client.query(query);
        } catch (error) {
            console.error('Error ensuring database schema:', error);
            throw new Error('Failed to set up the vector store schema');
        } finally {
            client.release();
        }
    }

    async addDocuments(documents: Document[]): Promise<void> {
        if (!this.pgvectorStore) {
            throw new Error('Vector store not initialized');
        }
        await this.pgvectorStore.addDocuments(documents);
    }

    similaritySearch(query: string, limit: number): any {
        if (!this.pgvectorStore) {
            throw new Error('Vector store not initialized');
        }
        return this.pgvectorStore.similaritySearch(query, limit);
    }

    asRetriever(): any {
        if (!this.pgvectorStore) {
            throw new Error('Vector store not initialized');
        }
        return this.pgvectorStore.asRetriever();
    }

    async onModuleDestroy() {
        await this.pool.end();
    }
}
