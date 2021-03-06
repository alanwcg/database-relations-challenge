import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Invalid customer id');
    }

    const productsIds = products.map(product => ({ id: product.id }));

    const foundProducts = await this.productsRepository.findAllById(
      productsIds,
    );

    if (productsIds.length !== foundProducts.length) {
      throw new AppError('Invalid products ids');
    }

    const orderProducts = foundProducts.map((value, index) => {
      const orderProductQuantity = products[index].quantity;

      if (value.quantity < orderProductQuantity) {
        throw new AppError(`Insufficient ${value.name} in stock!`);
      }

      return {
        product_id: value.id,
        price: value.price,
        quantity: orderProductQuantity,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: orderProducts,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateOrderService;
