import { Component, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-contactus',
  templateUrl: './contactus.component.html',
  styleUrls: ['./contactus.component.scss']
})
export class ContactUsComponent{
  
  @ViewChild('contactForm', { static: false }) contactForm!: ElementRef;
  @ViewChild('successMessage', { static: false }) successMessage!: ElementRef;
  @ViewChild('errorMessage', { static: false }) errorMessage!: ElementRef;

  attachments: File[] = [];
  
  constructor(private http: HttpClient, private router: Router) { }

  validateForm(event: Event) {
    event.preventDefault(); // Prevent default form submission

    const form = this.contactForm.nativeElement;
    const firstName = form.querySelector('#firstName').value;
    const lastName = form.querySelector('#lastName').value;
    const email = form.querySelector('#email').value;
    const subject = form.querySelector('#subject').value;
    const message = form.querySelector('#message').value;
    const emailError = form.querySelector('#emailError');

    let isValid = true;

    if (firstName === '') {
      this.showErrorMessage(form.querySelector('#firstName'), 'Required');
      isValid = false;
    } else if (!/^[a-zA-Z]+$/.test(firstName)) {
      this.showErrorMessage(form.querySelector('#firstName'), 'Only alphabets allowed');
      isValid = false;
    } else {
      this.hideErrorMessage(form.querySelector('#firstName'));
    }

    if (lastName === '') {
      this.showErrorMessage(form.querySelector('#lastName'), 'Required');
      isValid = false;
    } else if (!/^[a-zA-Z]+$/.test(lastName)) {
      this.showErrorMessage(form.querySelector('#lastName'), 'Only alphabets allowed');
      isValid = false;
    } else {
      this.hideErrorMessage(form.querySelector('#lastName'));
    }

    if (email === '') {
      this.showErrorMessage(form.querySelector('#email'), 'Required');
      isValid = false;
    } else if (!this.isValidEmail(email)) {
      this.showErrorMessage(form.querySelector('#email'), 'Invalid email format');
      isValid = false;
    } else {
      this.hideErrorMessage(form.querySelector('#email'));
    }

    if (subject === '') {
      this.showErrorMessage(form.querySelector('#subject'), 'Required');
      isValid = false;
    } else {
      this.hideErrorMessage(form.querySelector('#subject'));
    }

    if (message === '') {
      this.showErrorMessage(form.querySelector('#message'), 'Required');
      isValid = false;
    } else {
      this.hideErrorMessage(form.querySelector('#message'));
    }

    if (isValid) {
      this.sendEmail();
    }
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  showErrorMessage(element: any, message: string) {
    const errorElement = element.parentNode.querySelector('.error-message');
    if (errorElement) {
      errorElement.innerText = message;
      errorElement.style.display = 'block';
    }
  }

  hideErrorMessage(element: any) {
    const errorElement = element.parentNode.querySelector('.error-message');
    if (errorElement) {
      errorElement.innerText = '';
      errorElement.style.display = 'none';
    }
  }

  onFileChange(event: any) {
    this.attachments = event.target.files;
  }

  sendEmail() {
    const form = this.contactForm.nativeElement;
    const firstName = form.querySelector('#firstName').value;
    const lastName = form.querySelector('#lastName').value;
    const email = form.querySelector('#email').value;
    const subject = form.querySelector('#subject').value;
    const message = form.querySelector('#message').value;

    const formData = new FormData();
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('email', email);
    formData.append('subject', subject);
    formData.append('message', message);

    if (this.attachments) {
      for (let i = 0; i < this.attachments.length; i++) {
        formData.append('attachments', this.attachments[i]);
      }
    }

    this.http.post(environment.BASE_API_URL + 'send_email/', formData)
      .subscribe(
        response => {
          this.successMessage.nativeElement.style.display = 'block';
          this.successMessage.nativeElement.innerHTML = 'Thank you for contacting us. You will hear shortly from us.';

          setTimeout(() => {
            location.reload(); // Refresh the page after 5 seconds
          }, 5000);
        },
        error => {
          // Handle error response
          console.error('Error:', error);
          this.errorMessage.nativeElement.style.display = 'block';
        }
      );
  }
}
