import React, {useState, useEffect, useCallback} from 'react';
import {View, StyleSheet, Text, TouchableOpacity} from 'react-native';
import {GiftedChat, IMessage} from 'react-native-gifted-chat';
import Icon from 'react-native-vector-icons/Ionicons';
import {wsService} from '../services/websocket';

interface ChatScreenProps {
  route: {
    params: {
      tripId: string;
      userId: string;
      tripName?: string;
    };
  };
  navigation: any;
}

// There are no bundled avatar images yet, so render initials on a colored
// circle instead of require()-ing image assets that don't exist.
function InitialsAvatar(props: {currentMessage?: IMessage}) {
  const name = props.currentMessage?.user?.name || '?';
  return (
    <View style={styles.avatarCircle}>
      <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

export const ChatScreen: React.FC<ChatScreenProps> = ({route, navigation}) => {
  const {tripId, userId, tripName} = route.params;
  const [messages, setMessages] = useState<IMessage[]>([]);

  useEffect(() => {
    wsService
      .connect(tripId, userId)
      .then(() => {
        setMessages([
          {
            _id: 'welcome',
            text: "Hey! I'm Sam, your road trip planning assistant. Tell me about your trip!",
            createdAt: new Date(),
            user: {_id: 'sam', name: 'Sam'},
          },
        ]);
      })
      .catch(error => {
        console.error('Failed to connect:', error);
      });

    wsService.onMessage(data => {
      const newMessage: IMessage = {
        _id: Math.random().toString(),
        text: data.message,
        createdAt: new Date(data.timestamp || Date.now()),
        user: {_id: 'sam', name: 'Sam'},
      };
      setMessages(previousMessages =>
        GiftedChat.append(previousMessages, [newMessage]),
      );
    });

    return () => {
      wsService.disconnect();
    };
  }, [tripId, userId]);

  const onSend = useCallback((newMessages: IMessage[] = []) => {
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, newMessages),
    );

    if (newMessages[0]) {
      wsService.sendMessage(newMessages[0].text);
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {tripName || 'Trip Chat'}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() =>
              navigation.navigate('GroupChat', {
                tripId,
                tripName: tripName || 'My Trip',
                userId,
              })
            }>
            <Icon name="people-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('NotificationSettings')}>
            <Icon name="settings-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{_id: userId}}
        placeholder="Ask Sam anything..."
        alwaysShowSend
        showAvatarForEveryMessage
        renderUsernameOnMessage
        renderAvatar={InitialsAvatar}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
