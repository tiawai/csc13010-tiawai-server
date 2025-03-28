import { Module } from '@nestjs/common';

import { AccessControlService } from './shared.service';

@Module({
    providers: [AccessControlService],
    exports: [AccessControlService],
})
export class SharedModule {}
