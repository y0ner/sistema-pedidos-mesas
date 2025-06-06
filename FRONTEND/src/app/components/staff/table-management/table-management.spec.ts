import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableManagement } from './table-management';

describe('TableManagement', () => {
  let component: TableManagement;
  let fixture: ComponentFixture<TableManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
