import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Share,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {GroupChatHeader} from '../components/GroupChatHeader';
import {MessageBubble} from '../components/MessageBubble';
import {TypingIndicator} from '../components/TypingIndicator';
import {AddParticipantModal} from '../components/AddParticipantModal';
import {wsService} from '../services/websocket';

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  type?: 'text' | 'itinerary_update' | 'poll' | 'location';
  metadata?: any;
}

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
}

interface GroupChatScreenProps {
  route: {
    params: {
      tripId: string;
      tripName: string;
      userId: string;
    };
  };
  navigation: any;
}

export const GroupChatScreen: React.FC<GroupChatScreenProps> = ({
  route,
  navigation,
}) => {
  const {tripId, tripName, userId} = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [typingUsers, _setTypingUsers] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeChat();
    return () => {
      wsService.disconnect();
    };
    // initializeChat is intentionally excluded: it's redefined every render
    // and only needs to run once per (tripId, userId) pair.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, userId]);

  const initializeChat = async () => {
    await wsService.connect(tripId, userId);

    // Listen for group messages
    wsService.onGroupMessage(data => {
      const newMessage: Message = {
        id: data.messageId,
        text: data.message,
        timestamp: new Date(data.timestamp),
        user: {
          id: data.userId,
          name: data.userName,
          avatar: data.userAvatar,
        },
        type: data.type,
        metadata: data.metadata,
      };
      setMessages(prev => [...prev, newMessage]);
    });

    // Listen for Sam's responses
    wsService.onMessage(data => {
      const samMessage: Message = {
        id: `sam_${Date.now()}`,
        text: data.message,
        timestamp: new Date(data.timestamp),
        user: {
          id: 'sam',
          name: 'Sam',
          avatar: undefined, // Use default Sam avatar
        },
        type: data.type,
        metadata: data.metadata,
      };
      setMessages(prev => [...prev, samMessage]);
    });

    // Listen for typing indicators
    // In production, implement typing indicator events

    // Load initial messages and participants
    // In production, fetch from API
    setParticipants([
      {id: userId, name: 'You', isOnline: true},
      {id: 'sam', name: 'Sam (AI)', isOnline: true},
    ]);

    // Welcome message from Sam
    setMessages([
      {
        id: 'welcome',
        text: "Hey everyone! I'm Sam, your road trip planning assistant. Let's plan an amazing trip together!",
        timestamp: new Date(),
        user: {id: 'sam', name: 'Sam'},
      },
    ]);
  };

  const sendMessage = useCallback(() => {
    if (!inputText.trim()) {
      return;
    }

    const newMessage: Message = {
      id: `${userId}_${Date.now()}`,
      text: inputText.trim(),
      timestamp: new Date(),
      user: {id: userId, name: 'You'},
    };

    setMessages(prev => [...prev, newMessage]);
    wsService.sendMessage(inputText.trim());
    setInputText('');
  }, [inputText, userId]);

  const handleTextChange = (text: string) => {
    setInputText(text);

    // Send typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // In production, emit typing event
    typingTimeoutRef.current = setTimeout(() => {
      // Stop typing indicator
    }, 2000);
  };

  const handleAddParticipant = () => {
    setShowAddModal(true);
  };

  const handleInvite = (contact: {id: string; name: string; email: string}) => {
    // In production, send invite via API
    setParticipants(prev => [
      ...prev,
      {id: contact.id, name: contact.name, isOnline: false},
    ]);
    setShowAddModal(false);
  };

  const handleShareLink = async () => {
    try {
      await Share.share({
        message: `Join my trip "${tripName}" on Trippy! https://trippy.app/join/${tripId}`,
        title: `Join ${tripName}`,
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
    setShowAddModal(false);
  };

  const handleViewDetails = () => {
    // There's no dedicated trip-details screen yet; show a quick summary
    // instead of navigating to a route that doesn't exist.
    Alert.alert(
      tripName,
      `Trip ID: ${tripId}\n${participants.length} participants`,
    );
  };

  const handleItineraryPress = () => {
    navigation.navigate('TripTabs', {screen: 'Map', params: {tripId}});
  };

  const renderMessage = ({item, index}: {item: Message; index: number}) => {
    const isCurrentUser = item.user.id === userId;
    const showAvatar =
      index === 0 || messages[index - 1].user.id !== item.user.id;

    return (
      <MessageBubble
        message={item}
        isCurrentUser={isCurrentUser}
        showAvatar={showAvatar}
        onItineraryPress={handleItineraryPress}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <GroupChatHeader
        tripName={tripName}
        participants={participants}
        onAddParticipant={handleAddParticipant}
        onViewDetails={handleViewDetails}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({animated: true})
        }
      />

      <TypingIndicator users={typingUsers} />

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton}>
          <Icon name="add-circle-outline" size={28} color="#007AFF" />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          placeholder="Message..."
          value={inputText}
          onChangeText={handleTextChange}
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            !inputText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim()}>
          <Icon
            name="send"
            size={24}
            color={inputText.trim() ? '#007AFF' : '#ccc'}
          />
        </TouchableOpacity>
      </View>

      <AddParticipantModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onInvite={handleInvite}
        onShareLink={handleShareLink}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messageList: {
    paddingVertical: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  attachButton: {
    padding: 4,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    fontSize: 16,
  },
  sendButton: {
    padding: 4,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
