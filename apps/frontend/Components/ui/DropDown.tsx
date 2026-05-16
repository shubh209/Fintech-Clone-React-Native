import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Menu } from 'react-native-paper';
import Colors from '@/constants/Colors';
import RoundButton from './RoundButton';

const Dropdown = () => {
  const [visible, setVisible] = useState(false);

  const toggleMenu = () => setVisible((current) => !current);
  const closeMenu = () => setVisible(false);

  return (
    <View style={styles.container}>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={
          <RoundButton
            icon="ellipsis-horizontal"
            text="More"
            onPress={toggleMenu}
            accentColor="#EFEFF7"
            iconColor={Colors.dark}
          />
        }
        contentStyle={styles.menu}
      >
        <Menu.Item
          onPress={() => {
            console.log('Statement');
            closeMenu();
          }}
          title="Statement"
        />
        <Menu.Item
          onPress={() => {
            console.log('Converter');
            closeMenu();
          }}
          title="Converter"
        />
        <Menu.Item
          onPress={() => {
            console.log('Background');
            closeMenu();
          }}
          title="Background"
        />
        <Menu.Item
          onPress={() => {
            console.log('Add new account');
            closeMenu();
          }}
          title="Add new account"
        />
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  menu: {
    backgroundColor: 'white',
    borderRadius: 12,
  },
});

export default Dropdown;
