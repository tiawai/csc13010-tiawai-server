import {
    Injectable,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
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
import { InjectModel } from '@nestjs/sequelize';
import { UsersRepository } from 'src/users/users.repository';
import { PaymentRepository } from './payment.repository';
import { CreatePaymentDto } from './dtos/create-payment-dto';
import { CreateBankAccountDto } from './dtos/create-bank-account.dto';

@Injectable()
export class PaymentService {
    private payos: PayOS;

    constructor(
        private readonly configService: ConfigService,
        private readonly userRepository: UsersRepository,
        private readonly paymentRepository: PaymentRepository,
    ) {
        this.payos = new PayOS(
            this.configService.get<string>('PAYOS_CLIENT_ID'),
            this.configService.get<string>('PAYOS_API_KEY'),
            this.configService.get<string>('PAYOS_CHECKSUM_KEY'),
            this.configService.get<string>('PAYOS_ENVIRONMENT') || 'sandbox',
        );
    }

    async getAllPayments() {
        return this.paymentRepository.findAll();
    }

    async getByOrderCode(orderCode: number) {
        const payment =
            await this.paymentRepository.findOneByOrderCode(orderCode);
        if (!payment) {
            throw new NotFoundException('Payment not found');
        }
        return payment;
    }

    async createPayment(studentId: string, data: CreatePaymentDto) {
        if (!(data.type in PaymentType)) {
            throw new BadRequestException('Invalid payment type');
        }

        try {
            const payment = await this.paymentRepository.createPayment(
                studentId,
                data,
            );

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
                orderCode: payment.orderCode,
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

        const payment =
            await this.paymentRepository.findOneByOrderCode(orderCode);
        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        if (code != '00') {
            await this.payos.cancelPaymentLink(orderCode);
            await payment.update({ status: PaymentStatus.CANCELLED });
        } else {
            if (payment.type === PaymentType.BALANCE) {
                const student = await this.userRepository.findOneById(
                    payment.studentId,
                );

                if (!student) {
                    throw new NotFoundException('Student not found');
                }

                await student.update({
                    balance: student.balance + payment.amount,
                });
            }

            if (payment.type === PaymentType.CLASSROOM) {
                const teacher = await User.findOne({
                    where: { id: payment.teacherId },
                });

                if (!teacher) {
                    throw new NotFoundException('Teacher not found');
                }

                await teacher.update({
                    balance: teacher.balance + payment.amount,
                });
            }

            await payment.update({ status: PaymentStatus.SUCCESS });
        }

        return payment;
    }

    async getPayout() {
        try {
            const payments = await this.paymentRepository.findAllPayout(
                PayoutStatus.PENDING,
            );

            const groupedByTeacher = payments.reduce(
                (acc, payment) => {
                    const teacherId = payment.teacherId;

                    if (!teacherId) return acc;

                    if (!acc[teacherId]) {
                        acc[teacherId] = {
                            teacherId: teacherId,
                            totalAmount: 0,
                            payments: [],
                        };
                    }

                    acc[teacherId].totalAmount += parseFloat(
                        payment.amount.toString(),
                    );
                    acc[teacherId].payments.push(payment);

                    return acc;
                },
                {} as Record<
                    string,
                    {
                        teacherId: string;
                        totalAmount: number;
                        payments: Payment[];
                    }
                >,
            );

            const result = Object.values(groupedByTeacher);

            const payouts = await Promise.all(
                result.map(async (teacher, index) => {
                    const bankAccount =
                        await this.paymentRepository.findBankAccountByUserId(
                            teacher.teacherId,
                        );

                    if (!bankAccount) {
                        return null;
                    }

                    return {
                        index: index + 1,
                        accountNumber: bankAccount.accountNumber,
                        accountHolderName: bankAccount.accountHolderName,
                        bankName: bankAccount.bankName,
                        amount: teacher.totalAmount,
                        message: `Payout for teacher ${bankAccount.accountHolderName}`,
                    };
                }),
            );

            return {
                payouts: payouts.filter(Boolean),
                payments: result.flatMap((teacher) =>
                    teacher.payments.map((payment) => payment.id),
                ),
            };
        } catch (error) {
            throw new Error(`Failed to get payout: ${error.message}`);
        }
    }

    async processPayout(payments: string[]) {
        try {
            return await Promise.all(
                payments.map(async (payment) => {
                    await this.paymentRepository.updatePayout(
                        payment,
                        PayoutStatus.IN_PROGRESS,
                    );
                }),
            );
        } catch (error) {
            throw new Error(`Failed to process payout: ${error.message}`);
        }
    }

    async updatePayoutSuccess() {
        try {
            const payments = await this.paymentRepository.findAllPayout(
                PayoutStatus.IN_PROGRESS,
            );
            return await Promise.all(
                payments.map(async (payment) => {
                    const user = await this.userRepository.findOneById(
                        payment.teacherId,
                    );
                    if (!user) {
                        throw new NotFoundException('User not found');
                    }
                    await this.paymentRepository.updatePayout(
                        payment.id,
                        PayoutStatus.SUCCESS,
                    );
                    await this.userRepository.updateUserBalance(
                        payment.teacherId,
                        user.balance - payment.amount,
                    );
                }),
            );
        } catch (error) {
            throw new Error(`Failed to update payout: ${error.message}`);
        }
    }

    async getBankAccount(userId: string) {
        try {
            const bankAccount =
                await this.paymentRepository.findBankAccountByUserId(userId);
            if (!bankAccount) {
                return await this.paymentRepository.createBankAccount(userId);
            }
            return bankAccount;
        } catch (error) {
            throw new InternalServerErrorException(
                `Failed to get bank account: ${error.message}`,
            );
        }
    }

    async createBankAccount(userId: string, data: CreateBankAccountDto) {
        try {
            return await this.paymentRepository.createBankAccount(userId, data);
        } catch (error) {
            throw new InternalServerErrorException(
                `Failed to create bank account: ${error.message}`,
            );
        }
    }

    async updateBankAccount(userId: string, data: CreateBankAccountDto) {
        try {
            return await this.paymentRepository.updateBankAccount(userId, data);
        } catch (error) {
            throw new InternalServerErrorException(
                `Failed to update bank account: ${error.message}`,
            );
        }
    }

    async receiveWebhook(body: any) {
        const webhookData = this.payos.verifyPaymentWebhookData(body);
        if (!webhookData) {
            throw new BadRequestException('Invalid webhook data');
        }

        try {
            const { orderCode, code, amount } = webhookData;
            if (orderCode === 123) {
                return { success: true };
            }

            const payment =
                await this.paymentRepository.findOneByOrderCode(orderCode);
            if (!payment) {
                throw new NotFoundException('Payment not found');
            }

            if (code != '00' || amount != payment.amount) {
                await this.payos.cancelPaymentLink(orderCode);
                await payment.update({ status: PaymentStatus.CANCELLED });
                throw new Error(`Payment failed with code: ${code}`);
            }

            if (payment.type === PaymentType.BALANCE) {
                const user = await this.userRepository.findOneById(
                    payment.studentId,
                );

                if (!user) {
                    throw new NotFoundException('User not found');
                }

                await user.update({ balance: user.balance + payment.amount });
            }

            await payment.update({ status: PaymentStatus.SUCCESS });
        } catch (error) {
            throw new Error(`Failed to create payment: ${error.message}`);
        }

        return { success: true };
    }
}
