import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Product from '../infra/typeorm/entities/Product';
import IProductsRepository from '../repositories/IProductsRepository';

interface IRequest {
  name: string;
  price: number;
  quantity: number;
}

@injectable()
class CreateProductService {
  constructor(
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
  ) {}

  public async execute({ name, price, quantity }: IRequest): Promise<Product> {
    // await this.productsRepository.updateQuantity([
    //   { id: '17bfd563-c12e-4719-a79e-f3685f4c47de', quantity: 300 },
    //   { id: '4cf7ef1f-b5df-48b1-8aa8-4eb63b4d0bf6', quantity: 300 },
    // ]);

    const checkProduct = await this.productsRepository.findByName(name);

    if (checkProduct) {
      throw new AppError('Product already exists');
    }

    const product = await this.productsRepository.create({
      name,
      price,
      quantity,
    });

    return product;
  }
}

export default CreateProductService;
