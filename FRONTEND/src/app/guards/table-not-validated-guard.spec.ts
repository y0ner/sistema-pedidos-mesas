import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { tableNotValidatedGuard } from './table-not-validated-guard';

describe('tableNotValidatedGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => tableNotValidatedGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
