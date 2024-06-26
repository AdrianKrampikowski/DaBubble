import { FormsModule } from '@angular/forms';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../firestore.service';
import { NgForm } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [FormsModule, CommonModule, MatProgressSpinnerModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent implements  OnInit{
  @Output() backToLoginClicked: EventEmitter<any> = new EventEmitter();
  @Output() continueToChooseAvatar: EventEmitter<any> = new EventEmitter();
  @Output() openPrivacyPolice: EventEmitter<any> = new EventEmitter();

  constructor(private firestoreService: FirestoreService) { }
  showInputInformationUserName: boolean = false;
  showInputInformationEmailInputEmpty: boolean = false;
  showInputInformationEmailforgive: boolean = false;
  showInputInformationPassword: boolean = false;
  showInputInformationPrivacyPolice: boolean = false;
  newDate: any;
  showPasswordValue = false;
  loadingScreen = false;

  ngOnInit(): void {
    this.loadingScreen = false;
    const allVariabels = this.firestoreService.getAllVariables()
  }

  showPassword() {
    if(!this.showPasswordValue) {
      this.showPasswordValue = true;
      const passwordInput = document.getElementById('password') as HTMLInputElement;
      passwordInput.type = 'text';
    } else if (this.showPasswordValue) {
      this.showPasswordValue = false;
      const passwordInput = document.getElementById('password') as HTMLInputElement;
      passwordInput.type = 'password';
    }
  }



  async userSignUp(formData: NgForm): Promise<void> {
    this.loadingScreen = true;
    this.showInputInformationUserName = false;
    this.showInputInformationEmailInputEmpty = false;
    this.showInputInformationEmailforgive = false;
    this.showInputInformationPassword = false;
    this.showInputInformationPrivacyPolice = false;
    const { email, password, username, privacyPolice } = formData.value;

    if (!formData.valid) {
      if (formData.controls['username'].invalid) {
        this.showInputInformationUserName = true;
        this.loadingScreen = false;
      } else if (formData.controls['email'].invalid) {
        this.showInputInformationEmailInputEmpty = true;
        this.loadingScreen = false;
      }  else if (formData.controls['password'].invalid) {
        this.showInputInformationPassword = true;
        this.loadingScreen = false;
      }  else if(formData.controls['privacyPolice'].invalid) {
        this.showInputInformationPrivacyPolice = true;
        this.loadingScreen = false;
      }
      } else {
        const signUpDate = await this.firestoreService.createTimeStamp();
        const registrationSuccess = await this.firestoreService.signUpUser(email, password, username, privacyPolice, signUpDate);
        if(registrationSuccess === 'auth') {
          this.toChooseAvatar();
          this.loadingScreen = false;
        }
        if (registrationSuccess === 'auth/invalid-recipient-email'|| registrationSuccess === 'auth/invalid-email') {
          this.showInputInformationEmailInputEmpty = true;
          this.loadingScreen = false;
          return;
        }
         if (registrationSuccess === 'weak-password') {
          this.showInputInformationPassword = true;
          this.loadingScreen = false;
          return;
        }
        if (registrationSuccess === 'auth/email-already-in-use') {
          this.showInputInformationEmailforgive = true;
          this.loadingScreen = false;
          return;
        }
      }
  }

  backToLogIn() {
    this.backToLoginClicked.emit();
  }

  toChooseAvatar() {
    this.loadingScreen = true;
    this.continueToChooseAvatar.emit();
  }

  openPrivacyPoliceComponent() {
    this.openPrivacyPolice.emit();
  }

  isValidEmail(email: string): boolean {
    this.loadingScreen = true;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    setTimeout(() => {
      this.loadingScreen = false;
    }, 100);
    return emailRegex.test(email);
  }

}
