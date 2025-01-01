import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const TopTabs = () => {
  const [selectedTab, setSelectedTab] = useState('All');

  const tabs = ['All', 'Personal','Group' ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tabButton,
            selectedTab === tab && styles.selectedTabButton,
          ]}
          onPress={() => setSelectedTab(tab)}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === tab && styles.selectedTabText,
            ]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  selectedTabButton: {
    backgroundColor: '#007BFF',
  },
  tabText: {
    fontSize: 16,
    color: '#000000',
  },
  selectedTabText: {
    color: '#ffffff',
  },
});

export default TopTabs;
