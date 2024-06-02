import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogCreateChannelComponent } from '../../dialog-create-channel/dialog-create-channel.component';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import {
  Firestore,
  onSnapshot,
  collection,
  doc,
  getDoc,
} from '@angular/fire/firestore';
import { Channel } from './../../../models/channel.class';
import { FirestoreService } from '../../firestore.service';
import { ChannelService } from '../../services/channel.service';
import { ChatService } from '../../services/chat.service';
import { ChannelchatComponent } from '../../chats/channelchat/channelchat.component';
import { log } from 'console';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.scss',
})
export class WorkspaceComponent implements OnInit, OnDestroy {
  @ViewChild(ChannelchatComponent) channelchatComponent!: ChannelchatComponent;

  displayUsers: boolean = false;
  channel = new Channel();
  allChannels: any = [];
  filteredChannels: any[] = [];
  allUsers: any[] = [];
  currentUid: any;
  currentUser: any;
  otherUsers: any = [];
  selectedChannelName: string | null = null;
  currentChannelId: string = '';
  showChannel = false;

  constructor(
    public dialog: MatDialog,
    private readonly firestore: Firestore,
    private firestoreService: FirestoreService,
    public channelService: ChannelService,
    public chatService: ChatService
  ) {
    onSnapshot(collection(this.firestore, 'channels'), (list) => {
      this.allChannels = list.docs.map((doc) => doc.data());
      this.filterChannels();
    });
  }

  @Output() userDetails = new EventEmitter<string>();
  @Output() disyplayEmptyChat = new EventEmitter<boolean>();
  userStatus$: any;
  userStatus: any = 'active';
  private userStatusSubscription: Subscription | undefined;

  showAllChannles() {
    if (this.showChannel) {
      this.showChannel = false;
    } else {
      this.showChannel = true;
    }
  }

  openCreateChannelDialog() {
    this.dialog.open(DialogCreateChannelComponent);
  }

  dropDownMessages() {
    if (this.displayUsers) {
      this.displayUsers = false;
    } else {
      this.displayUsers = true;
    }
  }

  openChannelChat(channelId: string) {
    this.channelService.setCurrentChannelId(channelId);
    this.channelService.showChannelChat = true;
    this.chatService.showOwnChat = false;
    this.channelService.showThreadWindow = false;
  }

  openEmptyChat() {
    this.disyplayEmptyChat.emit(true);
  }
  async openChat(user: any) {
    this.userDetails.emit(user);
    await this.chatService.createChat(user);
    await this.chatService.loadMessages(user);
  }

  getallUsers() {
    this.firestoreService
      .getAllUsers()
      .then((users) => {
        this.allUsers = users;
        this.currentUid = this.firestoreService.currentuid;
        for (let user of this.allUsers) {
          if (user.uid === this.currentUid) {
            this.currentUser = user;
          } else {
            this.otherUsers.push(user);
          }
        }
        if (!this.currentUser) {
          console.error('Current user not found');
        }
      })
      .catch((error) => {
        console.error('Error fetching users:', error);
      });
  }

  changeStatus(event: Event) {
    const newStatus = (event.target as HTMLSelectElement).value;
    this.firestoreService.setUserStatus(
      this.firestoreService.currentuid,
      newStatus
    );

    this.userStatus = this.firestoreService.testStatus;
  }

  ngOnInit(): void {
    this.getallUsers();
    this.channelService.getChannels().then((channels) => {
      this.allChannels = channels;
      this.filterChannels();
    });

    this.userStatus$ = this.firestoreService.getUserStatus(
      this.firestoreService.currentuid
    );

    this.userStatusSubscription = this.userStatus$.subscribe((status: any) => {
      this.userStatus = status;
    });
  }

  ngOnDestroy(): void {
    if (this.userStatusSubscription) {
      this.userStatusSubscription.unsubscribe();
    }
  }

  filterChannels() {
    const currentUserId = this.firestoreService.currentuid;
    this.filteredChannels = this.allChannels.filter(
      (channel: Channel) =>
        channel.users && channel.users.includes(currentUserId)
    );
  }
}
