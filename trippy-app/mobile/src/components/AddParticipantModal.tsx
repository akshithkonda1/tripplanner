import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface Contact {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AddParticipantModalProps {
  visible: boolean;
  onClose: () => void;
  onInvite: (contact: Contact) => void;
  onShareLink: () => void;
}

export const AddParticipantModal: React.FC<AddParticipantModalProps> = ({
  visible,
  onClose,
  onInvite,
  onShareLink
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setContacts([]);
      return;
    }

    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      setContacts([
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
        { id: '3', name: 'Bob Wilson', email: 'bob@example.com' }
      ].filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.email.toLowerCase().includes(query.toLowerCase())
      ));
      setIsSearching(false);
    }, 500);
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => onInvite(item)}
    >
      <View style={styles.contactAvatar}>
        <Text style={styles.contactInitial}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactEmail}>{item.email}</Text>
      </View>
      <Icon name="add-circle" size={24} color="#007AFF" />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add Participant</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email"
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {isSearching && (
            <ActivityIndicator size="small" color="#007AFF" />
          )}
        </View>

        <TouchableOpacity style={styles.shareLinkButton} onPress={onShareLink}>
          <Icon name="link" size={24} color="#007AFF" />
          <View style={styles.shareLinkContent}>
            <Text style={styles.shareLinkTitle}>Share Invite Link</Text>
            <Text style={styles.shareLinkSubtitle}>
              Anyone with the link can join
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Search Results</Text>

        {contacts.length > 0 ? (
          <FlatList
            data={contacts}
            renderItem={renderContact}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.contactList}
          />
        ) : searchQuery.length >= 2 && !isSearching ? (
          <View style={styles.emptyState}>
            <Icon name="person-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No contacts found</Text>
            <Text style={styles.emptySubtext}>
              Try a different search or share the invite link
            </Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF'
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  placeholder: {
    width: 50
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 10
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16
  },
  shareLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12
  },
  shareLinkContent: {
    flex: 1,
    marginLeft: 12
  },
  shareLinkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  shareLinkSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12
  },
  contactList: {
    paddingHorizontal: 16
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  contactInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff'
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333'
  },
  contactEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8
  }
});
