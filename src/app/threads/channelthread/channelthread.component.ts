import { Component, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ChannelService } from '../../services/channel.service';
import { ChatService } from '../../services/chat.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GenerateIdsService } from '../../services/generate-ids.service';
import { Firestore, query, collection, onSnapshot } from '@angular/fire/firestore';
import { TimestampPipe } from '../../shared/pipes/timestamp.pipe';
import { ChannelchatComponent } from '../../chats/channelchat/channelchat.component';
import { Subscription } from 'rxjs';
import { EventEmitter } from 'node:stream';
import { FirestoreService } from '../../firestore.service';

@Component({
  selector: 'app-channelthread',
  standalone: true,
  imports: [ FormsModule, CommonModule, TimestampPipe ],
  templateUrl: './channelthread.component.html',
  styleUrls: ['./channelthread.component.scss', '../threads.component.scss'],
})
export class ChannelthreadComponent implements OnChanges {
  channelId: string = '';
  messageId: string = '';
  comments: string[] = [];
  currentChannelId: string = '';
  currentMessageId: string = '';
  currentMessageComments: { id: string, comment: string, createdAt: string, uid: string }[] = []; 
  messages: any[] = [];

  constructor(private chatService: ChatService,
    private generateId: GenerateIdsService,
    private firestore: Firestore,
    public channelService: ChannelService,
    public firestoreService: FirestoreService) {}

  closeThreadWindow(){
    this.channelService.showThreadWindow = false;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentMessageId']) {
      this.loadCommentsForCurrentMessage(changes['currentMessageId'].currentValue);
    }
  }

  async ngOnInit(): Promise<void> {
    this.channelService.currentMessageIdChanged.subscribe(messageId => {
      this.loadCommentsForCurrentMessage(messageId);
    });
    this.currentMessageId = this.channelService.getCurrentMessageId();
    this.loadCommentsForCurrentMessage(this.currentMessageId);
  }

  loadCommentsForCurrentMessage(messageId: string) {
    const currentMessage = this.channelService.messages.find(message => message.messageId === messageId);
    if (currentMessage) {
      this.currentMessageComments = currentMessage.comments;
    } else {
      this.currentMessageComments = [];
    }
  }

  comment: any = '';

  sendCommentToMessage() {
    const currentMessageId = this.channelService.getCurrentMessageId();
    const currentUid = this.firestoreService.currentuid;
    if (currentMessageId) {
      const timestamp: number = Date.now();
      const timestampString: string = timestamp.toString();
      const newComment = {
        id: this.generateId.generateId(),
        comment: this.comment,
        createdAt: timestampString,
        uid: currentUid,
      };
      // Überprüfe, ob currentMessageComments initialisiert wurde
      if (this.currentMessageComments) {
        this.currentMessageComments.push(newComment);
      } else {
        // Wenn currentMessageComments nicht initialisiert wurde, initialisiere es mit einem leeren Array und füge dann den Kommentar hinzu
        this.currentMessageComments = [newComment];
      }
      this.chatService.sendCommentToChannel(currentMessageId, newComment);
      this.updateCommentCount(currentMessageId);
      this.updateLastCommentTime(currentMessageId, timestampString);
      this.comment = '';
    } else {
      console.error('Kein aktueller Kanal ausgewählt.');
      // Fehlerfall, falls kein aktueller Kanal ausgewählt ist
    }
  }

  updateCommentCount(messageId: string): void {
    const message = this.channelService.messages.find(msg => msg.messageId === messageId);
    if (message) {
      message.commentCount++;
    }
  }

  updateLastCommentTime(messageId: string, timestamp: string): void {
    const message = this.channelService.messages.find(msg => msg.messageId === messageId);
    if (message) {
      message.lastCommentTime = timestamp;
    }
  }
}