import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCodeValidation } from './table-code-validation';

describe('TableCodeValidation', () => {
  let component: TableCodeValidation;
  let fixture: ComponentFixture<TableCodeValidation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCodeValidation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableCodeValidation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
