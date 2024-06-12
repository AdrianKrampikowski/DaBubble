import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges, OnDestroy } from '@angular/core';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { ChatService } from '../../services/chat.service';
import { TimestampPipe } from '../../shared/pipes/timestamp.pipe';
import { TextEditorComponent } from '../../shared/text-editor/text-editor.component';
import { MatDialog } from '@angular/material/dialog';
import { DialogAddPeopleComponent } from '../../dialog-add-people/dialog-add-people.component';
import { DialogChannelInfoComponent } from '../../dialog-channel-info/dialog-channel-info.component';
import { DialogContactInfoComponent } from '../../dialog-contact-info/dialog-contact-info.component';
import { DialogMembersComponent } from '../../dialog-members/dialog-members.component';
import { FirestoreService } from '../../firestore.service';
import { ChannelService } from '../../services/channel.service';
import { ThreadService } from '../../services/thread.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { EmojiComponent } from '@ctrl/ngx-emoji-mart/ngx-emoji';
import { log } from 'console';
import { Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-ownchat',
  standalone: true,
  imports: [ TextEditorComponent, EmojiComponent, PickerComponent, TimestampPipe, CommonModule, TimestampPipe, FormsModule, MatIconModule, MatMenuModule, MatButtonModule],
  templateUrl: './ownchat.component.html',
  styleUrls: ['./ownchat.component.scss', '../chats.component.scss'],
})
export class OwnchatComponent implements OnChanges, OnInit, OnDestroy {
  constructor(private firestore: Firestore,  public dialog: MatDialog, public chatService: ChatService, public threadService: ThreadService, public firestoreService: FirestoreService) {}
  @Input() userDetails: any;
  private messagesSubscription: Subscription | undefined;
  private filteredUsersSubscription: Subscription | undefined;
  private userDetailsSubscription: Subscription | undefined;
  private chatSubscription: Subscription | undefined;
  private documentIDSubsrciption: Subscription | null = null;

  messages: any = [];
  allUsers: any[] = [];
  isHoveredArray: boolean[] = [];
  currentMessageIndex: number | null = null;
  openEmojiPicker = false;
  menuClicked = false;
  participants: any;
  filteredUsers: any;
  message: any;
  emojiMessageId: any;
  foundMessage: any;
  userInformation: any;

  chatData: any;
  participantUser: any = {};
  currentChatID: any;

  emoji = [
    {
      id: 'white_check_mark',
      name: 'White Heavy Check Mark',
      colons: ':white_check_mark::skin-tone-3:',
      text: '',
      emoticons: [],
      skin: 3,
      native: '✅',
    },
    {
      id: 'raised_hands',
      name: 'Person Raising Both Hands in Celebration',
      colons: ':raised_hands::skin-tone-3:',
      text: '',
      emoticons: [],
      skin: 3,
      native: '🙌',
    },
  ];

  ngOnInit(): void {
    this.userDetailsSubscription = this.chatService.userInformation$.subscribe(
      (data) => {
        this.userInformation = data;
      }
    );

    this.messagesSubscription = this.chatService.messages$.subscribe(
      (messages) => {
        // this.messages = messages;
      }
    );

    this.filteredUsersSubscription = this.chatService.filteredUsers$.subscribe(
      (users) => {
        this.filteredUsers = users;
      }
    );

    this.documentIDSubsrciption = this.chatService.documentID$.subscribe(
      (docID)=> {
        if(docID) {
          this.messages = []
          this.currentChatID = docID
          this.loadChatMessages(this.currentChatID)
        }
      },
    );

    this.chatSubscription = this.chatService.chatData$.subscribe(data => {
      this.chatData = data;

      if (this.chatData?.participants?.length === 1) {
        this.loadPrivateChat()
      } else if (this.chatData?.participants?.length > 1) {
        this.loadParticipantUserData();
      } else {
        console.log('Ungültige Chatdaten');
      }
    });

  }

  ngOnDestroy(): void {
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }

    if (this.filteredUsersSubscription) {
      this.filteredUsersSubscription.unsubscribe();
    }

    if (this.userDetailsSubscription) {
      this.userDetailsSubscription.unsubscribe();
    }

    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
    if (this.documentIDSubsrciption) {
      this.documentIDSubsrciption.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.userDetails != '' && changes['userDetails']) {
      this.messages = this.chatService.messages;
    }
  }

  async loadChatMessages(docID: any) {

    const docRef = doc(this.firestore, "newchats", docID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        console.log("Document data:", docSnap.data());
        const messagesRef = collection(this.firestore, "newchats", docID, "messages");
        const messagesSnap = await getDocs(messagesRef);
        messagesSnap.forEach((messageDoc) => {
            let messageData = messageDoc.data();
            messageData['id'] = messageDoc.id;
            if (messageData['createdAt']) {
                this.messages.push(messageData);
            } else {
                console.error("Invalid timestamp format:", messageData['createdAt']);
            }
        });
        this.messages.sort((a: any, b: any) => a.createdAt - b.createdAt);
        this.messages.forEach((message: any) => {
            console.log("Message data:", message);
        });
    } else {
        console.log("No such document!");
    }
}

  async loadPrivateChat() {
    const currentUserID = localStorage.getItem('uid');
    if (currentUserID) {
      const docRef = doc(this.firestore, "users", currentUserID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        this.participantUser = {
          email: userData['email'],
          signUpdate: userData['signUpdate'],
          logIndate: userData['logIndate'],
          logOutDate: userData['logOutDate'],
          photo: userData['photo'],
          uid: userData['uid'],
          username: userData['username'],
        };
      } else {
        console.log("Kein Dokument des Users gefunden");
        window.location.reload();
      }
    }
  }

  async loadParticipantUserData() {
    const currentUserID = localStorage.getItem('uid');
    if (this.chatData && this.chatData.participants) {
      const otherParticipant = this.chatData.participants.find((participant: string) => participant !== currentUserID);
      if (otherParticipant) {
        const docRef = doc(this.firestore, "users", otherParticipant);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          this.participantUser = {
            email: userData['email'],
            signUpdate: userData['signUpdate'],
            logIndate: userData['logIndate'],
            logOutDate: userData['logOutDate'],
            photo: userData['photo'],
            uid: userData['uid'],
            username: userData['username'],
          };
        } else {
          console.log("Kein Dokument des Users gefunden");
          window.location.reload();
        }
      } else {
        console.log("Kein anderer Teilnehmer gefunden");
      }
    } else {
      console.log('Chat data or participants are not available yet');
    }
  }




  openEmojiMartPicker(message: { id: number; text: string }) {
    this.emojiMessageId = message.id;
    this.openEmojiPicker = true;
    this.foundMessage = this.messages.find(
      (msg: any) => msg.id === this.emojiMessageId
    );

    if (this.foundMessage) {
    } else {
      console.log('Message not found');
    }
  }

  getMessageForSpefifiedEmoji(
    emoji: any,
    message: { id: number; text: string }
  ) {
    if (emoji === 'white_check_mark' || 'raised_hands') {
      this.emojiMessageId = message.id;
      this.foundMessage = this.messages.find(
        (msg: any) => msg.id === this.emojiMessageId
      );
      if (this.foundMessage) {
      } else {
        console.log('Message not found');
      }
      this.addSpecifiedEmoji(emoji);
    }
  }

  setEmojiInData(emojiIcon: any, emojiID: any, currentUserID: any, reaction: any, message: any) {
    if (!currentUserID || !reaction) {
        console.log('Nachricht nicht gefunden');
        return;
    }

    // Initialize emojiReactions if it doesn't exist
    if (!reaction.emojiReactions) {
        reaction.emojiReactions = {};
    }

    // Check if emojiID entry exists, if not, initialize it
    if (!reaction.emojiReactions[emojiID]) {
        reaction.emojiReactions[emojiID] = {
            emojiID: emojiID,
            emojiIcon: emojiIcon,
            userId: [],
            emojiCounter: 0,
        };
    }

    // Push currentUserID and increment emojiCounter
    reaction.emojiReactions[emojiID].userId.push(currentUserID);
    reaction.emojiReactions[emojiID].emojiCounter += 1;

    console.log('Aktualisierte Nachricht:', reaction);
    console.log(reaction.emojiReactions);
    this.openEmojiPicker = false;
    console.log(this.userInformation);
    console.log(reaction.id);
    console.log(this.chatService.currentuid);
    // this.chatService.uploadEmojiReaction(reaction.emojiReactions, reaction.id);
}



  getEmojiReactions(message: any) {
    const reactionsArray = [];
    for (const emojiID in message.emojiReactions) {
      if (message.emojiReactions.hasOwnProperty(emojiID)) {
        const emojiReactions = message.emojiReactions[emojiID];
        for (const emojiIcon in emojiReactions) {
          if (emojiReactions.hasOwnProperty(emojiIcon)) {
            reactionsArray.push({
              id: emojiID,
              icon: emojiIcon,
              counter: emojiReactions[emojiIcon].emojiCounter,
            });
          }
        }
      }
    }
    return reactionsArray;
  }

  addSpecifiedEmoji(emoji: any) {
    console.log('Emoji selected', event);
    const emojiIcon = emoji.native;
    const emojiID = emoji.id;
    const currentUserID = localStorage.getItem('uid');
    const reaction = this.messages.find(
      (msg: any) => msg.id === this.emojiMessageId
    );
    this.setEmojiInData(emojiIcon, emojiID, currentUserID, reaction, this.message);
  }

  addEmoji(event: any) {
    console.log('Emoji selected', event);
    const emojiIcon = event.emoji.native;
    const emojiID = event.emoji.id;
    const currentUserID = localStorage.getItem('uid');
    const reaction = this.messages.find(
      (msg: any) => msg.id === this.emojiMessageId
    );
    this.setEmojiInData(emojiIcon, emojiID, currentUserID, reaction, this.message);
  }

  addReaction() {
    console.log('emoji geklickt');
  }

  closeEmojiMartPicker() {
    this.openEmojiPicker = false;
    // this.chatService.emojiPicker(false);
  }

  openMemberDialog() {
    this.dialog.open(DialogMembersComponent);
  }

  openChannelInfoDialog() {
    this.dialog.open(DialogChannelInfoComponent);
  }

  async openContactInfoDialogHeader(userDetails: any) {
    this.dialog.open(DialogContactInfoComponent, {
      data: userDetails,
    });
  }

  async openContactInfoDialog(uid: any) {
    let allUsers = await this.firestoreService.getAllUsers();
    console.log(allUsers)
    let userDetails = allUsers.filter(
      (user) => user.uid == uid
    );
    this.dialog.open(DialogContactInfoComponent, {
      data: userDetails[0],
    });
  }

  openThread(messageInformation: any) {
    let chatDocId = this.chatService.chatDocId;
    this.threadService.displayThread = true;
    this.threadService.getMessage(messageInformation, chatDocId);
  }

  currentTime(currentMessageTime: any): boolean {
    const currentDate = new Date();
    const currentDateMilliseconds = currentDate.getTime();
    const timestampMilliseconds = currentMessageTime;
    const differenceMilliseconds =
      currentDateMilliseconds - timestampMilliseconds;
    const thirtyMinutesMilliseconds = 60 * 24 * 60 * 1000;
    if (differenceMilliseconds <= thirtyMinutesMilliseconds) {
      return true;
    } else {
      return false;
    }
  }

  shouldShowSeparator(index: number): boolean {
    if (index === 0) {
      return true;
    }
    const currentMessage = this.messages[index];
    const previousMessage = this.messages[index - 1];
    const currentDate = new Date(Number(currentMessage.createdAt));
    const previousDate = new Date(Number(previousMessage.createdAt));
    if (isNaN(currentDate.getTime()) || isNaN(previousDate.getTime())) {
      console.error(
        `Invalid Date - Current Message: ${JSON.stringify(
          currentMessage
        )}, Previous Message: ${JSON.stringify(previousMessage)}`
      );
      return false;
    }
    const currentDateString = currentDate.toDateString();
    const previousDateString = previousDate.toDateString();
    const showSeparator = currentDateString !== previousDateString;
    return showSeparator;
  }

  updateHoverState(index: number, isHovered: boolean) {
    if (!this.menuClicked) {
      this.isHoveredArray[index] = isHovered;
    }
  }

  menuClosed(index: any) {
    if (this.currentMessageIndex !== null && !this.menuClicked) {
      this.isHoveredArray[this.currentMessageIndex] = true;
    }
    this.menuClicked = false;
    this.currentMessageIndex = null;
    this.chatService.editMessage = true;
    this.chatService.editIndex = index;
  }

  menuOpened(index: number, message: any) {
    this.menuClicked = true;
    this.currentMessageIndex = index;
    this.isHoveredArray[index] = true;
  }
}
