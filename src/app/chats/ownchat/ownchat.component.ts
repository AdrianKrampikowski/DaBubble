import { FirestoreService } from './../../firestore.service';
import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { collection, doc, getDoc, getDocs, onSnapshot, deleteDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ChatService } from '../../services/chat.service';
import { TimestampPipe } from '../../shared/pipes/timestamp.pipe';
import { TextEditorComponent } from '../../shared/text-editor/text-editor.component';
import { MatDialog } from '@angular/material/dialog';
import { DialogChannelInfoComponent } from '../../dialog-channel-info/dialog-channel-info.component';
import { DialogContactInfoComponent } from '../../dialog-contact-info/dialog-contact-info.component';
import { DialogMembersComponent } from '../../dialog-members/dialog-members.component';
import { ThreadService } from '../../services/thread.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { EmojiComponent } from '@ctrl/ngx-emoji-mart/ngx-emoji';
import { Firestore } from '@angular/fire/firestore';
import { TruncatePipe } from '../../shared/pipes/truncate.pipe';
import { TruncateWordsService } from '../../services/truncate-words.service';


@Component({
  selector: 'app-ownchat',
  standalone: true,
  imports: [TextEditorComponent,TruncatePipe, EmojiComponent, PickerComponent, TimestampPipe, CommonModule, TimestampPipe, FormsModule, MatIconModule, MatMenuModule, MatButtonModule],
  templateUrl: './ownchat.component.html',
  styleUrls: ['./ownchat.component.scss', '../chats.component.scss'],
})
export class OwnchatComponent implements OnChanges, OnInit, OnDestroy {
  constructor(public truncateService: TruncateWordsService, private firestore: Firestore,public dialog: MatDialog, public chatService: ChatService, public threadService: ThreadService, public firestoreService: FirestoreService) {
    this.isEditingArray.push(false);
  }
  @Input() userDetails: any;
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild('lastMessage') private lastMessage!: ElementRef;
  private messagesSubscription: Subscription | undefined;
  private filteredUsersSubscription: Subscription | undefined;
  private userDetailsSubscription: Subscription | undefined;
  private chatSubscription: Subscription | undefined;
  private documentIDSubsrciption: Subscription | null = null;
  private clearMessagesSubscription: Subscription | undefined;
  emojiPickerChatReactionSubscription: Subscription | null = null;

  messages: any = [];
  allUsers: any[] = [];
  isHoveredArray: boolean[] = [];
  currentMessageIndex: number | null = null;
  openEmojiPickerChatReaction = false;
  menuClicked = false;
  participants: any;
  filteredUsers: any;
  message: any;
  emojiMessageId: any;
  foundMessage: any;
  userInformation: any;
  chatData: any;
  participantUser: any = [];
  currentChatID: any;
  currentDocID: any;
  currentParticipant: any;
  email: any;
  signUpdate: any;
  logIndate: any;
  logOutDate: any;
  photo: any;
  uid: any;
  username: any;
  currentUserID: any;
  currentUser: any;
  users: Map<string, any> = new Map();
  emojiReactionMessageID: any;
  isEditingArray: boolean[] = [];
  originalMessageContent = '';
  public truncateLimitChatHeader: number | any;
  delayPassed: boolean = false;
  otherUserID: any;
  unsubscribe: any;
  showReactedBy:  any = [];

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

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    const width = (event.target as Window).innerWidth;
    this.truncateLimitChatHeader = this.truncateService.setTruncateLimitChatHeader(width)
  }


  ngOnInit(): void {
    this.messages = [];
    this.truncateLimitChatHeader = this.truncateService.setTruncateLimitChatHeader(window.innerWidth);
    this.emojiPickerChatReactionSubscription =
      this.chatService.emojiPickerChatReaction$.subscribe((state: boolean) => {
        this.openEmojiPickerChatReaction = state;
      });
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

    this.clearMessagesSubscription =
      this.firestoreService.clearMessages$.subscribe(() => {
        this.clearVariables();
      });

    this.documentIDSubsrciption = this.chatService.documentID$.subscribe(
      (docID) => {
        if (docID) {
          this.messages = [];
          this.currentChatID = docID;
          this.loadChatMessages(this.currentChatID);
        }
      }
    );

    this.chatSubscription = this.chatService.chatData$.subscribe((data) => {
      this.chatData = data;

      if (this.chatData?.participants?.length === 1) {
        this.loadPrivateChat();
      } else if (this.chatData?.participants?.length > 1) {
        this.loadParticipantUserData().then(() => {
          this.processParticipantUserData();
        });
      }
    });

    this.firestoreService
      .getUserData(this.firestoreService.currentuid)
      .then((user) => {
        this.currentUser = user;
      });

      setTimeout(() => {
        this.delayPassed = true;
      }, 125);
  }

  processParticipantUserData() {
    if (this.participantUser && this.participantUser.length > 0) {
      const otherUserID = this.participantUser[0]['uid'];
      this.chatService.checkAndSetParticipants(otherUserID);
    }
  }


  ngOnDestroy(): void {
    this.messages = [];
    if (this.emojiPickerChatReactionSubscription) {
      this.emojiPickerChatReactionSubscription.unsubscribe();
    }

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

    if (this.clearMessagesSubscription) {
      this.clearMessagesSubscription.unsubscribe();
    }
    this.stopListening();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.userDetails != '' && changes['userDetails']) {
      this.messages = this.chatService.messages;
    }
    this.scrollToBottom();
  }

  clearVariables() {
    this.messages = [];
  }

  async deleteMessage(index: any, messageID: any) {
    try {
      if (!this.firestore) {
        throw new Error('Firestore instance is not defined.');
      }
      if (!this.currentDocID) {
        throw new Error('CurrentDocID is not defined.');
      }
      if (!messageID) {
        throw new Error('Message ID is not defined.');
      }
      const messageDocRef = doc(this.firestore,'newchats', this.currentDocID,'messages', messageID );
      const messageDocSnap = await getDoc(messageDocRef);

      if (messageDocSnap.exists()) {
        const messageData = messageDocSnap.data();
        const threadDocRef = doc( this.firestore,'threads', messageData['threadID']
        );
        const threadDocSnap = await getDoc(threadDocRef);

        if (threadDocSnap.exists()) {
          const threadMessagesCollectionRef = collection(this.firestore,`threads/${messageData['threadID']}/messages`);
          const threadMessagesSnap = await getDocs(threadMessagesCollectionRef);
          for (const doc of threadMessagesSnap.docs) {await deleteDoc(doc.ref); }
          await deleteDoc(threadDocRef);
          this.threadService.displayThread = false;
        }
        await deleteDoc(messageDocRef);
      }

      this.menuClosed(index);
    } catch (error) {
      this.menuClosed(index);
    }
    this.chatService.checkAndSetParticipants(this.chatService.participantID)
  }

  scrollToBottom(): void {
    try {
      if (this.scrollContainer && this.scrollContainer.nativeElement) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
    }
  }

  async loadChatMessages(docID: any) {
    const docRef = doc(this.firestore, 'newchats', docID);
    this.currentDocID = docID;

    this.unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const messagesRef = collection(this.firestore, 'newchats', docID,'messages');
        this.unsubscribe = onSnapshot(messagesRef, async (messagesSnap) => {
          const messagesMap = new Map();
          const messagePromises = messagesSnap.docs.map(async (messageDoc) => {
            let messageData = messageDoc.data();
            await this.countThreadMessages(messageData['threadID'], messageDoc.id, docID)
            messageData['id'] = messageDoc.id;
            if (messageData['createdAt']) {
              if (messageData['senderID']) {
                const senderID = messageData['senderID'];
                const senderData = await this.loadSenderData(senderID);
                messageData['senderName'] = senderData ? senderData.username: 'Unknown';
                messageData['senderPhoto'] = senderData ? senderData.photo : null;
              }
              const reactionsRef = collection( this.firestore, 'newchats', docID, 'messages', messageData['id'], 'emojiReactions');
              const reactionsSnap = await getDocs(reactionsRef);
              const reactions = reactionsSnap.docs.map((doc) => doc.data());
              messageData['emojiReactions'] = reactions;
              messagesMap.set(messageData['id'], messageData);
            }
          });
          await Promise.all(messagePromises);
          this.messages = Array.from(messagesMap.values()).sort(
            (a: any, b: any) => a.createdAt - b.createdAt
          );
        });
      }
    });
  }


  async countThreadMessages(threadID: any, messageID: any, docID: any) {
    const threadsRef = collection(this.firestore, 'threads', threadID, 'messages');
    this.unsubscribe = onSnapshot(threadsRef, (snapshot) => {
      const messageDocRef = doc(this.firestore, 'newchats', docID, 'messages', messageID);
      const adjustedSize = snapshot.size - 1;
      const threadCounter = adjustedSize === 1 ? '1 Antwort' : `${adjustedSize} Antworten`;
      updateDoc(messageDocRef, {
        threadCounter: threadCounter
      })
    });
  }

   stopListening() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }


  async loadSenderData(senderID: any) {
    const docRef = doc(this.firestore, 'users', senderID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const senderData = docSnap.data();
      return { username: senderData['username'], photo: senderData['photo'] };
    } else {
      return null;
    }
  }

  async loadPrivateChat() {
    this.currentUserID = localStorage.getItem('uid');
    if (this.currentUserID) {
      const docRef = doc(this.firestore, 'users', this.currentUserID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        this.participantUser = [
          { email: userData['email'],
            signUpdate: userData['signUpdate'],
            logIndate: userData['logIndate'],
            logOutDate: userData['logOutDate'],
            photo: userData['photo'],
            uid: userData['uid'],
            username: userData['username'],
          },
        ];
      } else {
        window.location.reload();
      }
    }
  }

  async loadParticipantUserData() {
    this.currentUserID = localStorage.getItem('uid');
    if (this.chatData && this.chatData.participants) {
      const otherParticipant = this.chatData.participants.find(
        (participant: string) => participant !== this.currentUserID
      );
      if (otherParticipant) {
        const docRef = doc(this.firestore, 'users', otherParticipant);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          this.participantUser = [
            {
              email: userData['email'],
              signUpdate: userData['signUpdate'],
              logIndate: userData['logIndate'],
              logOutDate: userData['logOutDate'],
              photo: userData['photo'],
              uid: userData['uid'],
              username: userData['username'],
            },
          ];
          return userData['uid'];
        } else {
          window.location.reload();
        }
      }
    }
    return null;
  }


  async getMessageForSpefifiedEmoji(emoji: any, currentUserID: any, messageID: any) {
    const emojiReactionID = emoji.id;
    const emojiReactionDocRef = doc(this.firestore, 'newchats', this.currentChatID, 'messages', messageID, 'emojiReactions',emojiReactionID);

    this.uploadNewEmojiReaction(emoji, currentUserID, emojiReactionDocRef);
  }

  async uploadNewEmojiReaction(
    emoji: any,
    currentUserID: any,
    emojiReactionDocRef: any
  ) {
    const docSnapshot = await getDoc(emojiReactionDocRef);

    if (docSnapshot.exists()) {
      const reactionDocData: any = docSnapshot.data();
      reactionDocData.emojiCounter++;
      reactionDocData.reactedBy.push(currentUserID);

      await updateDoc(emojiReactionDocRef, {
        emojiCounter: reactionDocData.emojiCounter,
        reactedBy: reactionDocData.reactedBy,
      });
    } else {
      const emojiReactionData = {
        emojiIcon: emoji.native,
        reactedBy: [currentUserID],
        emojiCounter: 1,
        emoji: emoji,
      };
      await setDoc(emojiReactionDocRef, emojiReactionData);
    }
    this.loadChatMessages(this.currentDocID);
  }

  async addOrDeleteReaction(emoji: any, currentUserID: any, messageID: any) {
    const docRef = doc(this.firestore, 'newchats', this.currentDocID,'messages', messageID, 'emojiReactions', emoji.id);
    const docSnap = await getDoc(docRef);
    const threadDocRef = doc(this.firestore, 'newchats', this.currentDocID, 'messages', messageID);
    const threadDocSnap = await getDoc(threadDocRef);

    if (threadDocSnap.exists()) {
      const messageData = threadDocSnap.data();
      if (messageData) {
        const threadID = messageData['threadID'];
      }
    }

    if (docSnap.exists()) {
      const reactionData = docSnap.data();
      const reactedByArray = reactionData['reactedBy'] || [];

      if (reactedByArray.includes(currentUserID)) {
        this.deleteEmojireaction(emoji, currentUserID, messageID);
      } else {
        this.getMessageForSpefifiedEmoji(emoji, currentUserID, messageID);
      }
    }
  }

  async deleteEmojireaction(emoji: any, currentUserID: any, messageID: any) {
    const docRef = doc(this.firestore, 'newchats', this.currentDocID, 'messages', messageID, 'emojiReactions', emoji.id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const reactionData = docSnap.data();
      reactionData['emojiCounter']--;
      reactionData['reactedBy'].splice(currentUserID);

      await updateDoc(docRef, { emojiCounter: reactionData['emojiCounter'], reactedBy: reactionData['reactedBy']});

      await this.loadChatMessages(this.currentDocID);
    }
  }

  openEmojiMartPicker(messageID: any) {
    this.openEmojiPickerChatReaction = true;
    this.emojiReactionMessageID = messageID;
    this.chatService.emojiPickerChatReaction(true);
  }

  addEmoji(event: any) {
    const currentUserID = localStorage.getItem('uid');
    this.getMessageForSpefifiedEmoji(event.emoji, currentUserID, this.emojiReactionMessageID );
  }

  closeEmojiMartPicker() {
    this.emojiReactionMessageID = '';
    this.openEmojiPickerChatReaction = false;
    this.chatService.emojiPickerChatReaction(false);
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

  async onMouseEnter(reaction: any, messageIndex: number, reactionIndex: number) {
    if (!this.showReactedBy[messageIndex]) {
      this.showReactedBy[messageIndex] = [];
    }
    this.showReactedBy[messageIndex][reactionIndex] = []
    const reactedBy = Array.isArray(reaction.reactedBy) ? reaction.reactedBy : [reaction.reactedBy];
    for (const userID of reactedBy) {
      const docRef = doc(this.firestore, "users", userID);
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userDetails = docSnap.data();
          this.showReactedBy[messageIndex][reactionIndex].push(userDetails['username']);
        }
      } catch (error) {
      }
    }
  }

  onMouseLeave(messageIndex: number, reactionIndex: number) {
    this.showReactedBy[messageIndex][reactionIndex] = [];
  }

  async openContactInfoDialog(uid: any) {
    let allUsers = await this.firestoreService.getAllUsers();
    let userDetails = allUsers.filter((user) => user.uid == uid);
    this.dialog.open(DialogContactInfoComponent, {
      data: userDetails[0],
    });
  }

  openThread(message: any) {
    this.firestoreService.threadType ='chat';
    this.threadService.getMessage(message, this.currentChatID);
    this.chatService.lastOpenedChat = true;
    if(!this.firestoreService.isScreenWide) {
      this.chatService.showOwnChat = false;
    } else if(!this.firestoreService.isScreenWide1300px) {
      this.chatService.showOwnChat = false;
    }
  }

  currentTime(currentMessageTime: any): boolean {
    const currentDate = new Date();
    const currentDateMilliseconds = currentDate.getTime();
    const timestampMilliseconds = currentMessageTime;
    const differenceMilliseconds = currentDateMilliseconds - timestampMilliseconds;
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

  editMessage(index: number) {
    this.originalMessageContent = this.messages[index].message;
    this.isEditingArray[index] = true;
  }

  cancelEdit(index: number) {
    this.messages[index].message = this.originalMessageContent;
    this.isEditingArray[index] = false;
  }

  async saveEdit(index: number, editMessage: any, messageID: any) {
    this.isEditingArray[index] = false;
    const messageDoc = doc(this.firestore, 'newchats', this.currentChatID, 'messages', messageID);
    const messageDocSnapshot = await getDoc(messageDoc);

    if (messageDocSnapshot.exists()) {
      await updateDoc(messageDoc, { message: editMessage,});
      this.menuClosed(index);
      await this.loadChatMessages(this.currentDocID);
    }
  }
}
