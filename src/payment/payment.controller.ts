import {
    Controller,
    Post,
    Body,
    Get,
    Param,
    UseGuards,
    Req,
    Put,
    Delete,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ATAuthGuard } from '../auth/guards/at-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { Request } from 'express';
import { PaymentVerifyDto } from './dtos/payment-verify.dto';
import { CreateBankAccountDto } from './dtos/create-bank-account.dto';

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

    @Get('student')
    @Roles(Role.STUDENT)
    @UseGuards(ATAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Get student payments' })
    @ApiResponse({
        status: 200,
        description: 'Student payments retrieved successfully',
    })
    async getStudentPayments(@Req() req: RequestWithUser) {
        return this.paymentService.getStudentPayments(req.user.id);
    }

    @Get('teacher')
    @Roles(Role.TEACHER)
    @UseGuards(ATAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Get teacher payments' })
    @ApiResponse({
        status: 200,
        description: 'Teacher payments retrieved successfully',
    })
    async getTeacherPayments(@Req() req: RequestWithUser) {
        return this.paymentService.getTeacherPayments(req.user.id);
    }

    @Post('classroom/:classroomId')
    @Roles(Role.STUDENT)
    @UseGuards(ATAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Create a payment' })
    @ApiResponse({ status: 201, description: 'Payment created successfully' })
    async createPaymentClassroom(
        @Req() req: RequestWithUser,
        @Param('classroomId') classroomId: string,
    ) {
        return await this.paymentService.createPaymentClassroom(
            req.user.id,
            classroomId,
        );
    }

    @Post('ai')
    @Roles(Role.TEACHER)
    @UseGuards(ATAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Create a payment ai' })
    @ApiResponse({
        status: 201,
        description: 'Payment ai created successfully',
    })
    async createPaymentBalance(@Req() req: RequestWithUser) {
        return await this.paymentService.createPaymentAI(req.user.id);
    }

    @Get('ai/checkout')
    @Roles(Role.TEACHER)
    @UseGuards(ATAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Verify PayOS payment' })
    @ApiResponse({ status: 200, description: 'Payment verified successfully' })
    async canUseAI(@Req() req: RequestWithUser) {
        return await this.paymentService.canUseAI(req.user.id);
    }

    @Delete('ai')
    @Roles(Role.TEACHER)
    @UseGuards(ATAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Delete payment ai' })
    @ApiResponse({
        status: 200,
        description: 'Payment ai deleted successfully',
    })
    async deletePaymentAI(@Req() req: RequestWithUser) {
        return await this.paymentService.deletePaymentAI(req.user.id);
    }

    @Post('verify')
    @Roles(Role.STUDENT, Role.TEACHER)
    @UseGuards(ATAuthGuard, RolesGuard)
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

    @Post('payout/process')
    @Roles(Role.ADMIN)
    @UseGuards(ATAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Process payout to teacher' })
    @ApiResponse({ status: 200, description: 'Payout processed successfully' })
    async processPayout(@Body() body: { payments: string[] }) {
        return this.paymentService.processPayout(body.payments);
    }

    @Post('payout/success')
    @Roles(Role.ADMIN)
    @UseGuards(ATAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Update payout status to success' })
    @ApiResponse({
        status: 200,
        description: 'Payout status updated to success',
    })
    async updatePayoutSuccess() {
        return this.paymentService.updatePayoutSuccess();
    }

    @Get('accounts')
    @Roles(Role.TEACHER)
    @UseGuards(ATAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Get bank account' })
    @ApiResponse({
        status: 200,
        description: 'Bank account retrieved successfully',
    })
    async getBankAccount(@Req() req: RequestWithUser) {
        return this.paymentService.getBankAccount(req.user.id);
    }

    @Post('accounts')
    @Roles(Role.TEACHER)
    @UseGuards(ATAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Create a bank account' })
    @ApiResponse({
        status: 201,
        description: 'Bank account created successfully',
    })
    async createBankAccount(
        @Req() req: RequestWithUser,
        @Body() body: CreateBankAccountDto,
    ) {
        return this.paymentService.createBankAccount(req.user.id, body);
    }

    @Put('accounts')
    @Roles(Role.TEACHER)
    @UseGuards(ATAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Update a bank account' })
    @ApiResponse({
        status: 200,
        description: 'Bank account updated successfully',
    })
    async updateBankAccount(
        @Req() req: RequestWithUser,
        @Body() body: CreateBankAccountDto,
    ) {
        return this.paymentService.updateBankAccount(req.user.id, body);
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
