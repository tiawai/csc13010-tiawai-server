import { InjectModel } from '@nestjs/sequelize';
import { Payment, PaymentType, PayoutStatus } from './entities/payment.model';
import { CreatePaymentDto } from './dtos/create-payment-dto';

export class PaymentRepository {
    constructor(
        @InjectModel(Payment)
        private paymentModel: typeof Payment,
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

    async findAllPayoutPending(): Promise<Payment[]> {
        return this.paymentModel
            .findAll({
                where: {
                    type: PaymentType.CLASSROOM,
                    payoutStatus: PayoutStatus.PENDING,
                },
            })
            .then((payments) => {
                return payments.map((payment) => payment.dataValues);
            });
    }
}
