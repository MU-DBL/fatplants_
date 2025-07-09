import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChatService } from './chat.service';

interface ChatMsg {
  sender: 'user' | 'bot';
  text: SafeHtml;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements AfterViewInit {
  @ViewChild('chatBody') chatBody!: ElementRef<HTMLDivElement>;

  messages: ChatMsg[] = [];
  inputText = '';
  loading = false;

  constructor(
    private chat: ChatService,
    private sanitizer: DomSanitizer
  ) {
    // Intro / system message
    const intro = `This is a demo of chat box frontend. Everything sent to the echo server will be sent back.`;
    this.messages.push({
      sender: 'bot',
      text: this.sanitizer.bypassSecurityTrustHtml(intro),
    });
  }

  ngAfterViewInit(): void {
    // Ensure the intro is visible
    this.scrollToBottom();
  }

  autoResize(evt: Event) {
    const el = evt.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  send() {
    const userText = this.inputText.trim();
    if (!userText) return;

    // Push user msg
    this.messages.push({
      sender: 'user',
      text: this.sanitizer.bypassSecurityTrustHtml(userText),
    });
    this.inputText = '';
    this.loading = true;
    this.scrollToBottom();

    // Call backend
    this.chat.postMessage({ message: userText }).subscribe({
      next: (res) => {
        const reply = res?.parsedBody.message ?? '(No response)';
        this.messages.push({
          sender: 'bot',
          text: this.sanitizer.bypassSecurityTrustHtml(reply),
        });
        this.scrollToBottom();
      },
      error: () => {
        this.messages.push({
          sender: 'bot',
          text: this.sanitizer.bypassSecurityTrustHtml(
            '<i>Oops! Something went wrong.</i>'
          ),
        });
        this.scrollToBottom();
      },
      complete: () => (this.loading = false),
    });
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.chatBody.nativeElement;
      el.scrollTop = el.scrollHeight;
    });
  }
}