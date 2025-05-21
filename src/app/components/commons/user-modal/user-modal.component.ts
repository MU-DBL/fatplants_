import {Component, Inject, OnInit} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {NotificationService} from '../../../services/notification/notification.service';

@Component({
  selector: 'app-user-modal',
  templateUrl: './user-modal.component.html',
  styleUrls: ['./user-modal.component.scss']
})
export class UserModalComponent implements OnInit {

  userDoc: any;
  updateData: any = {};
  holdUser: any = {};
  loggedUser: any;
  constructor(public dialogRef: MatDialogRef<UserModalComponent>,
              private notificationService: NotificationService,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
  }

  onCancel(): void {
    this.data = Object.assign(this.data, this.holdUser);
    this.dialogRef.close();
  }

  save(): number {
  this.updateData = Object.assign(this.updateData, this.data);
  if (this.data.admin.toString(10).toLowerCase() === 'administrator') {
    if (this.holdUser.admin !== 0) {
      if (this.loggedUser.admin === 0) {
        this.updateData.admin = 0;
        return 1;
      } else {
        this.notificationService.popup('You do not have the required permissions to perform this action.');
        return 0;
      }
    }
  } else if (this.data.admin.toString(10).toLowerCase() === 'supervisor') {
    if (this.holdUser.admin !== 'Administrator') {
      this.updateData.admin = 1;
      return 1;
    } else {
      if (this.loggedUser.admin === 0) {
        this.updateData.admin = 1;
        return 1;
      } else {
        this.notificationService.popup('You do not have the required permissions to perform this action.');
        return 0;
      }
    }
  } else if (this.data.admin.toString(10).toLowerCase() === 'user') {
    if (this.holdUser.admin !== 'Administrator') {
      this.updateData.admin = 2;
      return 1;
    } else {
      if (this.loggedUser.admin === 0) {
        this.updateData.admin = 2;
        return 1;
      } else {
        this.notificationService.popup('You do not have the required permissions to perform this action.');
        return 0;
      }
    }
  } else {
    this.notificationService.popup('Improper value for permissions. Should be \'administrator\', \'supervisor\', or \'user\'');
    return 0;
  }
  return 1; // 防止遗漏
  }
}
