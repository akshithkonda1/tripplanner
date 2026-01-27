import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { wsService } from '../services/websocket';

interface ChatScreenProps {
  route: {
    params: {
      tripId: string;
      userId: string;
    };
  };
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ route }) => {
  const { tripId, userId } = route.params;
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to WebSocket
    wsService.connect(tripId, userId)
      .then(() => {
        setIsConnected(true);

        // Add welcome message from Sam
        setMessages([{
          _id: 'welcome',
          text: "Hey! I'm Sam, your road trip planning assistant. Tell me about your trip - where are you heading, and what kind of experience are you looking for?",
          createdAt: new Date(),
          user: {
            _id: 'sam',
            name: 'Sam'
          }
        }]);
      })
      .catch(error => {
        console.error('Failed to connect:', error);
      });

    // Listen for messages from Sam
    wsService.onMessage((data) => {
      const newMessage: IMessage = {
        _id: Math.random().toString(),
        text: data.message,
        createdAt: new Date(data.timestamp),
        user: {
          _id: 'sam',
          name: 'Sam'
        }
      };
      setMessages(previousMessages =>
        GiftedChat.append(previousMessages, [newMessage])
      );
    });

    return () => {
      wsService.offMessage();
      wsService.disconnect();
    };
  }, [tripId, userId]);

  const onSend = useCallback((newMessages: IMessage[] = []) => {
    // Add user message to UI immediately
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, newMessages)
    );

    // Send to backend
    if (newMessages[0]) {
      wsService.sendMessage(newMessages[0].text);
    }
  }, []);

  return (
    <View style={styles.container}>
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{
          _id: userId,
        }}
        placeholder="Ask Sam anything..."
        alwaysShowSend
        showAvatarForEveryMessage
        renderUsernameOnMessage
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  }
});
