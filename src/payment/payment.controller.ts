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
import { PaymentVerifyDto } from './dtos/payment-verify.dto';
import { CreatePaymentDto } from './dtos/create-payment-dto';

interface RequestWithUser extends Request {
    user: {
        id: string;
    };
}
@Controller('payments')
@ApiBearerAuth()
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    @Get()
    @Roles(Role.ADMIN)
    @UseGuards(ATAuthGuard, RolesGuard)
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
        @Body() body: CreatePaymentDto,
    ) {
        return this.paymentService.createPayment(req.user.id, body);
    }

    @Post('verify')
    @Roles(Role.STUDENT)
    @ApiOperation({ summary: 'Verify PayOS payment' })
    @ApiResponse({ status: 200, description: 'Payment verified successfully' })
    async verifyPayment(@Body() body: PaymentVerifyDto) {
        return this.paymentService.verifyPayment(body);
    }

    @Get('payout')
    @Roles(Role.ADMIN)
    @UseGuards(ATAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Payout to teacher' })
    @ApiResponse({ status: 200, description: 'Payout processed successfully' })
    async getPayout() {
        return this.paymentService.getPayout();
    }

    @Post('webhook')
    @ApiOperation({ summary: 'Receive PayOS webhook' })
    @ApiResponse({ status: 200, description: 'Webhook received successfully' })
    async receiveWebhook(@Body() body: any) {
        return this.paymentService.receiveWebhook(body);
        //  return { success: true };
    }

    @Get(':orderCode')
    @ApiOperation({ summary: 'Get payment by orderCode' })
    @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
    async getByOrderCode(@Param('orderCode') orderCode: string) {
        return this.paymentService.getByOrderCode(+orderCode);
    }
}
