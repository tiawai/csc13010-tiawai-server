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
import { PaymentVerifyDto } from './dtos/payment-verify.dto';
import { UsersRepository } from 'src/users/users.repository';
import { PaymentRepository } from './payment.repository';
import { CreateBankAccountDto } from './dtos/create-bank-account.dto';
import { ClassroomStudentRepository } from 'src/classrooms/repositories/classroom-student.repository';
import { ClassroomRepository } from 'src/classrooms/repositories/classroom.repository';
import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';

@Injectable()
export class PaymentService {
    private payos: PayOS;
    private FRONTEND_URL: string;

    constructor(
        private readonly sequelize: Sequelize,
        private readonly configService: ConfigService,
        private readonly userRepository: UsersRepository,
        private readonly paymentRepository: PaymentRepository,
        private readonly classroomRepository: ClassroomRepository,
        private readonly classroomStudentRepository: ClassroomStudentRepository,
    ) {
        this.payos = new PayOS(
            this.configService.get<string>('PAYOS_CLIENT_ID'),
            this.configService.get<string>('PAYOS_API_KEY'),
            this.configService.get<string>('PAYOS_CHECKSUM_KEY'),
            this.configService.get<string>('PAYOS_ENVIRONMENT') || 'sandbox',
        );
        this.FRONTEND_URL = this.configService.get<string>('FRONTEND_URL');
    }

    generateOrderCode() {
        return Math.floor(Date.now() / 1000);
    }

    async getAllPayments() {
        return await this.paymentRepository.findAll();
    }

    async getStudentPayments(studentId: string) {
        return await this.paymentRepository.findAllByStudentId(studentId);
    }

    async getTeacherPayments(teacherId: string) {
        return await this.paymentRepository.findAllByTeacherId(teacherId);
    }

    async getByOrderCode(orderCode: number) {
        const payment =
            await this.paymentRepository.findOneByOrderCode(orderCode);
        if (!payment) {
            throw new NotFoundException('Payment not found');
        }
        return payment;
    }

    async createPaymentClassroom(studentId: string, classroomId: string) {
        const t = await this.sequelize.transaction();
        const orderCode = this.generateOrderCode();
        let paymentLink = null;
        let payment = null;

        try {
            const created = await this.paymentRepository.findPaymentClassroom(
                studentId,
                classroomId,
            );

            if (created) {
                t.commit();
                return created;
            }

            const classroom = await this.classroomRepository
                .findOne(classroomId)
                .then((classroom) => classroom.dataValues);
            if (!classroom) {
                throw new NotFoundException('Classroom not found');
            }

            const description = `Thanh toan lop hoc ${classroom.className}`;
            if (classroom.price) {
                paymentLink = await this.payos.createPaymentLink({
                    orderCode,
                    amount: classroom.price,
                    description: 'Thanh toan lop hoc',
                    returnUrl: `${this.FRONTEND_URL}/payment/success`,
                    cancelUrl: `${this.FRONTEND_URL}/payment/cancel`,
                });

                payment = await this.paymentRepository.createPayment(
                    {
                        studentId,
                        teacherId: classroom.teacherId,
                        classroomId,
                        amount: classroom.price,
                        orderCode,
                        type: PaymentType.CLASSROOM,
                        description,
                        paymentLink: paymentLink.checkoutUrl,
                    },
                    t,
                );
            } else {
                payment = await this.paymentRepository.createPayment(
                    {
                        studentId,
                        teacherId: classroom.teacherId,
                        classroomId,
                        orderCode,
                        type: PaymentType.CLASSROOM,
                        description,
                    },
                    t,
                );

                payment = await this.verifyPaymentClassroom(payment, t);
            }

            await t.commit();
            return payment;
        } catch (error) {
            await t.rollback();
            if (paymentLink) {
                await this.payos.cancelPaymentLink(orderCode);
            }
            throw new InternalServerErrorException(
                `Failed to create payment: ${error.message}`,
            );
        }
    }

    async createPaymentAI(teacherId: string) {
        const t = await this.sequelize.transaction();
        const orderCode = this.generateOrderCode();
        let paymentLink = null;

        try {
            const amount = 5000;
            const description = `Tao de thi AI`;

            paymentLink = await this.payos.createPaymentLink({
                orderCode,
                amount,
                description,
                returnUrl: `${this.FRONTEND_URL}/payment/success`,
                cancelUrl: `${this.FRONTEND_URL}/payment/cancel`,
            });

            const payment = await this.paymentRepository.createPayment(
                {
                    teacherId,
                    amount,
                    orderCode,
                    type: PaymentType.BALANCE,
                    description,
                    paymentLink: paymentLink.checkoutUrl,
                },
                t,
            );

            await t.commit();
            return payment;
        } catch (error) {
            await t.rollback();
            if (paymentLink) {
                await this.payos.cancelPaymentLink(orderCode);
            }
            throw new InternalServerErrorException(
                `Failed to create payment: ${error.message}`,
            );
        }
    }

    async verifyPayment(paymentVerifyDto: PaymentVerifyDto) {
        const t = await this.sequelize.transaction();
        const { orderCode, status } = paymentVerifyDto;
        let updated = null;

        try {
            const payment = await this.paymentRepository.findOneByOrderCode(
                orderCode,
                t,
            );

            if (!payment) {
                throw new NotFoundException('Payment not found');
            }

            if (payment.status === PaymentStatus.SUCCESS) {
                updated = payment;
            } else if (status === 'CANCELLED') {
                await this.payos.cancelPaymentLink(orderCode);
                updated = await this.paymentRepository.updatePayment(
                    payment.id,
                    {
                        status: PaymentStatus.CANCELLED,
                        paymentDate: new Date(),
                    },
                    t,
                );
            } else {
                switch (payment.type) {
                    case PaymentType.CLASSROOM:
                        updated = await this.verifyPaymentClassroom(payment, t);
                        break;
                    case PaymentType.BALANCE:
                        updated = await this.verifyPaymentAI(payment, t);
                        break;
                    default:
                        throw new BadRequestException('Invalid payment type');
                }
            }

            await t.commit();
            return updated;
        } catch (error) {
            await t.rollback();
            throw new InternalServerErrorException(
                `Failed to verify payment: ${error.message}`,
            );
        }
    }

    async verifyPaymentClassroom(payment: Payment, t: Transaction) {
        try {
            const teacher = await this.userRepository.findOneById(
                payment.teacherId,
            );

            if (!teacher) {
                throw new NotFoundException('Teacher not found');
            }

            // update teacher balance
            if (payment.amount) {
                await this.userRepository.updateUserBalance(
                    teacher.id,
                    teacher.balance + payment.amount,
                    t,
                );
            }

            // add student to classroom
            await this.classroomStudentRepository.addStudentToClassroom(
                payment.classroomId,
                payment.studentId,
            );

            // update payment status -> update payout status
            return await this.paymentRepository.updatePayment(
                payment.id,
                {
                    status: PaymentStatus.SUCCESS,
                    paymentDate: new Date(),
                    payoutStatus: payment.amount ? PayoutStatus.PENDING : null,
                },
                t,
            );
        } catch (error) {
            await this.classroomStudentRepository.removeStudentFromClassroom(
                payment.classroomId,
                payment.studentId,
            );
            throw new InternalServerErrorException(
                `Failed to verify classroom payment: ${error.message}`,
            );
        }
    }

    async verifyPaymentAI(payment: Payment, t: Transaction) {
        try {
            const teacher = await this.userRepository.findOneById(
                payment.teacherId,
            );

            if (!teacher) {
                throw new NotFoundException('Teacher not found');
            }

            await this.userRepository.updateUserBalance(
                teacher.id,
                teacher.balance + payment.amount,
                t,
            );

            return await this.paymentRepository.updatePayment(
                payment.id,
                {
                    status: PaymentStatus.SUCCESS,
                    paymentDate: new Date(),
                },
                t,
            );
        } catch (error) {
            throw new InternalServerErrorException(
                `Failed to verify balance payment: ${error.message}`,
            );
        }
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

                    if (!bankAccount.accountNumber) {
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
