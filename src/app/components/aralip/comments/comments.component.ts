import { Component, ViewChild, ElementRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { form } from './form';
import { APIService } from '../../../services/api/api.service';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.css'],
})
export class CommentsComponent {
  @ViewChild('form') form!: NgForm;
  @ViewChild('clearButton', { static: false }) clearButton!: ElementRef;
  @ViewChild('errorMessage', { static: false }) errorMessage!: ElementRef; // Reference to error message

  formData = new form(
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  );

  subcellularLocations = form.subcellularLocations;
  pathways = form.pathways;
  evidenceForFunction = form.evidenceForFunction;

  showFormError = false; // Controls error message visibility
  errorMessages: string[] = []; // Holds error messages

  constructor(private commentsService: APIService) {}

  // Validate email format
  isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  // Collect all error messages and highlight invalid fields
  getErrorMessages(): string[] {
    const errors: string[] = [];

    if (!this.formData.name.trim()) {
      errors.push('Name is required.');
    }
    if (!this.formData.affiliation.trim()) {
      errors.push('Affiliation is required.');
    }
    if (!this.formData.email_address.trim() || !this.isValidEmail(this.formData.email_address)) {
      errors.push('A valid email address is required.');
    }
    if (!this.formData.record_type) {
      errors.push('Record type selection is required.');
    }

    return errors;
  }

  // Scroll to the error message section
  scrollToErrorMessage(): void {
    if (this.errorMessage) {
      this.errorMessage.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Handle form submission
  onSubmit(form: NgForm): void {
    this.errorMessages = this.getErrorMessages(); // Generate error messages

    if (this.errorMessages.length === 0) {
      console.log('Form is valid:', this.formData);
      this.showFormError = false; // Hide error message

      this.commentsService.submitComment(this.formData).subscribe(
        (data) => {
          this.clearButton.nativeElement.click(); // Clear the form
          window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to the top
        },
        (error) => {
          console.error('Error submitting form:', error);
        }
      );
    } else {
      console.log('Form is invalid.');
      this.showFormError = true; // Show error message
      this.scrollToErrorMessage(); // Scroll to the error message section
    }
  }
}
