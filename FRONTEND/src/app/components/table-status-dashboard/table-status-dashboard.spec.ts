import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableStatusDashboard } from './table-status-dashboard';

describe('TableStatusDashboard', () => {
  let component: TableStatusDashboard;
  let fixture: ComponentFixture<TableStatusDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableStatusDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableStatusDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
