import { InjectModel } from '@nestjs/sequelize';
import {
    Payment,
    PaymentStatus,
    PaymentType,
    PayoutStatus,
} from './entities/payment.model';
import { CreatePaymentDto } from './dtos/create-payment-dto';
import { BankAccount } from './entities/bank-account.model';
import { CreateBankAccountDto } from './dtos/create-bank-account.dto';
import { InternalServerErrorException } from '@nestjs/common';

export class PaymentRepository {
    constructor(
        @InjectModel(Payment)
        private paymentModel: typeof Payment,
        @InjectModel(BankAccount)
        private bankAccountModel: typeof BankAccount,
    ) {}

    async findAll(): Promise<Payment[]> {
        return this.paymentModel.findAll();
    }

    async findAllByStudentId(studentId: string): Promise<Payment[]> {
        return this.paymentModel
            .findAll({
                where: { studentId },
                order: [['createdAt', 'DESC']],
            })
            .then((payments) => {
                return payments.map((payment) => payment.dataValues);
            });
    }

    async findOneByOrderCode(orderCode: number) {
        const payment = await this.paymentModel.findOne({
            where: { orderCode },
        });
        return payment.dataValues as Payment;
    }

    async createPayment(
        studentId: string,
        data: CreatePaymentDto,
    ): Promise<Payment> {
        return await this.paymentModel
            .create({
                ...data,
                studentId,
                orderCode: Math.floor(Date.now() / 1000),
                payoutStatus:
                    data.type === PaymentType.CLASSROOM
                        ? PayoutStatus.PENDING
                        : null,
            })
            .then((payment) => payment.dataValues);
    }

    async updatePayment(id: string, payment: Partial<Payment>) {
        try {
            const [updatedCount, updatedPayment] =
                await this.paymentModel.update(payment, {
                    where: { id },
                    returning: true,
                });

            if (updatedCount === 0) {
                throw new Error('Payment not found');
            }

            return updatedPayment[0].dataValues;
        } catch (error) {
            throw new InternalServerErrorException(
                'Error updating payment: ' + error.message,
            );
        }
    }

    async updatePayout(id: string, payoutStatus: PayoutStatus) {
        const payment = await this.paymentModel.findByPk(id);
        if (!payment) {
            throw new Error('Payment not found');
        }
        return payment.update({
            payoutStatus,
            payoutDate:
                payoutStatus === PayoutStatus.SUCCESS ? new Date() : null,
        });
    }

    async findAllPayout(payoutStatus: PayoutStatus): Promise<Payment[]> {
        return this.paymentModel
            .findAll({
                where: {
                    type: PaymentType.CLASSROOM,
                    payoutStatus: payoutStatus,
                },
            })
            .then((payments) => {
                return payments.map((payment) => payment.dataValues);
            });
    }

    async findBankAccountByUserId(userId: string): Promise<BankAccount | null> {
        return await this.bankAccountModel
            .findOne({
                where: { userId },
            })
            .then((bankAccount) => {
                if (!bankAccount) {
                    return null;
                }
                return bankAccount.dataValues;
            });
    }

    async createBankAccount(userId: string, data?: CreateBankAccountDto) {
        return this.bankAccountModel.create({
            ...data,
            userId,
        });
    }

    async updateBankAccount(userId: string, data: CreateBankAccountDto) {
        const bankAccount = await this.findBankAccountByUserId(userId);
        if (!bankAccount) {
            throw new Error('Bank account not found');
        }
        return bankAccount.update(data);
    }
}
