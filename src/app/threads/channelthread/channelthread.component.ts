import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ChannelService } from '../../services/channel.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TimestampPipe } from '../../shared/pipes/timestamp.pipe';
import { TextEditorComponent } from '../../shared/text-editor/text-editor.component';
import { FirestoreService } from '../../firestore.service';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { DialogContactInfoComponent } from '../../dialog-contact-info/dialog-contact-info.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-channelthread',
  standalone: true,
  imports: [FormsModule, CommonModule, TimestampPipe, TextEditorComponent, MatButtonModule, MatIconModule, MatMenuModule, DialogContactInfoComponent],
  templateUrl: './channelthread.component.html',
  styleUrls: ['./channelthread.component.scss', '../threads.component.scss'],
})
export class ChannelthreadComponent implements OnInit, OnDestroy {
  @Input() userDialogData: any;
  currentMessageId: string = '';
  currentMessageComments: any[] = [];
  allUsers: any[] = [];
  private channelSubscription: Subscription | null = null;
  private messageIdSubscription: Subscription | null = null;
  private messageSubscription: Subscription | null = null;
  currentChannelId: string = '';
  currentMessage: any;
  isHoveredArray: boolean[] = [];
  isHovered: boolean = false;
  menuClicked = false;
  currentMessageIndex: number | null = null;
  editingCommentIndex: number | null = null;
  editedMessageText: string = '';
  editedCommentText: string = '';
  editedCurrentMessage: boolean = false;

  userForm: any;

  constructor(
    public channelService: ChannelService,
    public firestoreService: FirestoreService,
    public dialog: MatDialog
  ) {}

  closeThreadWindow() {
    this.channelService.showThreadWindow = false;
    if(window.innerWidth <= 850) {
      this.channelService.showChannelChat = true;
    }
  }

  async ngOnInit(): Promise<void> {
    // this.messageIdSubscription = this.channelService.currentMessageIdChanged.subscribe((messageId) => {
    //   this.loadCommentsForCurrentMessage(messageId);
    // });
    // this.channelSubscription = this.channelService.currentMessageCommentsChanged.subscribe((comments) => {
    //   this.currentMessageComments = comments;
    // });
    // this.messageSubscription = this.channelService.currentMessageChanged.subscribe((message) => {
    //   this.currentMessage = message;
    // });
    // this.currentMessage = this.channelService.getCurrentMessage();
    // this.allUsers = await this.firestoreService.getAllUsers();
    // this.currentMessageId = this.channelService.getCurrentMessageId();
    // this.loadCommentsForCurrentMessage(this.currentMessageId);
  }

  ngOnDestroy(): void {
    if (this.messageIdSubscription) {
      this.messageIdSubscription.unsubscribe();
    }
    if(this.channelSubscription) {
      this.channelSubscription.unsubscribe();
    }
    if(this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }

  async loadCommentsForCurrentMessage(messageId: string) {
    const currentMessage = this.getCurrentMessageById(messageId);
    this.currentMessage = currentMessage;
    if (currentMessage) {
      this.currentMessageComments = await this.loadCommentsWithAuthorNames(currentMessage.comments);
    } else {
      this.currentMessageComments = [];
    }
  }

  getCurrentMessageById(messageId: string) {
    return this.channelService.messages.find(
      (message: any) => message.messageId === messageId
    );
  }

  async loadCommentsWithAuthorNames(comments: any[]): Promise<any[]> {
    if (!comments || comments.length === 0) {
      return [];
    }
    const commentsWithAuthorNames = await Promise.all(
      comments.map(async (comment: any) => {
        const authorName = await this.channelService.getAuthorName(comment.uid);
        return {
          ...comment,
          authorName: authorName ?? comment.uid,
        };
      })
    );
    return commentsWithAuthorNames;
  }

  getMemberAvatar(memberId: string): string {
    const member = this.allUsers.find(user => user.uid === memberId);
    return member ? member.photo : '';
  }

  updateHoverState(index: number, isHovered: boolean) {
    if (!this.menuClicked) {
      this.isHoveredArray[index] = isHovered;
    }
  }

  updateHoverStateCurrentMessage(isHovered: boolean) {
    if (!this.menuClicked) {
      this.isHovered = isHovered;
    }
  }

  menuClosed() {
    if (this.currentMessageIndex !== null && !this.menuClicked) {
      this.isHoveredArray[this.currentMessageIndex] = true;
    }
    this.menuClicked = false;
    this.currentMessageIndex = null;
  }

  menuOpened(index: number) {
    this.menuClicked = true;
    this.currentMessageIndex = index;
    this.isHoveredArray[index] = true;
  }

  menuOpenedCurrentMessage() {
    this.menuClicked = true;
  }

  startEditingComment(index: number, comment: string) {
    this.editingCommentIndex = index;
    this.editedCommentText = comment;
  }

  startEditingCurrentMessage(message: string) {
    this.editedCurrentMessage = true;
    this.editedMessageText = message;
  }

  async saveEditedComment(index: number) {
    try {
      const comment = this.currentMessageComments[index];
      comment.comment = this.editedCommentText;
      await this.channelService.updateComment(this.currentMessage.messageId, comment.commentId, this.editedCommentText);
      this.editingCommentIndex = null;
      this.editedCommentText = '';
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  }

  async saveEditedCurrentMessage() {
    try {
      this.currentMessage.message = this.editedMessageText;
      await this.channelService.updateMessage(this.currentMessage.messageId, this.editedMessageText);
      this.editedCurrentMessage = false;
      this.editedMessageText = '';
    } catch (error) {
      console.error('Error updating message:', error);
    }
  }

  cancelEditingMessage() {
    this.editedCurrentMessage = false;
    this.editingCommentIndex = null;
    this.editedMessageText = '';
  }

  openContactInfoDialog(userDetails: any) {
    const userDocRef = this.firestoreService.getUserDocRef(userDetails);
  }

  private handleUserDocumentSnapshot(doc: any) {
    if (doc.exists()) {
      const userData = doc.data();
      this.setUserForm(doc.id, userData);
      this.setUserDialogData();
      this.openUserDialog();
    }
  }

  private setUserForm(id: string, userData: any) {
    this.userForm = { id, ...userData };
  }

  private setUserDialogData() {
    this.userDialogData = {
      username: this.userForm['username'],
      email: this.userForm['email'],
      photo: this.userForm['photo'],
      uid: this.userForm['uid'],
      logIndate: this.userForm['logIndate'],
      logOutDate: this.userForm['logOutDate'],
      signUpdate: this.userForm['signUpdate'],
      emailVerified: this.firestoreService.auth.currentUser.emailVerified
    };
  }

  private openUserDialog() {
    this.dialog.open(DialogContactInfoComponent, {
      data: this.userDialogData
    });
  }
}
