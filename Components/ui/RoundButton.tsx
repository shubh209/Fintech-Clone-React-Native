import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import React, { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

type RoundButtonProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  text: string;
  onPress?: () => void;
  accentColor?: string;
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
};

const RoundButton = ({
  text,
  icon,
  onPress,
  accentColor = Colors.lightGray,
  iconColor = Colors.dark,
  style,
}: RoundButtonProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.76}
      style={[styles.container, style]}
      onPress={onPress}
    >
      <View style={[styles.circle, { backgroundColor: accentColor }]}>
        <Ionicons name={icon} size={28} color={iconColor} />
      </View>
      <Text style={styles.label}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 70,
  },
  circle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    textAlign: 'center',
  },
});

export default RoundButton;
