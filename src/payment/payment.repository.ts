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

    async findOneByOrderCode(orderCode: number) {
        if (isNaN(orderCode)) {
            throw new Error('Invalid orderCode: NaN');
        }
        const payment = await this.paymentModel.findOne({
            where: { orderCode },
        });
        return payment.dataValues;
    }

    async createPayment(
        studentId: string,
        data: CreatePaymentDto,
    ): Promise<Payment> {
        return this.paymentModel.create({
            ...data,
            studentId,
            orderCode: Date.now(),
            payoutStatus:
                data.type === PaymentType.CLASSROOM
                    ? PayoutStatus.PENDING
                    : null,
        });
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
