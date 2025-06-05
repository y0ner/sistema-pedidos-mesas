import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditOrderModal } from './edit-order-modal';

describe('EditOrderModal', () => {
  let component: EditOrderModal;
  let fixture: ComponentFixture<EditOrderModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditOrderModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditOrderModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
