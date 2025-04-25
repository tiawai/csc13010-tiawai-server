import { InjectModel } from '@nestjs/sequelize';
import {
    Payment,
    PaymentStatus,
    PaymentType,
    PayoutStatus,
} from './entities/payment.model';
import { BankAccount } from './entities/bank-account.model';
import { CreateBankAccountDto } from './dtos/create-bank-account.dto';
import { InternalServerErrorException } from '@nestjs/common';
import { Transaction, Op } from 'sequelize';

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

    async findAllByTeacherId(teacherId: string): Promise<Payment[]> {
        return this.paymentModel
            .findAll({
                where: { teacherId },
                order: [['createdAt', 'DESC']],
            })
            .then((payments) => {
                return payments.map((payment) => payment.dataValues);
            });
    }

    async findPaymentClassroom(
        studentId: string,
        classroomId: string,
    ): Promise<Payment | null> {
        const payment = await this.paymentModel.findOne({
            where: {
                studentId,
                classroomId,
                status: {
                    [Op.in]: [PaymentStatus.SUCCESS, PaymentStatus.PENDING],
                },
                type: PaymentType.CLASSROOM,
            },
        });
        return payment ? payment.dataValues : null;
    }

    async findPaymentAI(teacherId: string): Promise<Payment | null> {
        const payment = await this.paymentModel.findOne({
            where: {
                teacherId,
                status: {
                    [Op.in]: [PaymentStatus.PENDING],
                },
                type: PaymentType.BALANCE,
            },
            order: [['createdAt', 'DESC']],
        });
        return payment ? payment.dataValues : null;
    }

    async findOneByOrderCode(orderCode: number, transaction?: Transaction) {
        const payment = await this.paymentModel.findOne({
            where: { orderCode },
            lock: transaction.LOCK.UPDATE,
            transaction: transaction,
        });
        return payment.dataValues as Payment;
    }

    async createPayment(
        payment: Partial<Payment>,
        transaction?: Transaction,
    ): Promise<Payment> {
        const created = await this.paymentModel.create(
            { ...payment },
            { transaction },
        );

        return created.dataValues;
    }

    async updatePayment(
        id: string,
        payment: Partial<Payment>,
        transaction?: Transaction,
    ): Promise<Payment> {
        try {
            const [updatedCount, updatedPayment] =
                await this.paymentModel.update(payment, {
                    where: { id },
                    returning: true,
                    transaction,
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

    async canUseAI(teacherId: string): Promise<boolean> {
        const payments = await this.paymentModel.findAll({
            where: {
                teacherId,
                status: PaymentStatus.SUCCESS,
                type: PaymentType.BALANCE,
                payoutStatus: PayoutStatus.PENDING,
            },
        });
        return payments.length > 0;
    }

    async deletePaymentAI(teacherId: string): Promise<Payment> {
        const payments = await this.paymentModel.findAll({
            where: {
                teacherId,
                status: PaymentStatus.SUCCESS,
                type: PaymentType.BALANCE,
                payoutStatus: PayoutStatus.PENDING,
            },
            raw: true,
        });
        const [affectedCount, updatedPayments] = await this.paymentModel.update(
            {
                payoutStatus: PayoutStatus.SUCCESS,
                payoutDate: new Date(),
            },
            {
                where: {
                    id: payments[0].id,
                },
                returning: true,
            },
        );

        if (affectedCount === 0 || !updatedPayments.length) {
            throw new Error('No payment was updated');
        }

        return updatedPayments[0];
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
        return this.bankAccountModel.update(data, {
            where: { userId },
        });
    }
}
