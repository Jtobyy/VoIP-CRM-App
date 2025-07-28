import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  StatusBar,
  Image,
  ScrollView,
  Keyboard,
  ImageBackground,
  TouchableWithoutFeedback
} from 'react-native';
import { colors, typography } from '../../../styles/global';
import Avatar from '../../../components/Avatar';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';

const callLogsData = [
  { 
    id: '1',
    name: '+234 905 332 4369',
    type: 'missed',
    time: '10:33 PM',
    date: 'MON, MAY 6, 2023',
    duration: null,
  },
  {
    id: '2',
    name: 'Customer Lekki 1',
    type: 'outgoing',
    time: '7:03 PM',
    date: 'MON, MAY 6, 2023',
    duration: '2:15',
  },
  {
    id: '3',
    name: 'Adrianna La Cerva',
    type: 'outgoing',
    time: '4:33 PM',
    date: 'MON, MAY 6, 2023',
    duration: '5:20',
    count: 3,
  },
  {
    id: '4',
    name: 'Adetayo Cassandra',
    type: 'outgoing',
    time: '2:15 PM',
    date: 'MON, MAY 6, 2023',
    duration: '1:45',
  },
  {
    id: '5',
    name: 'Alidae Shimana',
    type: 'incoming',
    time: '2:15 PM',
    date: 'SUN, MAY 5, 2023',
    duration: '3:30',
  },
  {
    id: '6',
    name: 'Adedoyin Folakemi',
    type: 'missed',
    time: '10:33 PM',
    date: 'SUN, MAY 5, 2023',
    duration: null,
  },
];

const CallLogs = ({ navigation }) => {
  const [activeFilter, setActiveFilter] = React.useState('All calls');
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredCalls = callLogsData.filter(call => {
    // Filter by search query
    const matchesSearch = call.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by active tab
    if (activeFilter === 'All calls') return matchesSearch;
    if (activeFilter === 'Missed') return matchesSearch && call.type === 'missed';
    if (activeFilter === 'Incoming') return matchesSearch && call.type === 'incoming';
    if (activeFilter === 'Outgoing') return matchesSearch && call.type === 'outgoing';
    
    return matchesSearch;
  });

  // Group calls by date
  const groupedCalls = filteredCalls.reduce((groups, call) => {
    const date = call.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(call);
    return groups;
  }, {});

  const getCallIcon = (type) => {
    switch (type) {
      case 'missed':
        return require('../../../assets/missed.png');
      case 'incoming':
        return require('../../../assets/incoming.png');
      case 'outgoing':
        return require('../../../assets/outgoing.png');
      default:
        return require('../../../assets/outgoing.png');
    }
  };

  const getCallTypeText = (type) => {
    switch (type) {
      case 'missed':
        return 'Missed call';
      case 'incoming':
        return 'Incoming call';
      case 'outgoing':
        return 'Outgoing call';
      default:
        return 'Call';
    }
  };

  const renderCallItem = ({ item }) => (
    <TouchableOpacity style={styles.callItem}>
      <Avatar 
        name={item.name} 
        size={50} 
        style={{ marginRight: 10 }}
      />
      
      <View style={styles.callContent}>
        <View style={styles.callHeader}>
          <Text 
            style={[
              styles.name, 
              item.type === 'missed' && styles.missedName
            ]}
            numberOfLines={1}
          >
            {item.name}
            {item.count && ` (${item.count})`}
          </Text>
          <View style={{flexDirection: 'row', gap: 8}}>
            <Text style={styles.time}>{item.time}</Text>
            <TouchableOpacity>
                <Image
                source={require('../../../assets/info.png')} 
                style={styles.infoIcon}
                resizeMode="contain"
                />
            </TouchableOpacity>
        </View>
        </View>
        
        <View style={styles.callDetails}>
          <Image
            source={getCallIcon(item.type)}
            style={styles.callIcon}
            resizeMode="contain"
          />
          <Text 
            style={[
              styles.callType,
              item.type === 'missed' && styles.missedText
            ]}
          >
            {getCallTypeText(item.type)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDateSection = (date, calls) => (
    <View key={date}>
      <Text style={styles.dateHeader}>{date}</Text>
      <FlatList
        data={calls}
        renderItem={renderCallItem}
        keyExtractor={item => item.id}
        scrollEnabled={false}
      />
    </View>
  );

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
        
        {/* Header */}
        <ImageBackground 
          source={require('../../../assets/header_bg.png')}
          style={styles.header}
          resizeMode="cover"
        >
          <Text style={styles.headerTitle}>Call Logs</Text>
        </ImageBackground>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <FontAwesome6 name="magnifying-glass" iconStyle='solid' size={20} color={colors.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search names or numbers"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {['All calls', 'Missed', 'Incoming', 'Outgoing'].map((filter) => (
              <TouchableOpacity 
                key={filter}
                style={[
                  styles.filterButton, 
                  activeFilter === filter && styles.activeFilter
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[
                  styles.filterButtonText, 
                  activeFilter === filter && styles.activeFilterText
                ]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Call Logs List */}
        <ScrollView 
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(groupedCalls).map(([date, calls]) => 
            renderDateSection(date, calls)
          )}
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    width: '100%',
    height: 130, 
    paddingTop: 80, 
    paddingBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.heading3.fontSize,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginHorizontal: 20,
    marginVertical: 15,
    paddingHorizontal: 15,
    gap: 8
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterScrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  activeFilter: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  listContent: {
    paddingBottom: 80, // Space for bottom nav
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f9f9f9',
    textTransform: 'uppercase',
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  callContent: {
    flex: 1,
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  name: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
  },
  missedName: {
    color: '#FF3B30',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  callDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callIcon: {
    width: 16,
    height: 16,
  },
  callType: {
    fontSize: 14,
    color: '#666',
  },
  missedText: {
    color: '#FF3B30',
  },
  infoButton: {
    padding: 10,
  },
  infoIcon: {
    width: 18,
    height: 18,
  },
});

export default CallLogs;