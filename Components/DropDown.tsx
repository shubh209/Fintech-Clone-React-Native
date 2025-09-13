import React, { useState } from 'react';
import { View } from 'react-native';
import { Menu } from 'react-native-paper';
import RoundButton from './RoundButton';

const Dropdown = () => {
  const [visible, setVisible] = useState(false);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  return (
    <View style={{ flexDirection: 'row' }}>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={
          <RoundButton
            icon="ellipsis-horizontal"
            text="More"
            onPress={openMenu}
          />
        }
        contentStyle={{ backgroundColor: 'white', borderRadius: 10 }}
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

export default Dropdown;
