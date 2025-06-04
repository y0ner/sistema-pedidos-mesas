import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { tableValidatedGuard } from './table-validated-guard';

describe('tableValidatedGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => tableValidatedGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
