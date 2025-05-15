import request from 'supertest';
import app from '../../../app';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();

describe('Transaction Controller', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create transaction with payment proof', async () => {
    const mockFile = path.resolve(__dirname, '../../__mocks__/test-payment.jpg');
    
    const response = await request(app)
      .post('/api/transactions/event-123')
      .attach('paymentProof', mockFile)
      .field('quantity', 2);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('payment_proof');
  });
});