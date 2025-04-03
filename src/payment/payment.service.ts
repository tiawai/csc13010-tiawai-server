import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    Payment,
    PaymentStatus,
    PaymentType,
    PayoutStatus,
} from './entities/payment.model';
import PayOS from '@payos/node';
import { User } from '../users/entities/user.model';
import { console } from 'inspector';
import { PaymentVerifyDto } from './dtos/payment-verify.dto';

@Injectable()
export class PaymentService {
    private payos: PayOS;

    constructor(private readonly configService: ConfigService) {
        this.payos = new PayOS(
            this.configService.get<string>('PAYOS_CLIENT_ID'),
            this.configService.get<string>('PAYOS_API_KEY'),
            this.configService.get<string>('PAYOS_CHECKSUM_KEY'),
            this.configService.get<string>('PAYOS_ENVIRONMENT') || 'sandbox',
        );
    }

    async getAllPayments() {
        return Payment.findAll();
    }

    async receiveWebhook(body: any) {
        const webhookData = this.payos.verifyPaymentWebhookData(body);
        if (!webhookData) {
            throw new BadRequestException('Invalid webhook data');
        }
        console.log('webhookData', webhookData);

        try {
            const { orderCode, code, amount } = webhookData;
            if (orderCode === 123) {
                return { success: true };
            }

            const payment = await Payment.findOne({ where: { orderCode } });
            if (!payment) {
                throw new NotFoundException('Payment not found');
            }

            // Update payment status based on webhook data
            if (code != '00' || amount != payment.amount) {
                console.log('if code != 00 || amount != payment.amount');
                await this.payos.cancelPaymentLink(orderCode);
                await payment.update({ status: PaymentStatus.CANCELLED });
                throw new Error(`Payment failed with code: ${code}`);
            }

            if (payment.type === PaymentType.BALANCE) {
                console.log('if payment.type === PaymentType.BALANCE');
                const user = await User.findOne({
                    where: { id: payment.studentId },
                });

                if (!user) {
                    console.log('if !user');
                    throw new NotFoundException('User not found');
                }

                await user.update({ balance: user.balance + payment.amount });
            }

            await payment.update({ status: PaymentStatus.COMPLETED });
            console.log('payment', payment);
        } catch (error) {
            throw new Error(`Failed to create payment: ${error.message}`);
        }

        return { success: true };
    }

    async getPayment(orderId: string) {
        const payment = await Payment.findOne({ where: { orderId } });
        if (!payment) {
            throw new NotFoundException('Payment not found');
        }
        return payment;
    }

    async createPayment(data: {
        studentId: string;
        type: PaymentType;
        amount: number;
        classroomId?: string;
        teacherId?: string;
    }) {
        if (!(data.type in PaymentType)) {
            throw new BadRequestException('Invalid payment type');
        }

        try {
            const orderCode = Date.now();

            // create payment model
            const payment = await Payment.create({
                ...data,
                orderCode,
                status: PaymentStatus.PENDING,
                payoutStatus:
                    data.type === PaymentType.CLASSROOM
                        ? PayoutStatus.PENDING
                        : null,
            });

            const paymentTypeContent: Record<
                PaymentType,
                { description: string }
            > = {
                [PaymentType.CLASSROOM]: {
                    description: 'Thanh toan lop hoc',
                },
                [PaymentType.BALANCE]: {
                    description: 'Nap tien vao tai khoan',
                },
            };

            // [PayOS] create payment link
            const paymentLink = await this.payos.createPaymentLink({
                orderCode,
                amount: data.amount,
                description: paymentTypeContent[data.type].description,
                returnUrl: `${this.configService.get('FRONTEND_URL')}/payment/success`,
                cancelUrl: `${this.configService.get('FRONTEND_URL')}/payment/cancel`,
            });

            if (paymentLink) {
                await payment.update({ paymentLink: paymentLink.checkoutUrl });
            }

            return payment;
        } catch (error) {
            throw new Error(`Failed to create payment: ${error.message}`);
        }
    }

    async verifyPayment(paymentVerifyDto: PaymentVerifyDto) {
        const { orderCode, code } = paymentVerifyDto;

        const payment = await Payment.findOne({ where: { orderCode } });
        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        if (code != '00') {
            await this.payos.cancelPaymentLink(orderCode);
            await payment.update({ status: PaymentStatus.CANCELLED });
        } else {
            if (payment.type === PaymentType.BALANCE) {
                const user = await User.findOne({
                    where: { id: payment.studentId },
                });

                if (!user) {
                    throw new NotFoundException('User not found');
                }

                await user.update({ balance: user.balance + payment.amount });
            }

            await payment.update({ status: PaymentStatus.COMPLETED });
        }

        return payment;
    }
}
