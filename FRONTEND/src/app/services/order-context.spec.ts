import { TestBed } from '@angular/core/testing';

import { OrderContext } from './order-context';

describe('OrderContext', () => {
  let service: OrderContext;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderContext);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
