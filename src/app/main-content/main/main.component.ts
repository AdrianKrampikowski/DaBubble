import { DialogCreateChannelComponent } from './../../dialog-create-channel/dialog-create-channel.component';
import { ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, ViewChild,} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { WorkspaceComponent } from '../../workspace/workspace/workspace.component';
import { ChannelchatComponent } from '../../chats/channelchat/channelchat.component';
import { DialogProfileComponent } from '../../dialog-profile/dialog-profile.component';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate,} from '@angular/animations';
import { DialogChannelInfoComponent } from '../../dialog-channel-info/dialog-channel-info.component';
import { DialogMembersComponent } from '../../dialog-members/dialog-members.component';
import { ThreadComponent } from '../../threads/thread/thread.component';
import { ChannelthreadComponent } from '../../threads/channelthread/channelthread.component';
import { HeaderComponent } from '../../header/header.component';
import { ChannelService } from '../../services/channel.service';
import { OwnchatComponent } from '../../chats/ownchat/ownchat.component';
import { EmptychatComponent } from '../../chats/emptychat/emptychat.component';
import { FirestoreService } from '../../firestore.service';
import { ChatService } from '../../services/chat.service';
import { ThreadService } from '../../services/thread.service';
import { Subscription } from 'rxjs';
import { IdleService } from '../../services/idle.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [ MatMenuModule, MatButtonModule, RouterOutlet, CommonModule, WorkspaceComponent, ChannelchatComponent, ThreadComponent, ChannelthreadComponent, EmptychatComponent, OwnchatComponent, HeaderComponent,],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent implements OnInit {
  constructor( public channelService: ChannelService, public firestoreService: FirestoreService, public chatService: ChatService, public threadService: ThreadService, private cdRef: ChangeDetectorRef, private idleService: IdleService) {}

  displayThread: boolean = false;
  userDetails: any = '';
  channelDetails: any = '';
  selectedMessageId: string = '';
  emojiPickerChat = false;
  emojiPickerChatReaction = false;
  emojiPickerThread = false;
  emojiPickerThreadReaction = false;
  emojiPickerChannel = false;
  emojiPickerChannelReaction = false;
  associatedUserChat = false;
  associatedUserChatThread = false;
  isIdle: number = 0;

  private idleSubscription: Subscription | null = null;
  private noMouseMove: Subscription | null = null;
  private mouseMoveSubscription: Subscription | null = null;
  private noKeyPress: Subscription | null = null;
  private keyPressSubscription: Subscription | null = null;
  private emojiPickerChatSubscription: Subscription | null = null;
  private emojiPickerChatReactionSubscription: Subscription | null = null;

  private emojiPickerThreadSubscription: Subscription | null = null;
  private emojiPickerThreadReactionSubscription: Subscription | null = null;

  private emojiPickerChannelSubscription: Subscription | null = null;
  private emojiPickerChannelReactionSubscription: Subscription | null = null;

  private AssociatedUserChatSubscription: Subscription | null = null;
  private AssociatedUserChatThreadSubscription: Subscription | null = null;

  private activityAfterIdleSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.updateScreenWidthFlags();
    if (!this.firestoreService.isScreenWide) {
      this.chatService.showOwnChat = false;
      this.chatService.showEmptyChat = false;
      this.threadService.displayThread = false;
    }
    this.idleSubscription = this.idleService
      .isUserIdle()
      .subscribe((idle) => {});

    this.noMouseMove = this.idleService.noMouseMoveAfterIdle().subscribe(() => {
      this.handleIdle();
    });

    this.mouseMoveSubscription = this.idleService
      .onMouseMoveAfterIdle()
      .subscribe(() => {
        this.handleActive();
      });

    this.noKeyPress = this.idleService.noKeyPressAfterIdle().subscribe(() => {
      this.handleIdle();
    });

    this.keyPressSubscription = this.idleService
      .onKeyPressAfterIdle()
      .subscribe(() => {
        this.handleActive();
      });

    this.emojiPickerChatSubscription = this.chatService.emojiPickerChat$.subscribe(
      (state: boolean) => {
        this.emojiPickerChat = state;
      }
    );

    this.emojiPickerChatReactionSubscription = this.chatService.emojiPickerChatReaction$.subscribe(
      (state: boolean) => {
        this.emojiPickerChatReaction = state;
      }
    );

    this.emojiPickerThreadSubscription = this.chatService.emojiPickerThread$.subscribe(
      (state: boolean) => {
        this.emojiPickerThread = state;
      }
    );

    this.emojiPickerThreadReactionSubscription = this.chatService.emojiPickerThreadRection$.subscribe(
      (state: boolean) => {
        this.emojiPickerThreadReaction = state;
      }
    );

    this.emojiPickerChannelSubscription = this.chatService.emojiPickerChannel$.subscribe(
      (state: boolean) => {
        this.emojiPickerChannel = state;
      }
    );

    this.emojiPickerChannelReactionSubscription = this.chatService.emojiPickerChannelReaction$.subscribe(
      (state: boolean) => {
        this.emojiPickerChannelReaction = state;
      }
    );

    this.AssociatedUserChatSubscription =
      this.chatService.associatedUserChat$.subscribe((state: boolean) => {
        this.associatedUserChat = state;
      });

      this.AssociatedUserChatThreadSubscription =
      this.chatService.associatedUserChatThread$.subscribe((state: boolean) => {
        this.associatedUserChatThread = state;
      });
  }

  ngOnDestroy(): void {
    if (this.idleSubscription) {
      this.idleSubscription.unsubscribe();
    }
    if (this.noMouseMove) {
      this.noMouseMove.unsubscribe();
    }
    if (this.mouseMoveSubscription) {
      this.mouseMoveSubscription.unsubscribe();
    }
    if (this.noKeyPress) {
      this.noKeyPress.unsubscribe();
    }
    if (this.keyPressSubscription) {
      this.keyPressSubscription.unsubscribe();
    }
    if (this.emojiPickerChatSubscription) {
      this.emojiPickerChatSubscription.unsubscribe();
    }
    if (this.emojiPickerChatReactionSubscription) {
      this.emojiPickerChatReactionSubscription.unsubscribe();
    }
    if (this.emojiPickerThreadSubscription) {
      this.emojiPickerThreadSubscription.unsubscribe();
    }
    if (this.emojiPickerThreadReactionSubscription) {
      this.emojiPickerThreadReactionSubscription.unsubscribe();
    }
    if (this.emojiPickerChannelSubscription) {
      this.emojiPickerChannelSubscription.unsubscribe();
    }
    if (this.emojiPickerChannelReactionSubscription) {
      this.emojiPickerChannelReactionSubscription.unsubscribe();
    }
    if (this.AssociatedUserChatSubscription) {
      this.AssociatedUserChatSubscription.unsubscribe();
    }

    if (this.AssociatedUserChatThreadSubscription) {
      this.AssociatedUserChatThreadSubscription.unsubscribe();
    }
  }

  closeEmojiPickerChat() {
    this.chatService.emojiPickerChat(false);
  }

  closeEmojiPickerChatReaction() {
    this.chatService.emojiPickerChatReaction(false);
  }

  closeEmojiPickerThread() {
    this.chatService.emojiPickerThread(false);
  }

  closeEmojiPickerThreadReaction() {
    this.chatService.emojiPickerThreadReaction(false);
  }

  closeEmojiPickerChannel() {
    this.chatService.emojiPickerChannel(false);
  }

  closeEmojiPickerChannelReaction() {
    this.chatService.emojiPickerChannelReaction(false);
  }

  closeAssociatedUserChat() {
    this.chatService.associatedUserChat(false);
  }

  closeAssociatedUserChatThread() {
    this.chatService.associatedUserChatThread(false);
  }

  showHideWorkspace() {
    if (this.firestoreService.displayWorkspace === false) {
      this.firestoreService.displayWorkspace = true;
    } else {
      this.firestoreService.displayWorkspace = false;
    }
  }

  get showChannelChat(): boolean {
    return this.channelService.showChannelChat;
  }

  get showThreadWindow(): boolean {
    return this.channelService.showThreadWindow;
  }

  openChat(userDetails: any) {
    this.chatService.showEmptyChat = false;
    this.chatService.showOwnChat = true;
    this.userDetails = userDetails;
    this.cdRef.detectChanges();
  }

  channelInformaion(channelDetails: any) {
    this.channelDetails = channelDetails;
    this.cdRef.detectChanges();
  }

  handleIdle() {
    if (this.idleService.currentUserStatus == 'active') {
      let key = this.firestoreService.currentuid;
      let status = 'simpleaway';
      this.idleService.updateActiveStatus(key, status);
    }
  }

  handleActive() {
    if (this.idleService.currentUserStatus == 'simpleaway') {
      let key = this.firestoreService.currentuid;
      let status = 'active';
      this.idleService.updateActiveStatus(key, status);
    }
  }

  @HostListener('window:resize', ['$event'])
onResize(event: Event) {
  this.updateScreenWidthFlags();
}

updateScreenWidthFlags() {
  const width = window.innerWidth;
  this.firestoreService.isScreenWide = width > 850;
  this.firestoreService.isScreenWide1300px = width > 1300;
  if(!this.firestoreService.isScreenWide) {
    this.chatService.showEmptyChat = false;
    this.channelService.showChannelChat = false;
    this.chatService.showOwnChat = false;
    this.threadService.displayThread = false;
    this.firestoreService.displayWorkspace = true
  } else if (!this.firestoreService.isScreenWide1300px &&  this.channelService.showChannelChat) {
    this.chatService.showEmptyChat = false;
    this.channelService.showChannelChat = true;
    this.chatService.showOwnChat = false;
    this.threadService.displayThread = false;
  } else if (!this.firestoreService.isScreenWide1300px &&  this.chatService.showOwnChat) {
    this.chatService.showEmptyChat = false;
    this.channelService.showChannelChat = false;
    this.chatService.showOwnChat = true;
    this.threadService.displayThread = false;
  } else if (!this.firestoreService.isScreenWide1300px) {
    this.chatService.showEmptyChat = true;
    this.channelService.showChannelChat = false;
    this.chatService.showOwnChat = false;
    this.threadService.displayThread = false;
  } else if (this.firestoreService.isScreenWide1300px) {
    this.chatService.showEmptyChat = true;
    this.channelService.showChannelChat = false;
    this.chatService.showOwnChat = false;
    this.threadService.displayThread = false;
  }
}
}
