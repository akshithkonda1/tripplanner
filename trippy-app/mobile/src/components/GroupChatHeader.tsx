import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
}

interface GroupChatHeaderProps {
  tripName: string;
  participants: Participant[];
  onAddParticipant: () => void;
  onViewDetails: () => void;
}

export const GroupChatHeader: React.FC<GroupChatHeaderProps> = ({
  tripName,
  participants,
  onAddParticipant,
  onViewDetails
}) => {
  const onlineCount = participants.filter(p => p.isOnline).length;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.titleSection} onPress={onViewDetails}>
        <Text style={styles.tripName}>{tripName}</Text>
        <Text style={styles.participantCount}>
          {participants.length} participants ({onlineCount} online)
        </Text>
      </TouchableOpacity>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.avatarScroll}
      >
        {participants.slice(0, 5).map((participant) => (
          <View key={participant.id} style={styles.avatarContainer}>
            {participant.avatar ? (
              <Image
                source={{ uri: participant.avatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>
                  {participant.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {participant.isOnline && <View style={styles.onlineIndicator} />}
          </View>
        ))}

        {participants.length > 5 && (
          <View style={[styles.avatar, styles.moreAvatar]}>
            <Text style={styles.moreText}>+{participants.length - 5}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.avatar, styles.addButton]}
          onPress={onAddParticipant}
        >
          <Icon name="add" size={20} color="#007AFF" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  titleSection: {
    marginBottom: 12
  },
  tripName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  participantCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  avatarScroll: {
    flexDirection: 'row'
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 8
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0'
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF'
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CD964',
    borderWidth: 2,
    borderColor: '#fff'
  },
  moreAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    marginRight: 8
  },
  moreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666'
  },
  addButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed'
  }
});
