import {
    Controller,
    Post,
    Body,
    Get,
    Param,
    UseGuards,
    Req,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ATAuthGuard } from '../auth/guards/at-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { Request } from 'express';
import { PaymentType } from './entities/payment.model';
import { PaymentVerifyDto } from './dtos/payment-verify.dto';

interface RequestWithUser extends Request {
    user: {
        id: string;
    };
}
@Controller('payments')
@UseGuards(ATAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    @Get()
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Get all payments' })
    @ApiResponse({
        status: 200,
        description: 'Payments retrieved successfully',
    })
    async getAllPayments() {
        return this.paymentService.getAllPayments();
    }

    @Post()
    @Roles(Role.STUDENT)
    @ApiOperation({ summary: 'Create a payment' })
    @ApiResponse({ status: 201, description: 'Payment created successfully' })
    async createPayment(
        @Req() req: RequestWithUser,
        @Body()
        data: {
            type: PaymentType;
            amount: number;
            classroomId?: string;
            teacherId?: string;
        },
    ) {
        return this.paymentService.createPayment({
            ...data,
            studentId: req.user.id,
        });
    }

    @Post('verify')
    @Roles(Role.STUDENT)
    @ApiOperation({ summary: 'Verify PayOS payment' })
    @ApiResponse({ status: 200, description: 'Payment verified successfully' })
    async verifyPayment(@Body() body: PaymentVerifyDto) {
        return this.paymentService.verifyPayment(body);
    }

    @Post('webhook')
    @ApiOperation({ summary: 'Receive PayOS webhook' })
    @ApiResponse({ status: 200, description: 'Webhook received successfully' })
    async receiveWebhook(@Body() body: any) {
        return this.paymentService.receiveWebhook(body);
        //  return { success: true };
    }

    @Get(':orderId')
    @ApiOperation({ summary: 'Get payment by orderId' })
    @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
    async getPayment(@Param('orderId') orderId: string) {
        return this.paymentService.getPayment(orderId);
    }
}
