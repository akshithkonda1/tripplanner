import React from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface MessageBubbleProps {
  message: {
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
  };
  isCurrentUser: boolean;
  showAvatar: boolean;
  onItineraryPress?: () => void;
  onPollVote?: (optionId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isCurrentUser,
  showAvatar,
  onItineraryPress,
  onPollVote,
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  };

  const renderContent = () => {
    switch (message.type) {
      case 'itinerary_update':
        return (
          <TouchableOpacity
            style={styles.itineraryCard}
            onPress={onItineraryPress}>
            <Icon name="map-outline" size={24} color="#007AFF" />
            <View style={styles.itineraryContent}>
              <Text style={styles.itineraryTitle}>Itinerary Updated</Text>
              <Text style={styles.itinerarySubtitle}>{message.text}</Text>
            </View>
            <Icon name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        );

      case 'poll':
        return (
          <View style={styles.pollCard}>
            <Text style={styles.pollQuestion}>{message.text}</Text>
            {message.metadata?.options?.map((option: any) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.pollOption,
                  option.voted && styles.pollOptionVoted,
                ]}
                onPress={() => onPollVote?.(option.id)}>
                <Text style={styles.pollOptionText}>{option.text}</Text>
                <Text style={styles.pollVoteCount}>{option.votes} votes</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'location':
        return (
          <View style={styles.locationCard}>
            <Icon name="location" size={20} color="#FF6B6B" />
            <View style={styles.locationContent}>
              <Text style={styles.locationName}>{message.metadata?.name}</Text>
              <Text style={styles.locationAddress}>
                {message.metadata?.address}
              </Text>
            </View>
          </View>
        );

      default:
        return <Text style={styles.messageText}>{message.text}</Text>;
    }
  };

  return (
    <View
      style={[
        styles.container,
        isCurrentUser ? styles.containerRight : styles.containerLeft,
      ]}>
      {!isCurrentUser && showAvatar && (
        <View style={styles.avatarContainer}>
          {message.user.avatar ? (
            <Image source={{uri: message.user.avatar}} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>
                {message.user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      )}

      {!isCurrentUser && !showAvatar && <View style={styles.avatarSpacer} />}

      <View style={styles.contentContainer}>
        {!isCurrentUser && showAvatar && (
          <Text style={styles.userName}>{message.user.name}</Text>
        )}

        <View
          style={[
            styles.bubble,
            isCurrentUser ? styles.bubbleRight : styles.bubbleLeft,
            message.type && message.type !== 'text' && styles.bubbleSpecial,
          ]}>
          {renderContent()}
        </View>

        <Text
          style={[
            styles.timestamp,
            isCurrentUser ? styles.timestampRight : styles.timestampLeft,
          ]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  containerLeft: {
    justifyContent: 'flex-start',
  },
  containerRight: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  avatarSpacer: {
    width: 40,
  },
  contentContainer: {
    maxWidth: '75%',
  },
  userName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    marginLeft: 12,
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleLeft: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  bubbleRight: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  bubbleSpecial: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  timestampLeft: {
    marginLeft: 12,
  },
  timestampRight: {
    textAlign: 'right',
    marginRight: 12,
  },
  itineraryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  itineraryContent: {
    flex: 1,
    marginLeft: 12,
  },
  itineraryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itinerarySubtitle: {
    fontSize: 12,
    color: '#666',
  },
  pollCard: {
    padding: 8,
  },
  pollQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  pollOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
  },
  pollOptionVoted: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  pollOptionText: {
    fontSize: 14,
    color: '#333',
  },
  pollVoteCount: {
    fontSize: 12,
    color: '#666',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  locationContent: {
    marginLeft: 12,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  locationAddress: {
    fontSize: 12,
    color: '#666',
  },
});
