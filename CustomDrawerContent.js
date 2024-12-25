// CustomDrawerContent.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';

const CustomDrawerContent = (props) => {
  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Task Manager</Text>
      </View>
      <DrawerItemList {...props} />
      {/* Custom Drawer Items */}
      <TouchableOpacity style={styles.customItem}>
        <Text style={styles.itemText}>Custom Item</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 20,
    backgroundColor: '#644de9',
  },
  headerText: {
    fontSize: 24,
    color: '#fff',
  },
  customItem: {
    padding: 20,
    backgroundColor: '#f4f4f4',
    marginTop: 10,
  },
  itemText: {
    fontSize: 18,
  },
});

export default CustomDrawerContent;
